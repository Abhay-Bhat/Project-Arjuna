// ============================================================
// Skadi — Phase Detection Engine
// Every phase has a schedule key, color, description, and date range.
// 6 phases (0–5) aligned to the finalised coaching plan.
// ============================================================

const PHASES = [
  {
    id: 'notice',
    name: 'Phase 0 — Notice & Decision',
    emoji: '🏁',
    start: '2026-06-27',
    end: '2026-08-13',
    color: '#ffb230',
    description: 'Exit Bangalore job by Jun 26. Decide India vs Dubai by Jun 21. Light UPSC reading begins.',
    scheduleBase: 'notice'
  },
  {
    id: 'phase1',
    name: 'Phase 1 — Foundation Build',
    emoji: '🏗️',
    start: '2026-08-14',
    end: '2027-02-17',
    color: '#4d79ff',
    description: '60% of UPSC syllabus (210 GS + 30 Sociology classes). Docker → K8s → AWS tech build. Establish 5 habit stacks.',
    scheduleBase: 'foundation'
  },
  {
    id: 'phase2',
    name: 'Phase 2 — Depth & Breadth',
    emoji: '📚',
    start: '2027-02-18',
    end: '2027-06-17',
    color: '#7b42bc',
    description: 'Remaining 40% syllabus + Sociology Optional. Answer writing 2–3 hrs/week. AWS + CI/CD & GitOps tech.',
    scheduleBase: 'foundation'
  },
  {
    id: 'phase3',
    name: 'Phase 3 — Mock & Consolidation',
    emoji: '🎯',
    start: '2027-06-18',
    end: '2027-08-17',
    color: '#00d4c8',
    description: '4–6 full Prelims mocks. Weak-area analysis. Tech: maintenance only.',
    scheduleBase: 'sprint'
  },
  {
    id: 'phase4',
    name: 'Phase 4 — Intensive Prep & Mains',
    emoji: '📜',
    start: '2027-08-18',
    end: '2028-05-18',
    color: '#a56eff',
    description: 'Target: Prelims Dec 2027. If cleared → Mains prep from Apr 2028. 4–5 hrs/day UPSC. Tech paused.',
    scheduleBase: 'india'
  },
  {
    id: 'phase5',
    name: 'Phase 5 — Mains Execution',
    emoji: '⚡',
    start: '2028-05-19',
    end: '2028-08-17',
    color: '#ff5c80',
    description: 'Mains written exam Apr 2028. Interview (Personality Test) prep May–Jun 2028.',
    scheduleBase: 'india'
  }
];

// Dubai vs India scenario notes (Phase 1–2 routine depends on the Phase 0 decision)
const SCENARIO_NOTES = {
  india: 'India track: ~3.5 hrs/day UPSC + 45 min/day tech (Mon/Wed/Thu/Sat). Prelims Dec 2027 stays on track.',
  dubai: 'Dubai track: ~2.5–3 hrs/day UPSC (timezone-compressed). Tech paused for first 2–3 months. Timeline extends ~6 months → Prelims ~May 2028.'
};

const MILESTONES = [
  { label: 'Give Landlord Notice',          date: '2026-05-10', done: false },
  { label: 'NRI Account Live',              date: '2026-06-15', done: false },
  { label: 'Decide India vs Dubai',         date: '2026-06-21', done: false },
  { label: 'Last Day — Bangalore',          date: '2026-06-26', done: false },
  { label: 'Dubai Day 1',                   date: '2026-07-01', done: false },
  { label: 'Gym Starts (Day 3)',            date: '2026-07-03', done: false },
  { label: 'Flat Signed',                   date: '2026-07-14', done: false },
  { label: 'SIP ₹50K Starts',               date: '2026-08-01', done: false },
  { label: 'Habit Stacks Rolled Out',       date: '2026-08-24', done: false },
  { label: 'Book Return Flight',            date: '2026-10-15', done: false },
  { label: 'Home Visit — Christmas',        date: '2026-12-20', done: false },
  { label: 'Foundation Build Complete (60% Syllabus)', date: '2027-02-17', done: false },
  { label: 'Depth & Breadth Complete (100% Syllabus)', date: '2027-06-17', done: false },
  { label: 'Apply — UPSC Prelims 2027',     date: '2027-08-18', done: false },
  { label: 'Prelims Mocks Complete',        date: '2027-08-17', done: false },
  { label: 'Give Dubai Notice',             date: '2027-06-01', done: false },
  { label: 'Return to India',               date: '2027-07-01', done: false },
  { label: 'Prelims 2027',                  date: '2028-01-22', done: false },
  { label: 'Mains 2028 — Written Exam',     date: '2028-05-28', done: false }
];

