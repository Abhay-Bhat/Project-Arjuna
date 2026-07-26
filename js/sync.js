// ============================================================
// Skadi -- Cloud Sync (Firestore)
//
// Strategy: pull-on-load + push-on-save + real-time listener.
// - On sign-in: pull() fetches the latest cloud state once.
// - On every AppState.save(): push() writes to Firestore (debounced,
//   diff-only — only fields that actually changed since the last
//   successful push are written, via Firestore update()).
//   Each push is tagged with a per-session _deviceId.
// - startListening() registers an onSnapshot listener after the initial pull.
//   Echo guard: skips snapshots where _deviceId === ours (our own writes).
//   Staleness guard: skips snapshots older than the current local state.
//   This combination prevents the re-render loop that plagued earlier attempts.
// ============================================================

const CloudSync = {
  _db:          null,
  _enabled:     false,
  _pushTimer:   null,
  _hideTimer:   null,
  // Stored in localStorage so every tab in the same browser shares one ID.
  // Prevents cross-tab echo: Tab A saves → Tab B sees its own deviceId → skips.
  _deviceId: (() => {
    const KEY = 'athena_device_id';
    let id = localStorage.getItem(KEY);
    if (!id) { id = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2); localStorage.setItem(KEY, id); }
    return id;
  })(),
  _unsubscribe:      null,
  _lastPulledAt:     null,
  _lastSeenServerMs: 0,
  // BroadcastChannel: same-browser, cross-tab sync (no Firestore round-trip needed)
  _bc: (() => { try { return new BroadcastChannel('athena_sync'); } catch { return null; } })(),
  _btnResetTimer:   null,
  _suppressBC:      false,   // true while applying a received BC message — breaks the re-broadcast loop
  _suppressBCTimer: null,
  _pendingPayload:  null,    // most-recent unsent payload; used by flushPush()
  _lastPushedJsons: null,    // { field: JSON.stringify(value) } — baseline for diff comparison

  init() {
    if (!Auth.isAuthenticated || Auth.isLocalOnly) {
      this._enabled = false;
      return;
    }
    try {
      this._db      = firebase.firestore();
      this._enabled = true;
    } catch (e) {
      console.warn('CloudSync: Firestore unavailable --', e.message);
      this._enabled = false;
      this._setSyncStatus('error');
      return;
    }
    this._registerDevice();
  },

  // Register device presence so the user can see which devices have synced.
  // Writes to users/{uid}/devices/{did} (4 segments — valid Firestore document path).
  _registerDevice() {
    if (!this._db || !Auth.uid) return;
    this._db.doc(`users/${Auth.uid}/devices/${this._deviceId}`)
      .set({
        lastSeen:  firebase.firestore.FieldValue.serverTimestamp(),
        userAgent: navigator.userAgent.slice(0, 200),
        deviceId:  this._deviceId,
      }, { merge: true })
      .catch(() => {});
  },

  // Master state doc — authoritative merged state read by all devices
  get _ref() {
    if (!this._db || !Auth.uid) return null;
    return this._db.doc('users/' + Auth.uid + '/data/state');
  },

  // Per-device state doc — isolated write space; never overwrites another device.
  // Writes to users/{uid}/deviceStates/{did} (4 segments — valid Firestore document path).
  get _deviceRef() {
    if (!this._db || !Auth.uid) return null;
    return this._db.doc(`users/${Auth.uid}/deviceStates/${this._deviceId}`);
  },

  // One-time read on sign-in.
  // Returns:
  //   Object  — cloud data (merge and use)
  //   null    — doc does not exist yet (safe to seed from local)
  //   undefined — error (network/permissions): do NOT overwrite cloud
  async pull() {
    if (!this._enabled || !this._ref) return null;
    try {
      const snap = await this._ref.get();
      if (!snap.exists) return null;
      const data = snap.data();
      // Record server timestamp as baseline for the real-time listener
      this._lastSeenServerMs = data._ts?.toMillis?.() || 0;
      delete data._ts;
      delete data._deviceId;
      this._lastPulledAt = data._savedAt || null;
      // Snapshot pulled data so the post-merge push only writes fields
      // this device actually changed, not the entire merged result.
      this._lastPushedJsons = this._snapshotFields(data);
      return data;
    } catch (e) {
      console.error('CloudSync: pull failed —', e.code || e.message);
      this._setSyncStatus('error');
      return undefined; // distinct from null — caller must NOT push on this
    }
  },

  // ── Diff helpers ───────────────────────────────────────────

  _snapshotFields(payload) {
    const snap = {};
    for (const key of Object.keys(payload)) {
      if (key === '_savedAt') continue;
      snap[key] = JSON.stringify(payload[key]);
    }
    return snap;
  },

  // Returns:
  //   null   — no baseline exists (first push: full set() needed)
  //   false  — nothing changed since last push (skip write entirely)
  //   Object — only the changed fields (use update())
  _computeDiff(payload) {
    if (!this._lastPushedJsons) return null;
    const diff = {};
    let count = 0;
    for (const key of Object.keys(payload)) {
      if (key === '_savedAt') continue;
      const json = JSON.stringify(payload[key]);
      if (json !== this._lastPushedJsons[key]) {
        diff[key] = payload[key];
        count++;
      }
    }
    if (count === 0) return false;
    diff._savedAt = payload._savedAt;
    return diff;
  },

  // Shared write logic for push() and flushPush().
  _doWrite(payload) {
    const diff = this._computeDiff(payload);
    if (diff === false) return;

    this._setSyncStatus('syncing');
    const meta = {
      _deviceId: this._deviceId,
      _ts: firebase.firestore.FieldValue.serverTimestamp()
    };

    const onDone = () => {
      this._lastPushedJsons = this._snapshotFields(payload);
      this._setSyncStatus('synced');
      this._pendingPayload = null;
    };
    const onError = (e) => {
      console.warn('CloudSync: push failed --', e.message);
      this._setSyncStatus('error');
    };
    const fullSet = () => {
      const doc = Object.assign({}, payload, meta);
      if (this._deviceRef) this._deviceRef.set(doc).catch(() => {});
      return this._ref.set(doc);
    };

    if (diff === null) {
      // First push — full document via set()
      fullSet().then(onDone).catch(onError);
    } else {
      // Diff push — only changed fields via update()
      const doc = Object.assign({}, diff, meta);
      if (this._deviceRef) this._deviceRef.update(doc).catch(() => {});
      this._ref.update(doc)
        .then(onDone)
        .catch(e => {
          if (e.code === 'not-found') return fullSet().then(onDone).catch(onError);
          onError(e);
        });
    }
  },

  // Debounced push -- coalesces rapid saves into one Firestore write.
  // Only fields that actually changed since the last successful push are
  // written (via Firestore update()), so checking one checkbox sends ~1 field
  // instead of the entire 30-field state document.
  push(payload) {
    this._pendingPayload = payload; // keep the latest payload for flushPush()
    this._broadcastToTabs(payload); // notify other tabs immediately (works even in local-only mode)
    if (!this._enabled || !this._ref) return;
    if (this._pushTimer) clearTimeout(this._pushTimer);
    this._pushTimer = setTimeout(() => {
      this._doWrite(this._pendingPayload);
      this._pushTimer = null;
    }, 500);
  },

  // Immediately writes any queued push — call on pagehide/visibilitychange:hidden.
  flushPush() {
    if (!this._pendingPayload || !this._enabled || !this._ref) return;
    clearTimeout(this._pushTimer);
    this._pushTimer = null;
    this._doWrite(this._pendingPayload);
  },

  // Cancel any queued push (called when cloud data is newer and just applied).
  cancelPush() {
    clearTimeout(this._pushTimer);
    this._pushTimer = null;
    this._pendingPayload = null;
  },

  startListening() {
    if (!this._enabled || !this._ref || this._unsubscribe) return;
    this._unsubscribe = this._ref.onSnapshot(
      { includeMetadataChanges: true },
      (snap) => {
        // Layer 1: skip in-flight optimistic writes from local cache
        if (!snap.exists || snap.metadata.hasPendingWrites) return;

        const cloudData = snap.data();
        const serverMs  = cloudData._ts?.toMillis?.() || 0;

        // Always advance our server-timestamp baseline (even for own writes),
        // so future updates are compared against the latest known server time.
        const prevServerMs = this._lastSeenServerMs;
        this._lastSeenServerMs = Math.max(this._lastSeenServerMs, serverMs);

        // Layer 2: skip our own confirmed writes (device-ID echo guard)
        if (cloudData._deviceId === this._deviceId) return;

        delete cloudData._ts;
        delete cloudData._deviceId;

        // Layer 3: skip if not newer than last server timestamp we've seen.
        // Uses Firestore server time — immune to device clock differences.
        if (serverMs <= prevServerMs) return;

        // Genuine update from another device.
        // Snapshot local state before applying (fire-and-forget — captures current state).
        if (typeof BackupManager !== 'undefined') BackupManager.create('pre-sync');
        const activeTab   = AppState.currentTab;
        const activeDate  = new Date(AppState.selectedDate);
        const activeMonth = new Date(AppState.calendarMonth);
        // Smart merge: union all arrays, deep-merge all logs — never loses local data.
        const mergedData = AppState._mergeWithCloud(cloudData);
        AppState._applyLoaded(mergedData);
        // Restore UI navigation state — never let a remote device override what the user is viewing
        AppState.currentTab    = activeTab;
        AppState.selectedDate  = activeDate;
        AppState.calendarMonth = activeMonth;
        Storage.save(mergedData);
        // Update diff baseline to the cloud state so the next push only
        // includes fields this device actually changes, not re-echoed cloud data.
        this._lastPushedJsons = this._snapshotFields(cloudData);
        // If there's a queued push (from boot sync), refresh its payload to include
        // this device's changes — prevents the stale push from overwriting B's data.
        if (this._pendingPayload) this._pendingPayload = mergedData;
        // Convergence push: if local had data the sender lacked, push the merged
        // result back so other devices (including the sender) catch up.
        // Array/object length comparison stops the loop — once both sides are equal
        // the merged result equals cloud, so this branch never fires again.
        if (CloudSync._localContributed(mergedData, cloudData)) AppState._doSave();
        if (typeof UI !== 'undefined') {
          UI.updateAll();
        }
        this._setSyncStatus('synced');
      },
      (err) => { console.warn('CloudSync: listener error --', err.message); }
    );
  },

  stopListening() {
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }
    if (this._bc) this._bc.onmessage = null;
  },

  // Starts BroadcastChannel listener for same-browser, cross-tab sync.
  // Safe to call unconditionally — works in local-only mode too.
  startBroadcastListening() {
    if (!this._bc) return;
    this._bc.onmessage = (ev) => {
      const raw = ev.data;
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return;
      // Sanitize via JSON round-trip to strip any prototype chain pollution
      // (__proto__, constructor, etc.) that a malformed message might carry.
      let data;
      try { data = JSON.parse(JSON.stringify(raw)); } catch { return; }
      // Suppress re-broadcasting for long enough to outlast the save (300ms)
      // + push (500ms) debounce chain that UI.updateAll() will trigger.
      this._suppressBC = true;
      clearTimeout(this._suppressBCTimer);
      this._suppressBCTimer = setTimeout(() => { this._suppressBC = false; }, 1500);
      const activeDate  = new Date(AppState.selectedDate);
      const activeMonth = new Date(AppState.calendarMonth);
      AppState._applyLoaded(data);
      // Preserve this tab's date navigation — don't jump because another tab changed dates
      AppState.selectedDate  = activeDate;
      AppState.calendarMonth = activeMonth;
      Storage.save(data);
      if (typeof UI !== 'undefined') {
        UI.updateAll();
      }
      this._setSyncStatus('synced');
    };
  },

  // Returns true if merged has more items than cloud — meaning local contributed
  // data the sender lacked, so we should push the merged result back for convergence.
  // Loop-safe: once both sides are equal, merged === cloud → returns false.
  _localContributed(merged, cloud) {
    const arrs = ['tasks','taskBuckets','goals','investments','financeEntries',
                  'monthlyExpenses','cholesterol','pastimeLog','partnerLog','studyLog','techStudyLog'];
    const objs = ['checkedItems','dailyHistory','healthLog','mindLog',
                  'caLog','careerLog','booksLog','weeklyReviews',
                  'monthlyReviews','dubaiChecklist','upscSubjectProgress','upscSubjectTotals'];
    return arrs.some(k => (merged[k]||[]).length > (cloud[k]||[]).length) ||
           objs.some(k => Object.keys(merged[k]||{}).length > Object.keys(cloud[k]||{}).length);
  },

  _broadcastToTabs(payload) {
    if (!this._bc || this._suppressBC) return;
    try { this._bc.postMessage(payload); } catch {}
  },

  _setSyncStatus(status) {
    // ── brief flash badge in header (write activity indicator) ────────────
    const el = document.getElementById('syncStatus');
    if (el) {
      const map = {
        syncing: { text: 'Syncing...', cls: 'syncing' },
        synced:  { text: 'Synced',     cls: 'synced'  },
        error:   { text: 'Sync error', cls: 'error'   }
      };
      const s = map[status] || map.synced;
      el.textContent   = s.text;
      el.className     = 'sync-badge ' + s.cls;
      el.style.display = 'inline-flex';
      if (status === 'synced') {
        clearTimeout(this._hideTimer);
        this._hideTimer = setTimeout(() => { el.style.display = 'none'; }, 4000);
      }
    }

    // ── persistent status row inside dropdown ─────────────────────────────
    const row   = document.getElementById('syncStatusRow');
    const dot   = document.getElementById('syncStatusDot');
    const label = document.getElementById('syncStatusLabel');
    if (row && dot && label) {
      row.style.display = 'flex';
      dot.className = 'sync-dot ' + (status === 'synced' ? 'synced' : status === 'syncing' ? 'syncing' : 'error');
      if (status === 'syncing') {
        label.textContent = 'Syncing…';
      } else if (status === 'synced') {
        const t = new Date();
        const hh = String(t.getHours()).padStart(2,'0');
        const mm = String(t.getMinutes()).padStart(2,'0');
        label.textContent = `Synced at ${hh}:${mm}`;
        dot.className = 'sync-dot synced';
      } else {
        label.textContent = 'Sync error — check connection';
      }
    }

    // ── sync button in dropdown (reflects live activity) ──────────────────
    const btn  = document.getElementById('syncNowBtn');
    const icon = document.getElementById('syncNowIcon');
    if (!btn || btn.disabled) return; // don't override a manual click in progress
    clearTimeout(this._btnResetTimer);
    btn.classList.remove('syncing', 'synced', 'error');
    if (status === 'syncing') {
      btn.classList.add('syncing');
      if (icon) icon.textContent = '⟳';
    } else if (status === 'synced') {
      btn.classList.add('synced');
      if (icon) icon.textContent = '✓';
      this._btnResetTimer = setTimeout(() => {
        btn.classList.remove('synced');
        if (icon) icon.textContent = '☁';
      }, 3000);
    } else if (status === 'error') {
      btn.classList.add('error');
      if (icon) icon.textContent = '!';
      this._btnResetTimer = setTimeout(() => {
        btn.classList.remove('error');
        if (icon) icon.textContent = '☁';
      }, 4000);
    }
  }
};
