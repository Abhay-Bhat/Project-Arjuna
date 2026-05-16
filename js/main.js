// ============================================================
// ATHENA — Bootstrap
// Phase 1: Local data → UI renders immediately (no network wait)
// Phase 2: Auth check in background → cloud sync if signed in
// ============================================================

console.log('🏹 Project Arjuna starting…');

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // ── Phase 1: Boot with local data immediately ─────────────
    // The app renders right away using IndexedDB / localStorage.
    // No network call, no auth wait — instant first paint.
    await AppState.init();
    SeedData.apply();
    UI.init();
    Events.init();
    CloudSync.startBroadcastListening(); // cross-tab sync (works in all modes)

    // Reveal the app — fade out the loading overlay
    const _loader = document.getElementById('appLoader');
    if (_loader) {
      _loader.classList.add('al-done');
      setTimeout(() => _loader.remove(), 380);
    }

    // Defer startup backup to idle time so it never competes with the render path.
    // Hourly scheduled backup runs while the tab stays open.
    const _idle = typeof requestIdleCallback !== 'undefined'
      ? (fn) => requestIdleCallback(fn, { timeout: 5000 })
      : (fn) => setTimeout(fn, 3000);
    _idle(() => BackupManager.create('startup'));
    setInterval(() => BackupManager.create('scheduled'), 60 * 60 * 1000);

    // Flush any queued Firestore push when the tab is hidden or unloaded.
    // This covers: closing the tab, navigating away, and going to background on mobile.
    const _flushOnExit = () => CloudSync.flushPush();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') _flushOnExit();
    });
    window.addEventListener('pagehide', _flushOnExit);

    // Live clock + day-change watcher
    const clockEl = document.getElementById('liveClockDisplay');
    let _lastDay = new Date().toDateString();

    function tickClock() {
      const now    = new Date();
      const nowDay = now.toDateString();
      if (clockEl) {
        clockEl.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      }
      if (nowDay !== _lastDay) {
        _lastDay = nowDay;
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (AppState.selectedDate.toDateString() === yesterday.toDateString()) {
          AppState.selectedDate = new Date();
          AppState.calendarMonth = new Date();
          AppState.save();
        }
        UI.updateAll();
      }
    }

    tickClock();
    setInterval(tickClock, 30000);

    console.log('✅ ATHENA local boot complete');

    // ── Phase 2: Auth in background (does NOT block UI) ───────
    // Bind overlay / header buttons
    document.getElementById('authSignInBtn')?.addEventListener('click', () => {
      Auth.signInWithGoogle();
    });
    document.getElementById('signOutBtn')?.addEventListener('click', async () => {
      if (confirm('Sign out of ATHENA?')) await Auth.signOut();
    });
    document.getElementById('syncNowBtn')?.addEventListener('click', async () => {
      const btn  = document.getElementById('syncNowBtn');
      const icon = document.getElementById('syncNowIcon');
      if (!btn || btn.disabled) return;
      btn.disabled = true;
      btn.classList.add('syncing');
      if (icon) icon.textContent = '⟳';
      await AppState.syncCloud();
      btn.classList.remove('syncing');
      btn.classList.add('synced');
      if (icon) icon.textContent = '✓';
      setTimeout(() => {
        btn.classList.remove('synced');
        if (icon) icon.textContent = '☁';
        btn.disabled = false;
      }, 2000);
    });

    // Auth.init() resolves with the current user (or null).
    // It shows the sign-in overlay if the user is not authenticated.
    // It does NOT block — the app is already running above.
    const user = await Auth.init();

    if (Auth.isLocalOnly) {
      Auth.applyLocalModeUI();
      return;
    }

    if (user) {
      // Already signed in — merge cloud data into the running app
      CloudSync.init();
      await AppState.syncCloud();
      CloudSync.startListening();
    }
    // If !user: overlay is showing; sign-in is handled by authSignInBtn click.
    // Auth.signInWithGoogle() calls CloudSync.init() + AppState.syncCloud() on success.

  } catch (err) {
    console.error('❌ Boot error:', err);
  }
});

// Debug helpers (browser console: ATHENA.*)
window.ATHENA = {
  state:          () => AppState,
  phase:          () => PhaseManager.getPhase(),
  regenSchedule:  () => { UPSCTracker.initSchedule(true); UI.updateAll(); },
  clearState:     () => { localStorage.removeItem('athena_v2'); location.reload(); },
  dumpUPSC:       (date) => UPSCTracker.getForDate(date || AppState.getTodayKey()),
  milestones:     () => PhaseManager.getUpcomingMilestones(5),
  syncNow:        () => AppState.syncCloud(),
  authUser:       () => Auth.user,
  backup:         () => BackupManager.create('manual'),
  listBackups:    () => BackupManager.list().then(console.table),
  restoreBackup:  (key) => BackupManager.restore(key),

  // Sync diagnostics — run ATHENA.syncDiag() in console to see sync state
  syncDiag() {
    const cs = CloudSync;
    const info = {
      enabled:         cs._enabled,
      deviceId:        cs._deviceId,
      uid:             Auth.uid,
      isLocalOnly:     Auth.isLocalOnly,
      isAuthenticated: Auth.isAuthenticated,
      lastPulledAt:    cs._lastPulledAt,
      lastSeenServerMs: cs._lastSeenServerMs,
      listenerActive:  !!cs._unsubscribe,
      pendingPush:     !!cs._pendingPayload,
      localBuckets:    AppState.taskBuckets?.length,
      localTasks:      AppState.tasks?.length,
      localSavedAt:    AppState._savedAt,
    };
    console.table(info);
    if (cs._enabled && Auth.uid) {
      cs._ref?.get().then(snap => {
        if (!snap.exists) { console.warn('Firestore doc does NOT exist'); return; }
        const d = snap.data();
        console.log('Firestore doc:', {
          _deviceId: d._deviceId,
          _ts: d._ts?.toMillis?.(),
          taskBuckets: d.taskBuckets?.length,
          tasks: d.tasks?.length,
          _savedAt: d._savedAt,
        });
      }).catch(e => console.error('Firestore read error:', e.code, e.message));
    }
    return info;
  },

  // Force-pull from Firestore and apply, bypassing all guards. Run on the
  // device that shows stale/empty data to recover without a page reload.
  async forcePull() {
    if (!CloudSync._enabled || !CloudSync._ref) {
      console.warn('CloudSync not enabled'); return;
    }
    try {
      const snap = await CloudSync._ref.get();
      if (!snap.exists) { console.warn('No cloud doc'); return; }
      const data = snap.data();
      delete data._ts; delete data._deviceId;
      AppState._applyLoaded(data);
      Storage.save(data);
      UI.updateAll();
      console.log('Force pull applied:', { buckets: data.taskBuckets?.length, tasks: data.tasks?.length });
    } catch(e) {
      console.error('Force pull failed:', e.code, e.message);
    }
  },
};
