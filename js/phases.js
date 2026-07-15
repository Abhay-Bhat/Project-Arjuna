// ============================================================
// Skadi — Phase Detection Engine (Routine v4 — Integrated Master Plan)
// 5 ramp stages + sustained, aligned to Jul 13 2026 start.
// UPDATE (2026-07-14): an 11-week ad-hoc interview-prep sprint (Jul 15 –
// Sep 30, 2026) for an India-based role switch pauses UPSC entirely.
// Stage 1 is cut short (was Jul 13–26, now Jul 13–14) and every ramp
// stage from Stage 2 onward is pushed back by exactly the days the
// sprint costs net of that shortening (78 pause days − 12 days saved
// by cutting Stage 1 short = 66 days). All downstream UPSC dates
// (milestones, UPSC_SUBJECTS in upsc.js) shift accordingly — see the
// dated comments below and in upsc.js for the exact math.
// ============================================================

const PHASES = [
  {
    id: 'ramp1',
    name: 'Stage 1 — Settling In',
    emoji: '🏁',
    start: '2026-07-13',
    end: '2026-07-14',
    color: '#ffb230',
    description: 'Days 1–2. Evening block 7:15–9 PM. UPSC 1h + Tech 45m. Build the habit anchor. Cut short by the interview-prep sprint.',
    scheduleBase: 'ramp1'
  },
  {
    id: 'interview_prep',
    name: 'Interview Prep Sprint',
    emoji: '💼',
    start: '2026-07-15',
    end: '2026-09-30',
    color: '#ff5c80',
    description: '11-week ad-hoc interview prep for an India-based role switch. UPSC fully paused for this window; resumes at Stage 2 the day the sprint ends.',
    scheduleBase: 'ramp1'
  },
  {
    id: 'ramp2',
    name: 'Stage 2 — Building Momentum',
    emoji: '🔧',
    start: '2026-10-01',
    end: '2026-10-14',
    color: '#0ea5e9',
    description: 'Weeks 3–4. Evening extends to 9:30 PM. UPSC 1.5h + Tech 30m. Docker foundations.',
    scheduleBase: 'ramp2'
  },
  {
    id: 'ramp3',
    name: 'Stage 3 — Deepening',
    emoji: '📈',
    start: '2026-10-15',
    end: '2026-10-28',
    color: '#7b42bc',
    description: 'Weeks 5–6. Evening to 9:55 PM. UPSC 2h + Tech 30m. Kubernetes core begins.',
    scheduleBase: 'ramp3'
  },
  {
    id: 'ramp4',
    name: 'Stage 4 — Full Capacity',
    emoji: '🔥',
    start: '2026-10-29',
    end: '2026-11-11',
    color: '#00d4c8',
    description: 'Weeks 7–8. Evening to 10:15 PM. UPSC 2.5h + Tech 30m. NCERT + CKA prep.',
    scheduleBase: 'ramp4'
  },
  {
    id: 'sustained',
    name: 'Stage 5 — Sustained Cruise',
    emoji: '⚡',
    start: '2026-11-12',
    end: '2028-12-31',
    color: '#0ea5e9',
    description: 'Week 9 onward. 27.5h UPSC + 4.5h Tech + 5h CA/week. All classes by ~Mar 2028.',
    scheduleBase: 'sustained'
  }
];

const MILESTONES = [
  { label: 'Dubai Day 1 — Job starts',               date: '2026-07-01', done: false },
  { label: 'Routine v4 begins',                      date: '2026-07-13', done: false },
  { label: 'Interview Prep Sprint begins — UPSC paused', date: '2026-07-15', done: false },
  { label: 'Interview Prep Sprint ends — UPSC resumes (Stage 2)', date: '2026-09-30', done: false },
  { label: 'Stage 3 — UPSC 2h/day reached',          date: '2026-10-15', done: false },
  { label: 'NCERT Phase Complete (~Nov 11)',          date: '2026-11-11', done: false },
  { label: 'Sustained Cruise begins (Wk 9)',         date: '2026-11-12', done: false },
  { label: 'CKA Exam (~Oct 2026)',                   date: '2026-10-04', done: false },
  { label: 'Indian Polity complete (~Dec 30)',        date: '2026-12-30', done: false },
  { label: 'Geography complete (~Mar 3, 2027)',       date: '2027-03-03', done: false },
  { label: 'Terraform Associate (~Mar 2027)',         date: '2027-03-21', done: false },
  { label: 'CSAT complete (~Jun 24, 2027)',           date: '2027-06-24', done: false },
  { label: 'AWS SAA Exam (~May 2027)',                date: '2027-05-16', done: false },
  { label: 'Ethics complete (~Nov 29, 2027)',         date: '2027-11-29', done: false },
  { label: 'Sociology P1 complete (~Feb 21, 2028)',   date: '2028-02-21', done: false },
  { label: 'ALL CLASSES COMPLETE',                    date: '2028-03-13', done: false },
  { label: 'PSM I Exam (~Dec 2027)',                  date: '2027-12-12', done: false },
  { label: 'Mock Phase begins',                      date: '2028-03-14', done: false },
  { label: 'UPSC Prelims 2028',                      date: '2028-05-26', done: false },
  { label: 'UPSC Mains 2028',                        date: '2028-09-20', done: false },
  { label: 'Interview Prep begins',                  date: '2028-10-01', done: false },
  { label: 'UPSC Personality Test 2028',              date: '2029-02-15', done: false }
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

  isUPSCPaused(date = new Date()) {
    const s = this._toStr(date);
    return s >= '2026-07-15' && s <= '2026-09-30';
  },

  isLightUPSC(date = new Date()) {
    const s = this._toStr(date);
    return s >= '2026-07-13' && s <= '2026-11-11';
  },

  isPrelimsRevision(date = new Date()) {
    const s = this._toStr(date);
    return s >= '2028-03-14' && s <= '2028-05-15';
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
