// ============================================================
// ATHENA — Storage Engine
// IndexedDB primary (GiB capacity) with localStorage fallback
// ============================================================

const Storage = {
  _db: null,
  _DB_NAME: 'athena_db',
  _DB_VERSION: 3,          // v3: added backups store
  _STORE:      'state',
  _ATTACH:     'attachments',  // blob store for CA article files
  _BACKUP:     'backups',      // rolling auto-snapshots
  _KEY:        'athena_v2',
  _ready:      false,
  _queue:      [],

  // ── Initialise IndexedDB ─────────────────────────────────
  init() {
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        console.warn('IndexedDB not available — falling back to localStorage');
        this._ready = true;
        resolve();
        return;
      }

      const req = indexedDB.open(this._DB_NAME, this._DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this._STORE)) {
          db.createObjectStore(this._STORE);
        }
        // Attachments store: key = attachment ID, value = { name, type, data (ArrayBuffer) }
        if (!db.objectStoreNames.contains(this._ATTACH)) {
          db.createObjectStore(this._ATTACH);
        }
        // Backups store: key = 'backup_<timestamp>', value = { key, timestamp, trigger, deviceId, data }
        if (!db.objectStoreNames.contains(this._BACKUP)) {
          db.createObjectStore(this._BACKUP);
        }
      };

      req.onsuccess = (e) => {
        this._db = e.target.result;
        this._ready = true;
        // Flush any writes that arrived before DB was ready
        this._queue.forEach(fn => fn());
        this._queue = [];
        resolve();
      };

      req.onerror = (e) => {
        console.warn('IndexedDB open failed — falling back to localStorage', e);
        this._ready = true;
        resolve();
      };
    });
  },

  // ── Save (write) ─────────────────────────────────────────
  save(data) {
    const json = JSON.stringify(data);

    if (this._db) {
      const write = () => {
        try {
          const tx = this._db.transaction(this._STORE, 'readwrite');
          tx.objectStore(this._STORE).put(json, this._KEY);
          tx.onerror = () => this._lsSave(json);
        } catch(e) {
          this._lsSave(json);
        }
      };
      if (this._ready) write();
      else this._queue.push(write);
    } else {
      this._lsSave(json);
    }
  },

  // ── Load (read) ───────────────────────────────────────────
  load() {
    return new Promise((resolve) => {
      if (this._db) {
        try {
          const tx  = this._db.transaction(this._STORE, 'readonly');
          const req = tx.objectStore(this._STORE).get(this._KEY);
          req.onsuccess = () => {
            const raw = req.result;
            if (raw) {
              resolve(this._parse(raw));
            } else {
              // Nothing in IDB yet — try localStorage migration
              resolve(this._lsLoad());
            }
          };
          req.onerror = () => resolve(this._lsLoad());
        } catch(e) {
          resolve(this._lsLoad());
        }
      } else {
        resolve(this._lsLoad());
      }
    });
  },

  // ── Storage size estimate ────────────────────────────────
  async getStorageInfo() {
    if (navigator.storage?.estimate) {
      const est = await navigator.storage.estimate();
      return {
        used:  this._fmt(est.usage   || 0),
        quota: this._fmt(est.quota   || 0),
        pct:   est.quota ? Math.round((est.usage / est.quota) * 100) : 0,
        backend: this._db ? 'IndexedDB' : 'localStorage'
      };
    }
    return { used: '—', quota: '—', pct: 0, backend: this._db ? 'IndexedDB' : 'localStorage' };
  },

  _fmt(bytes) {
    if (bytes >= 1e9) return (bytes / 1e9).toFixed(1) + ' GB';
    if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + ' MB';
    if (bytes >= 1e3) return (bytes / 1e3).toFixed(0) + ' KB';
    return bytes + ' B';
  },

  _lsSave(json) {
    try { localStorage.setItem(this._KEY, json); }
    catch(e) { console.error('localStorage save failed:', e); }
  },

  _lsLoad() {
    try {
      const raw = localStorage.getItem(this._KEY);
      return raw ? this._parse(raw) : null;
    } catch(e) { return null; }
  },

  _parse(raw) {
    try { return JSON.parse(raw); }
    catch(e) { return null; }
  },

  // ── Backup storage ───────────────────────────────────────

  // Save a backup snapshot. record = { timestamp, trigger, deviceId, data }
  saveBackup(key, record) {
    return new Promise((resolve) => {
      if (!this._db) { resolve(); return; }
      const rec = { ...record, key };
      try {
        const tx = this._db.transaction(this._BACKUP, 'readwrite');
        tx.objectStore(this._BACKUP).put(rec, key);
        tx.oncomplete = () => resolve();
        tx.onerror    = () => resolve();
      } catch(e) { resolve(); }
    });
  },

  // List all backups sorted newest-first. Returns full records (including data).
  listBackups() {
    return new Promise((resolve) => {
      if (!this._db) { resolve([]); return; }
      try {
        const tx  = this._db.transaction(this._BACKUP, 'readonly');
        const req = tx.objectStore(this._BACKUP).getAll();
        req.onsuccess = () => {
          const all = req.result || [];
          all.sort((a, b) => (b.key > a.key ? 1 : b.key < a.key ? -1 : 0));
          resolve(all);
        };
        req.onerror = () => resolve([]);
      } catch(e) { resolve([]); }
    });
  },

  // Load a single backup by its key.
  loadBackup(key) {
    return new Promise((resolve) => {
      if (!this._db) { resolve(null); return; }
      try {
        const tx  = this._db.transaction(this._BACKUP, 'readonly');
        const req = tx.objectStore(this._BACKUP).get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror   = () => resolve(null);
      } catch(e) { resolve(null); }
    });
  },

  // Delete a single backup.
  deleteBackup(key) {
    return new Promise((resolve) => {
      if (!this._db) { resolve(); return; }
      try {
        const tx = this._db.transaction(this._BACKUP, 'readwrite');
        tx.objectStore(this._BACKUP).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror    = () => resolve();
      } catch(e) { resolve(); }
    });
  },

  // Delete oldest backups beyond maxCount. listBackups() returns newest-first.
  async pruneBackups(maxCount) {
    const all = await this.listBackups();
    if (all.length <= maxCount) return;
    const toDelete = all.slice(maxCount);
    for (const b of toDelete) await this.deleteBackup(b.key);
  },

  // ── Attachment (file blob) storage ───────────────────────

  // Save a File or Blob under a given key (e.g. "ca_attachment_1747000000000")
  saveAttachment(key, file) {
    return new Promise((resolve, reject) => {
      if (!this._db) { reject(new Error('IndexedDB not available')); return; }
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const tx = this._db.transaction(this._ATTACH, 'readwrite');
          tx.objectStore(this._ATTACH).put({
            name: file.name,
            type: file.type,
            size: file.size,
            data: e.target.result   // ArrayBuffer
          }, key);
          tx.oncomplete = () => resolve(key);
          tx.onerror    = () => reject(tx.error);
        } catch(err) { reject(err); }
      };
      reader.readAsArrayBuffer(file);
    });
  },

  // Load an attachment as an object URL for display/download
  loadAttachment(key) {
    return new Promise((resolve, reject) => {
      if (!this._db) { reject(new Error('IndexedDB not available')); return; }
      try {
        const tx  = this._db.transaction(this._ATTACH, 'readonly');
        const req = tx.objectStore(this._ATTACH).get(key);
        req.onsuccess = () => {
          const record = req.result;
          if (!record) { resolve(null); return; }
          const blob = new Blob([record.data], { type: record.type });
          resolve({ url: URL.createObjectURL(blob), name: record.name, type: record.type, size: record.size });
        };
        req.onerror = () => reject(req.error);
      } catch(err) { reject(err); }
    });
  },

  // Delete a stored attachment
  deleteAttachment(key) {
    return new Promise((resolve) => {
      if (!this._db) { resolve(); return; }
      try {
        const tx = this._db.transaction(this._ATTACH, 'readwrite');
        tx.objectStore(this._ATTACH).delete(key);
        tx.oncomplete = () => resolve();
      } catch(e) { resolve(); }
    });
  }
};
