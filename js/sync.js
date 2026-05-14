// ============================================================
// ATHENA — Cloud Sync (Firestore)
// Pushes the full AppState payload to Firestore on every save
// and pulls on app load. Uses server timestamps + Firestore's
// hasPendingWrites flag to avoid echo-back on the listener.
//
// Data structure:
//   users/{uid}/data/state  →  { ...appStatePayload, _ts: serverTimestamp }
// ============================================================

const CloudSync = {
  _db:       null,
  _enabled:  false,
  _pushTimer: null,

  // ── Init ─────────────────────────────────────────────────
  init() {
    if (!Auth.isAuthenticated || Auth.isLocalOnly) {
      this._enabled = false;
      return;
    }
    try {
      this._db      = firebase.firestore();
      this._enabled = true;
    } catch (e) {
      console.warn('CloudSync: Firestore unavailable —', e.message);
      this._enabled = false;
    }
  },

  get _ref() {
    if (!this._db || !Auth.uid) return null;
    return this._db.doc(`users/${Auth.uid}/data/state`);
  },

  // ── Pull (initial load) ──────────────────────────────────
  // Returns the cloud payload object, or null if unavailable/empty.
  async pull() {
    if (!this._enabled || !this._ref) return null;
    try {
      const snap = await this._ref.get();
      if (!snap.exists) return null;
      const data = snap.data();
      delete data._ts; // Remove Firestore metadata field before applying
      return data;
    } catch (e) {
      console.warn('CloudSync: pull failed —', e.message);
      return null;
    }
  },

  // ── Push (debounced write) ───────────────────────────────
  // Debounced 2 s so rapid consecutive saves (e.g. checking many
  // routine items) result in one Firestore write, not dozens.
  push(payload) {
    if (!this._enabled || !this._ref) return;
    if (this._pushTimer) clearTimeout(this._pushTimer);
    this._pushTimer = setTimeout(() => {
      this._ref
        .set({ ...payload, _ts: firebase.firestore.FieldValue.serverTimestamp() })
        .then(() => this._setSyncStatus('synced'))
        .catch((e) => {
          console.warn('CloudSync: push failed —', e.message);
          this._setSyncStatus('error');
        });
      this._setSyncStatus('syncing');
      this._pushTimer = null;
    }, 2000);
  },

  // ── Real-time listener ───────────────────────────────────
  // Fires when another device pushes an update. We use Firestore's
  // built-in hasPendingWrites flag to skip our own writes and only
  // react to server-confirmed changes from other devices.
  startListener() {
    if (!this._enabled || !this._ref) return;
    this._ref.onSnapshot({ includeMetadataChanges: true }, (snap) => {
      if (!snap.exists) return;
      if (snap.metadata.hasPendingWrites) return; // Our own pending write — ignore

      // At this point the data is server-confirmed and not from us
      const data = snap.data();
      delete data._ts;
      AppState._applyLoaded(data);
      Storage.save(data); // Persist locally too
      if (typeof UI !== 'undefined') UI.updateAll();
      this._setSyncStatus('synced');
    }, (e) => {
      console.warn('CloudSync: listener error —', e.message);
    });
  },

  // ── Sync status badge ────────────────────────────────────
  _setSyncStatus(status) {
    const el = document.getElementById('syncStatus');
    if (!el) return;
    const map = {
      syncing: { text: '🔄 Syncing…',  cls: 'syncing' },
      synced:  { text: '☁ Synced',     cls: 'synced'  },
      error:   { text: '⚠ Sync error', cls: 'error'   }
    };
    const s = map[status] || map.synced;
    el.textContent  = s.text;
    el.className    = `sync-badge ${s.cls}`;
    el.style.display = 'inline-flex';

    // Auto-hide "Synced" after 4 s
    if (status === 'synced') {
      clearTimeout(this._hideTimer);
      this._hideTimer = setTimeout(() => { el.style.display = 'none'; }, 4000);
    }
  }
};
