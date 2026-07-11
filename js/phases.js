// ============================================================
// Skadi — Phase Detection Engine (Routine v4 — Integrated Master Plan)
// 5 ramp stages + sustained, aligned to Jul 13 2026 start.
// ============================================================

const PHASES = [
  {
    id: 'ramp1',
    name: 'Stage 1 — Settling In',
    emoji: '🏁',
    start: '2026-07-13',
    end: '2026-07-26',
    color: '#ffb230',
    description: 'Weeks 1–2. Evening block 7:15–9 PM. UPSC 1h + Tech 45m. Build the habit anchor.',
    scheduleBase: 'ramp1'
  },
  {
    id: 'ramp2',
    name: 'Stage 2 — Building Momentum',
    emoji: '🔧',
    start: '2026-07-27',
    end: '2026-08-09',
    color: '#0ea5e9',
    description: 'Weeks 3–4. Evening extends to 9:30 PM. UPSC 1.5h + Tech 30m. Docker foundations.',
    scheduleBase: 'ramp2'
  },
  {
    id: 'ramp3',
    name: 'Stage 3 — Deepening',
    emoji: '📈',
    start: '2026-08-10',
    end: '2026-08-23',
    color: '#7b42bc',
    description: 'Weeks 5–6. Evening to 9:55 PM. UPSC 2h + Tech 30m. Kubernetes core begins.',
    scheduleBase: 'ramp3'
  },
  {
    id: 'ramp4',
    name: 'Stage 4 — Full Capacity',
    emoji: '🔥',
    start: '2026-08-24',
    end: '2026-09-06',
    color: '#00d4c8',
    description: 'Weeks 7–8. Evening to 10:15 PM. UPSC 2.5h + Tech 30m. NCERT + CKA prep.',
    scheduleBase: 'ramp4'
  },
  {
    id: 'sustained',
    name: 'Stage 5 — Sustained Cruise',
    emoji: '⚡',
    start: '2026-09-07',
    end: '2027-12-31',
    color: '#0ea5e9',
    description: 'Week 9 onward. 27.5h UPSC + 4.5h Tech + 5h CA/week. All classes by Dec 2027.',
    scheduleBase: 'sustained'
  }
];

const MILESTONES = [
  { label: 'Dubai Day 1 — Job starts',               date: '2026-07-01', done: false },
  { label: 'Routine v4 begins',                      date: '2026-07-13', done: false },
  { label: 'Stage 2 — Ramp up evening block',        date: '2026-07-27', done: false },
  { label: 'Stage 3 — UPSC 2h/day reached',          date: '2026-08-10', done: false },
  { label: 'NCERT Phase Complete (~Sep 6)',           date: '2026-09-06', done: false },
  { label: 'Sustained Cruise begins (Wk 9)',         date: '2026-09-07', done: false },
  { label: 'CKA Exam (~Oct 2026)',                   date: '2026-10-04', done: false },
  { label: 'Indian Polity complete (~Oct 18)',        date: '2026-10-18', done: false },
  { label: 'Geography complete (~Dec 20)',            date: '2026-12-20', done: false },
  { label: 'Terraform Associate (~Mar 2027)',         date: '2027-03-21', done: false },
  { label: 'CSAT complete (~Apr 12)',                 date: '2027-04-12', done: false },
  { label: 'AWS SAA Exam (~May 2027)',                date: '2027-05-16', done: false },
  { label: 'Ethics complete (~Sep 17)',               date: '2027-09-17', done: false },
  { label: 'Sociology P1 complete (~Dec 10)',         date: '2027-12-10', done: false },
  { label: 'ALL CLASSES COMPLETE',                    date: '2027-12-31', done: false },
  { label: 'PSM I Exam (~Dec 2027)',                  date: '2027-12-12', done: false },
  { label: 'Mock Phase begins',                      date: '2028-01-01', done: false },
  { label: 'UPSC Prelims 2028',                      date: '2028-05-26', done: false },
  { label: 'UPSC Mains 2028',                        date: '2028-09-20', done: false }
];

const PhaseManager = {
  getPhase(date = new Date()) {
    const s = this._toStr(date);
    const found = PHASES.find(p => s >= p.start && s <= p.end);
    if (found) return found;
    return s < PHASES[0].start ? PHASES[0] : PHASES[PHASES.length - 1];
  },

  getLocation() { return 'dubai'; },
  setLocation() {},

  getScenarioNote() {
    return 'Dubai track: Job + UPSC + Tech in parallel. 27.5h UPSC + 4.5h Tech/week sustained.';
  },

  isUPSCPaused() { return false; },

  isLightUPSC(date = new Date()) {
    const s = this._toStr(date);
    return s >= '2026-07-13' && s <= '2026-09-06';
  },

  isPrelimsRevision(date = new Date()) {
    const s = this._toStr(date);
    return s >= '2028-01-01' && s <= '2028-05-15';
  },

  getScheduleKey(date = new Date()) {
    const phase = this.getPhase(date);
    const day = date.getDay();
    const isSat = day === 6;
    const isSun = day === 0;

    const base = phase.scheduleBase;

    if (base === 'sustained') {
      if (isSat) return 'sustained_saturday';
      if (isSun) return 'sustained_sunday';
      return 'sustained_weekday';
    }

    if (isSat) return base + '_saturday';
    if (isSun) return base + '_sunday';
    return base + '_weekday';
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
