// ============================================================
// Skadi — Phase Detection Engine
// Every phase has a schedule key, color, description, and date range.
// ============================================================

const PHASES = [
  {
    id: 'notice',
    name: 'Notice Period',
    emoji: '🏁',
    start: '2026-05-10',
    end: '2026-06-26',
    color: '#ffb230',
    description: 'Close Bangalore cleanly. Light UPSC reading begins.',
    scheduleBase: 'notice'
  },
  {
    id: 'settle',
    name: 'Dubai — Settle In',
    emoji: '✈️',
    start: '2026-06-27',
    end: '2026-09-30',
    color: '#ff5c80',
    description: 'Relocate. Build your routine & energy. UPSC fully paused.',
    scheduleBase: 'settle'
  },
  {
    id: 'foundation',
    name: 'Dubai Foundation',
    emoji: '🏗️',
    start: '2026-10-01',
    end: '2027-03-31',
    color: '#4d79ff',
    description: 'Deep UPSC work mornings. Full focus at Emirates NBD.',
    scheduleBase: 'dubai'
  },
  {
    id: 'prelims_sprint',
    name: 'Prelims Sprint',
    emoji: '🎯',
    start: '2027-04-01',
    end: '2027-05-25',
    color: '#00d4c8',
    description: 'Attempt 1 — Prelims May 2027. Daily mocks + CSAT.',
    scheduleBase: 'sprint'
  },
  {
    id: 'exit',
    name: 'Dubai Exit Phase',
    emoji: '🚪',
    start: '2027-05-26',
    end: '2027-07-01',
    color: '#a56eff',
    description: 'Give 30-day notice Jun 1. Pack up. Fly home Jul 1.',
    scheduleBase: 'dubai'
  },
  {
    id: 'reset',
    name: 'Return & Reset',
    emoji: '🏡',
    start: '2027-07-02',
    end: '2027-07-31',
    color: '#00d47c',
    description: 'Two-week full rest at home. Decompress completely.',
    scheduleBase: 'india'
  },
  {
    id: 'mains',
    name: 'Mains Preparation',
    emoji: '📜',
    start: '2027-08-01',
    end: '2027-11-30',
    color: '#4d79ff',
    description: 'Full-time UPSC. Mains attempt Nov 2027.',
    scheduleBase: 'india'
  },
  {
    id: 'upsc2028',
    name: 'UPSC 2028 — Real Attempt',
    emoji: '⚡',
    start: '2028-01-01',
    end: '2028-05-31',
    color: '#ff5c80',
    description: 'Serious, fully prepared attempt. All savings deployed.',
    scheduleBase: 'india'
  }
];

const MILESTONES = [
  { label: 'Give Landlord Notice',    date: '2026-05-10', done: false },
  { label: 'NRI Account Live',        date: '2026-06-15', done: false },
  { label: 'Last Day — Bangalore',    date: '2026-06-26', done: false },
  { label: 'Dubai Day 1',             date: '2026-07-01', done: false },
  { label: 'Gym Starts (Day 3)',       date: '2026-07-03', done: false },
  { label: 'Flat Signed',             date: '2026-07-14', done: false },
  { label: 'SIP ₹50K Starts',         date: '2026-08-01', done: false },
  { label: 'UPSC Study Resumes',      date: '2026-10-01', done: false },
  { label: 'CKA Cert Exam',           date: '2026-12-01', done: false },
  { label: 'Home Visit — Christmas',  date: '2026-12-20', done: false },
  { label: 'Book Return Flight',      date: '2026-10-15', done: false },
  { label: 'Apply UPSC Prelims',      date: '2026-11-01', done: false },
  { label: 'Prelims 2027',            date: '2027-05-25', done: false },
  { label: 'Give Dubai Notice',       date: '2027-06-01', done: false },
  { label: 'Return to India',         date: '2027-07-01', done: false },
  { label: 'Prelims 2028',            date: '2028-05-25', done: false }
];

const PhaseManager = {
  getPhase(date = new Date()) {
    const s = this._toStr(date);
    return PHASES.find(p => s >= p.start && s <= p.end) || PHASES[PHASES.length - 1];
  },

  isUPSCPaused(date = new Date()) {
    const s = this._toStr(date);
    return s >= '2026-07-01' && s <= '2026-09-30';
  },

  isLightUPSC(date = new Date()) {
    const s = this._toStr(date);
    return s >= '2026-05-10' && s <= '2026-06-26';
  },

  isPrelimsRevision(date = new Date()) {
    const s = this._toStr(date);
    return s >= '2027-04-01' && s <= '2027-05-25';
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
    // Dubai Foundation / Exit
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