const PhaseManager = {
  getPhase(date = new Date()) {
    const s = this._toStr(date);
    const found = PHASES.find(p => s >= p.start && s <= p.end);
    if (found) return found;
    // Before Phase 0 starts (e.g. the gap left by a UPSC timeline restart),
    // treat it as Phase 0 rather than falling through to the last phase.
    return s < PHASES[0].start ? PHASES[0] : PHASES[PHASES.length - 1];
  },

  // Reads the Phase 0 decision (India vs Dubai) — defaults to 'india' until changed.
  getLocation() {
    try {
      const loc = localStorage.getItem('skadi_location');
      return loc === 'dubai' ? 'dubai' : 'india';
    } catch (e) {
      return 'india';
    }
  },

  setLocation(loc) {
    try { localStorage.setItem('skadi_location', loc === 'dubai' ? 'dubai' : 'india'); } catch (e) {}
  },

  getScenarioNote() {
    return SCENARIO_NOTES[this.getLocation()];
  },

  isUPSCPaused(date = new Date()) {
    // No phase in the new plan fully pauses UPSC — Phase 0 is "light", every
    // phase from Phase 1 onward keeps daily UPSC blocks.
    return false;
  },

  isLightUPSC(date = new Date()) {
    const s = this._toStr(date);
    return s >= '2026-06-27' && s <= '2026-08-13';
  },

  isPrelimsRevision(date = new Date()) {
    const s = this._toStr(date);
    return s >= '2027-11-18' && s <= '2028-01-17';
  },

  getScheduleKey(date = new Date()) {
    const phase = this.getPhase(date);
    const day = date.getDay();
    const isSat = day === 6;
    const isSun = day === 0;

    if (phase.scheduleBase === 'notice') {
      return isSun ? 'notice_weekend' : (isSat ? 'notice_weekend' : 'notice_weekday');
    }
    if (phase.scheduleBase === 'settle') {
      return (isSat || isSun) ? 'settle_weekend' : 'settle_weekday';
    }
    if (phase.scheduleBase === 'sprint') {
      return (isSat || isSun) ? 'sprint_weekend' : 'sprint_weekday';
    }
    if (phase.scheduleBase === 'india') {
      return (isSat || isSun) ? 'india_weekend' : 'india_weekday';
    }
    if (phase.scheduleBase === 'foundation') {
      const loc = this.getLocation();
      if (loc === 'dubai') {
        if (isSun) return 'dubai_sunday';
        if (isSat) return 'dubai_saturday';
        // Tech study sessions on Tue/Thu only (Dubai cadence)
        return (day === 2 || day === 4) ? 'foundation_dubai_weekday_tech' : 'foundation_dubai_weekday_rest';
      }
      if (isSat || isSun) return 'india_weekend';
      // Tech study sessions on Mon/Wed/Thu (India cadence; Sat covers the 4th day)
      return (day === 1 || day === 3 || day === 4) ? 'foundation_india_weekday_tech' : 'foundation_india_weekday_rest';
    }
    // Dubai Foundation / Exit (legacy fallback)
    if (isSun) return 'dubai_sunday';
    if (isSat) return 'dubai_saturday';
    return 'dubai_weekday';
  },

  getUpcomingMilestones(n = 3) {
    const today = new Date();
    return MILESTONES
      .map(m => ({ ...m, days: Math.ceil((new Date(m.date) - today) / 864e5) }))
      .filter(m => m.days >= 0)
      .sort((a, b) => a.days - b.days)
      .slice(0, n);
  },

  getPhaseProgress(phase) {
    const start = new Date(phase.start);
    const end   = new Date(phase.end);
    const now   = new Date();
    if (now < start) return 0;
    if (now > end)   return 100;
    return Math.round(((now - start) / (end - start)) * 100);
  },

  getDubaiSavingsDays() {
    const start = new Date('2026-07-01');
    const end   = new Date('2027-07-01');
    const now   = new Date();
    if (now < start) return { elapsed: 0, total: 365, remaining: 365 };
    const elapsed = Math.min(Math.ceil((now - start) / 864e5), 365);
    return { elapsed, total: 365, remaining: 365 - elapsed };
  },

  _toStr(d) {
    const y  = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${dd}`;
  }
};
