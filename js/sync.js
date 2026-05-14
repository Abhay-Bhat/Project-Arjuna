// ============================================================
// ATHENA -- Cloud Sync (Firestore)
//
// Strategy: pull-on-load + push-on-save + real-time listener.
// - On sign-in: pull() fetches the latest cloud state once.
// - On every AppState.save(): push() writes to Firestore (debounced 2s).
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
    }
  },

  get _ref() {
    if (!this._db || !Auth.uid) return null;
    return this._db.doc('users/' + Auth.uid + '/data/state');
  },

  // One-time read on sign-in -- returns cloud payload or null
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
      return data;
    } catch (e) {
      console.warn('CloudSync: pull failed --', e.message);
      return null;
    }
  },

  // Debounced push -- coalesces rapid saves into one Firestore write.
  // Fires 2 s after the LAST save, so checking 10 items in a row = 1 write.
  push(payload) {
    this._broadcastToTabs(payload); // notify other tabs immediately (works even in local-only mode)
    if (!this._enabled || !this._ref) return;
    if (this._pushTimer) clearTimeout(this._pushTimer);
    this._pushTimer = setTimeout(() => {
      this._setSyncStatus('syncing');
      this._ref
        .set(Object.assign({}, payload, {
          _deviceId: this._deviceId,
          _ts: firebase.firestore.FieldValue.serverTimestamp()
        }))
        .then(() => this._setSyncStatus('synced'))
        .catch((e) => {
          console.warn('CloudSync: push failed --', e.message);
          this._setSyncStatus('error');
        });
      this._pushTimer = null;
    }, 2000);
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

        // Genuine update from another device — apply without triggering a push
        AppState._applyLoaded(cloudData);
        Storage.save(cloudData);
        if (typeof UI !== 'undefined') {
          UI.updateAll();
          UI.showToast('Updated from another device');
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
      const data = ev.data;
      if (!data) return;
      AppState._applyLoaded(data);
      Storage.save(data);
      if (typeof UI !== 'undefined') {
        UI.updateAll();
        UI.showToast('Updated from another tab');
      }
      this._setSyncStatus('synced');
    };
  },

  _broadcastToTabs(payload) {
    if (!this._bc) return;
    try { this._bc.postMessage(payload); } catch {}
  },

  _setSyncStatus(status) {
    const el = document.getElementById('syncStatus');
    if (!el) return;
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
};
