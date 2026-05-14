// ============================================================
// ATHENA — Bootstrap
// Auth gate → Cloud Sync init → State load → UI boot
// ============================================================

console.log('🏹 Project Arjuna starting…');

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1. Resolve auth state (resolves immediately if Firebase is not configured)
    const user = await Auth.init();

    // 2. Bind the sign-in button on the overlay
    document.getElementById('authSignInBtn')?.addEventListener('click', () => {
      Auth.signInWithGoogle();
    });

    // 3. Bind the sign-out button in the header
    document.getElementById('signOutBtn')?.addEventListener('click', async () => {
      if (confirm('Sign out of ATHENA?')) {
        await Auth.signOut();
      }
    });

    // 4. If Firebase is configured and user is not yet signed in, wait
    if (!user && !Auth.isLocalOnly) {
      await Auth.waitForSignIn();
    }

    // 5. Show local-mode badge if running without Firebase
    if (Auth.isLocalOnly) Auth.applyLocalModeUI();

    // 6. Init cloud sync (no-op when local-only)
    CloudSync.init();

    // 7. Load AppState (merges local + cloud, starts real-time listener)
    await AppState.init();

    // 8. Seed pre-populated data (runs once; skips already-inserted entries)
    SeedData.apply();

    // 9. Boot UI
    UI.init();
    Events.init();

    // 10. Live clock + day-change watcher
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

    console.log('✅ ATHENA ready');
  } catch (err) {
    console.error('❌ Boot error:', err);
  }
});

// Debug helpers (available in browser console as ATHENA.*)
window.ATHENA = {
  state:         () => AppState,
  phase:         () => PhaseManager.getPhase(),
  regenSchedule: () => { UPSCTracker.initSchedule(true); UI.updateAll(); },
  clearState:    () => { localStorage.removeItem('athena_v2'); location.reload(); },
  dumpUPSC:      (date) => UPSCTracker.getForDate(date || AppState.getTodayKey()),
  milestones:    () => PhaseManager.getUpcomingMilestones(5),
  syncNow:       () => AppState._doSave(),
  authUser:      () => Auth.user
};
