// ============================================================
// ATHENA -- Cloud Sync (Firestore)
//
// Strategy: pull-on-load + push-on-save (no real-time listener).
// - On sign-in: pull() fetches the latest cloud state once.
// - On every AppState.save(): push() writes to Firestore (debounced).
// - No onSnapshot listener: eliminates all re-render / reload issues.
//   Data syncs automatically when the app is opened on another device.
// ============================================================

const CloudSync = {
  _db:        null,
  _enabled:   false,
  _pushTimer: null,
  _hideTimer: null,

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
