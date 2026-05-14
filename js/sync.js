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
  _deviceId:    Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
  _unsubscribe: null,
  _lastPulledAt: null,

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
      delete data._ts;
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
      async (snap) => {
        // Layer 1: skip in-flight optimistic writes from local cache
        if (!snap.exists || snap.metadata.hasPendingWrites) return;

        const cloudData = snap.data();
        delete cloudData._ts;

        // Layer 2: skip our own confirmed writes (device-ID echo guard)
        if (cloudData._deviceId === this._deviceId) return;
        delete cloudData._deviceId;

        // Layer 3: skip if not newer than current local state
        const localData = await Storage.load();
        const localTs = localData?._savedAt ? new Date(localData._savedAt).getTime() : 0;
        const cloudTs = cloudData._savedAt  ? new Date(cloudData._savedAt).getTime() : 0;
        if (cloudTs <= localTs) return;

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
