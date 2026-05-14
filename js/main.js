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
  state:         () => AppState,
  phase:         () => PhaseManager.getPhase(),
  regenSchedule: () => { UPSCTracker.initSchedule(true); UI.updateAll(); },
  clearState:    () => { localStorage.removeItem('athena_v2'); location.reload(); },
  dumpUPSC:      (date) => UPSCTracker.getForDate(date || AppState.getTodayKey()),
  milestones:    () => PhaseManager.getUpcomingMilestones(5),
  syncNow:       () => AppState.syncCloud(),
  authUser:      () => Auth.user
};
