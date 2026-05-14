// ============================================================
// ATHENA -- Cloud Sync (Firestore)
// - push()         : debounced write to Firestore (2 s after last save)
// - pull()         : one-time read on app start to merge cloud data
// - startListener(): listens ONLY for changes from OTHER devices
//                    (echo-backs of our own pushes are ignored)
// ============================================================

const CloudSync = {
  _db:          null,
  _enabled:     false,
  _pushTimer:   null,
  _lastPushedAt: null,  // _savedAt of the last payload WE pushed
  _listening:   false,
  _hideTimer:   null,

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

  // One-time read on login -- returns cloud payload or null
  async pull() {
    if (!this._enabled || !this._ref) return null;
    try {
      const snap = await this._ref.get();
      if (!snap.exists) return null;
      const data = snap.data();
      delete data._ts;
      return data;
    } catch (e) {
      console.warn('CloudSync: pull failed --', e.message);
      return null;
    }
  },

  // Debounced push -- coalesces rapid saves into one Firestore write
  push(payload) {
    if (!this._enabled || !this._ref) return;
    if (this._pushTimer) clearTimeout(this._pushTimer);
    this._pushTimer = setTimeout(() => {
      this._lastPushedAt = payload._savedAt || null; // remember what we sent
      this._ref
        .set(Object.assign({}, payload, { _ts: firebase.firestore.FieldValue.serverTimestamp() }))
        .then(() => this._setSyncStatus('synced'))
        .catch((e) => {
          console.warn('CloudSync: push failed --', e.message);
          this._setSyncStatus('error');
        });
      this._setSyncStatus('syncing');
      this._pushTimer = null;
    }, 2000);
  },

  // Real-time listener -- only reacts to changes from OTHER devices.
  // Two-layer filter:
  //   1. hasPendingWrites = true  -> our write is in-flight, skip
  //   2. data._savedAt matches our last push -> server echo-back, skip
  // Anything that passes both filters is a genuine remote change.
  startListener() {
    if (!this._enabled || !this._ref || this._listening) return;
    this._listening = true;

    this._ref.onSnapshot({ includeMetadataChanges: true }, (snap) => {
      if (!snap.exists) return;
      if (snap.metadata.hasPendingWrites) return;        // layer 1: in-flight write

      const data = snap.data();
      delete data._ts;

      if (data._savedAt && data._savedAt === this._lastPushedAt) return; // layer 2: echo-back

      // Genuine update from another device -- apply silently and re-render
      AppState._applyLoaded(data);
      Storage.save(data);
      if (typeof UI !== 'undefined') UI.updateAll();
      this._setSyncStatus('synced');

    }, (e) => {
      console.warn('CloudSync: listener error --', e.message);
    });
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
