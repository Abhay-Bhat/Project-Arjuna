// ============================================================
// ATHENA — Bootstrap
// ============================================================

console.log('🏹 Project Arjuna starting...');

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // AppState.init() is now async — it waits for IndexedDB to open and loads data
    await AppState.init();

    // Seed pre-populated data (runs once; skips already-inserted entries)
    SeedData.apply();

    // Initialize UPSC schedule only if explicitly needed
    // UPSCTracker.initSchedule(false);

    // Boot UI
    UI.init();
    Events.init();

    // Live clock + day-change watcher
    const clockEl = document.getElementById('liveClockDisplay');
    let _lastDay = new Date().toDateString();

    function tickClock() {
      const now = new Date();
      const nowDay = now.toDateString();

      // Update live clock
      if (clockEl) {
        clockEl.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      }

      // If the day has changed, re-sync
      if (nowDay !== _lastDay) {
        _lastDay = nowDay;
        // Advance selectedDate only if it was tracking "yesterday"
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

    tickClock(); // run immediately
    setInterval(tickClock, 30000); // refresh every 30s

    console.log('✅ ATHENA ready');
  } catch(err) {
    console.error('❌ Boot error:', err);
  }
});

// Debug helpers
window.ATHENA = {
  state:          () => AppState,
  phase:          () => PhaseManager.getPhase(),
  regenSchedule:  () => { UPSCTracker.initSchedule(true); UI.updateAll(); },
  clearState:     () => { localStorage.removeItem('athena_v2'); location.reload(); },
  dumpUPSC:       (date) => UPSCTracker.getForDate(date || AppState.getTodayKey()),
  milestones:     () => PhaseManager.getUpcomingMilestones(5)
};
