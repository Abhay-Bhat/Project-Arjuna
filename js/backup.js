// ============================================================
// Skadi — Backup Manager
// Stores up to MAX_BACKUPS rolling snapshots in IndexedDB.
// Triggers: startup, pre-sync (before cloud overwrites local),
//           scheduled (hourly), manual (user-initiated).
// ============================================================

const BackupManager = {
  MAX_BACKUPS: 20,

  // Snapshot current AppState and persist to IndexedDB.
  // trigger: 'startup' | 'pre-sync' | 'scheduled' | 'manual' | 'pre-restore'
  async create(trigger = 'auto') {
    try {
      const payload = AppState._buildPayload();
      const deviceSlug = (CloudSync._deviceId || 'local').slice(0, 6);
      const key = `backup_${Date.now()}_${deviceSlug}`;
      const record = {
        timestamp: new Date().toISOString(),
        trigger,
        deviceId: CloudSync._deviceId || 'local',
        data: payload
      };
      await Storage.saveBackup(key, record);
      await Storage.pruneBackups(this.MAX_BACKUPS);
      console.log(`BackupManager: ${trigger} backup saved (${key})`);
      return key;
    } catch (e) {
      console.warn('BackupManager: create failed —', e.message);
      return null;
    }
  },

  // List all backups newest-first.
  async list() {
    return Storage.listBackups();
  },

  // Restore a backup by key. Snapshots current state first as safety net.
  async restore(key) {
    try {
      const backup = await Storage.loadBackup(key);
      if (!backup || !backup.data) {
        if (typeof UI !== 'undefined') UI.showToast('Backup not found');
        return;
      }
      await this.create('pre-restore'); // safety snapshot before overwriting
      AppState._applyLoaded(backup.data);
      AppState._doSave();
      if (typeof UI !== 'undefined') {
        UI.updateAll();
        const dt = new Date(backup.timestamp).toLocaleString();
        UI.showToast(`Backup restored — data from ${dt}`);
      }
      this.renderModal();
    } catch (e) {
      console.error('BackupManager: restore failed —', e);
      if (typeof UI !== 'undefined') UI.showToast('Restore failed — see console');
    }
  },

  // Download a specific backup as a JSON file.
  downloadBackup(key) {
    Storage.loadBackup(key).then(backup => {
      if (!backup) return;
      const json = JSON.stringify(backup.data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      const date = backup.timestamp.split('T')[0];
      a.download = `skadi-backup-${date}-${backup.trigger}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  },

  // Download the most recent backup.
  async downloadLatest() {
    const all = await this.list();
    if (all.length) {
      this.downloadBackup(all[0].key);
    } else if (typeof UI !== 'undefined') {
      UI.showToast('No backups found — create one first');
    }
  },

  openModal() {
    const modal = document.getElementById('backupModal');
    if (modal) {
      modal.classList.add('open');
      this.renderModal();
    }
  },

  closeModal() {
    document.getElementById('backupModal')?.classList.remove('open');
  },

  // Render the backup list inside the modal.
  async renderModal() {
    const listEl = document.getElementById('backupList');
    if (!listEl) return;
    listEl.innerHTML = '<div class="backup-empty">Loading backups…</div>';

    const deviceId = CloudSync._deviceId || 'local';
    const deviceEl = document.getElementById('backupDeviceId');
    if (deviceEl) deviceEl.textContent = deviceId.slice(0, 16) + '…';

    const backups = await this.list();
    if (!backups.length) {
      listEl.innerHTML = '<div class="backup-empty">No backups yet. Create your first one above.</div>';
      return;
    }

    const icons = { startup: '🚀', 'pre-sync': '☁', scheduled: '⏱', manual: '👤', 'pre-restore': '↩', auto: '💾' };
    const rows = backups.map(b => {
      const dt     = new Date(b.timestamp);
      const age    = this._ago(dt);
      const icon   = icons[b.trigger] || '💾';
      const isMine = b.deviceId === deviceId;
      const sizeKB = b.data ? Math.round(JSON.stringify(b.data).length / 1024) : '?';
      const safeKey = esc(b.key);
      const safeDate = esc(dt.toLocaleString());
      return `
        <div class="backup-row">
          <div class="backup-row-meta">
            <span class="backup-trigger-badge">${icon} ${esc(b.trigger)}</span>
            <span class="backup-time">${esc(age)} &mdash; ${safeDate}</span>
            <span class="backup-device">${isMine ? '📱 This device' : '🖥 Other device'} &middot; ${sizeKB} KB</span>
          </div>
          <div class="backup-row-actions">
            <button class="btn btn-sm" onclick="BackupManager.downloadBackup('${safeKey}')">⬇ Save</button>
            <button class="btn btn-sm backup-restore-btn" onclick="BackupManager._confirmRestore('${safeKey}', '${safeDate}')">↩ Restore</button>
          </div>
        </div>`;
    }).join('');

    listEl.innerHTML = rows;
  },

  _confirmRestore(key, dateStr) {
    if (confirm(`Restore backup from ${dateStr}?\n\nYour current data will be snapshotted first so you can undo this.`)) {
      this.restore(key);
    }
  },

  _ago(date) {
    const secs = Math.floor((Date.now() - date) / 1000);
    if (secs < 60)    return 'just now';
    if (secs < 3600)  return Math.floor(secs / 60) + 'm ago';
    if (secs < 86400) return Math.floor(secs / 3600) + 'h ago';
    return Math.floor(secs / 86400) + 'd ago';
  }
};
