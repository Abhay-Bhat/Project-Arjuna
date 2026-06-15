// ============================================================
// Skadi — UPSC Tracking System (Recalibrated)
//
// Schedule design:
//  Track A — GS Main (Subjects 1–14): Mon–Fri, 1 class/day
//             Light phase Jun–Aug'26: Mon/Wed/Fri only
//  Track B — CSAT (Subject 17): Tue/Thu from Dec 19, 2026
//  Track C — Sociology P1 (Subject 15): Saturdays from Nov 20, 2026
//  Track D — Sociology P2 (Subject 16): Saturdays, after P1
//  Track E — Essay (Subject 18): after main track + buffer
//
// Strategic priority for Prelims 2027 (early 2028):
//  Priority-1 subjects targeted first (Phase 1, Aug 2026–Feb 2027).
//  Remaining subjects + Sociology Optional follow in Phase 2 (Feb–Jun 2027).
// ============================================================

const UPSC_SUBJECTS = [
  // GS Spine — Phase 1 priority (start first)
  { id:  1, name: "Indian Polity",                                 classes: 39,  track: 'main',     priority: 1 },
  { id:  2, name: "Modern History & Post-Independence",            classes: 32,  track: 'main',     priority: 1 },
  { id:  3, name: "Geography",                                     classes: 39,  track: 'main',     priority: 1 },
  { id:  4, name: "Economy",                                       classes: 33,  track: 'main',     priority: 1 },
  { id:  5, name: "Ancient & Medieval History, Art & Culture",     classes: 36,  track: 'main',     priority: 2 },
  { id:  6, name: "Environment & Ecology",                         classes: 16,  track: 'main',     priority: 2 },
  { id:  7, name: "Science & Technology",                          classes: 34,  track: 'main',     priority: 2 },
  // GS Extended — Phase 2 onward
  { id:  8, name: "International Relations",                       classes: 26,  track: 'main',     priority: 2 },
  { id:  9, name: "Governance",                                    classes: 11,  track: 'main',     priority: 2 },
  { id: 10, name: "Indian Society & Social Justice",               classes: 31,  track: 'main',     priority: 1 },
  { id: 11, name: "Internal Security",                             classes: 14,  track: 'main',     priority: 2 },
  { id: 12, name: "Disaster Management",                           classes:  4,  track: 'main',     priority: 2 },
  { id: 13, name: "World History",                                 classes: 12,  track: 'main',     priority: 2 },
  { id: 14, name: "Ethics, Integrity & Aptitude",                  classes: 30,  track: 'main',     priority: 2 },
  // Optional — Parallel
  { id: 15, name: "Sociology — Paper 01",                          classes: 105, track: 'sociology', priority: 2 },
  { id: 16, name: "Sociology — Paper 02",                          classes: 30,  track: 'sociology', priority: 2 },
  // CSAT — Parallel from Nov 2026
  { id: 17, name: "CSAT",                                          classes: 69,  track: 'csat',     priority: 1 },
  // Essay
  { id: 18, name: "Essay",                                         classes:  5,  track: 'essay',    priority: 2 }
];

const CA_START = '2026-11-18'; // Current Affairs daily from Nov 2026

// Bump whenever _buildSchedule()'s logic/priorities change so existing users'
// cached AppState.upscSchedule (a derived, non-user-data cache) gets rebuilt.
const SCHEDULE_VERSION = 3;

// Bump to force a one-time reset of AppState.upscSubjectProgress (e.g. after
// a UPSC timeline restart) for existing users — mirrors SCHEDULE_VERSION.
const PROGRESS_RESET_VERSION = 1;

const UPSCTracker = {

  _subjectTotal(s) {
    return AppState.upscSubjectTotals?.[s.id] ?? s.classes;
  },

  totalClasses() {
    return UPSC_SUBJECTS.reduce((sum, s) => sum + this._subjectTotal(s), 0);
  },

  initSchedule(force = false) {
    if (!Array.isArray(AppState.upscSchedule)) AppState.upscSchedule = [];
    let stale = false;
    try { stale = localStorage.getItem('skadi_schedule_version') !== String(SCHEDULE_VERSION); } catch (e) {}
    if (force || AppState.upscSchedule.length === 0 || stale) {
      AppState.upscSchedule = this._buildSchedule();
      AppState.save();
      try { localStorage.setItem('skadi_schedule_version', String(SCHEDULE_VERSION)); } catch (e) {}
    }
    this._resetProgressIfStale();
  },

  _resetProgressIfStale() {
    let stale = false;
    try { stale = localStorage.getItem('skadi_progress_reset_version') !== String(PROGRESS_RESET_VERSION); } catch (e) {}
    if (!stale) return;
    AppState.upscSubjectProgress = {};
    AppState.upscProgress = 0;
    AppState.upscSubjectProgressUpdatedAt = new Date().toISOString();
    AppState.save();
    try { localStorage.setItem('skadi_progress_reset_version', String(PROGRESS_RESET_VERSION)); } catch (e) {}
  },

  _buildSchedule() {
    const schedule = [];
    const DAY = 864e5;

    const str = d => d.toISOString().split('T')[0];

    const isLight    = d => { const s = str(d); return s >= '2026-06-27' && s <= '2026-08-13'; };

    const push = (d, subj, classNum) => schedule.push({
      date:         str(d),
      day:          d.toLocaleDateString('en-US', { weekday: 'long' }),
      subject_id:   subj.id,
      subject_name: subj.name,
      class_number: classNum,
      total_classes: subj.classes,
      track:        subj.track,
      priority:     subj.priority
    });

    // ── TRACK A: GS Main (subjects 1–14) ──────────────────
    const mainSubjects = UPSC_SUBJECTS.filter(s => s.track === 'main');
    let mainDate = new Date('2026-06-28'); // First Mon in light phase

    for (const subj of mainSubjects) {
      let left = subj.classes;
      while (left > 0) {
        // Skip Sunday always
        while (mainDate.getDay() === 0) mainDate = new Date(mainDate.getTime() + DAY);
        // Light phase: Mon/Wed/Fri only
        if (isLight(mainDate) && ![1,3,5].includes(mainDate.getDay())) {
          mainDate = new Date(mainDate.getTime() + DAY);
          continue;
        }
        push(mainDate, subj, subj.classes - left + 1);
        left--;
        mainDate = new Date(mainDate.getTime() + DAY);
      }
      // 2-working-day buffer after each subject
      for (let i = 0; i < 2; i++) {
        mainDate = new Date(mainDate.getTime() + DAY);
        while (mainDate.getDay() === 0) mainDate = new Date(mainDate.getTime() + DAY);
      }
    }

    // ── TRACK B: CSAT — Tue & Thu from Nov 1, 2026 ────────
    const csat = UPSC_SUBJECTS.find(s => s.id === 17);
    let csatDate = new Date('2026-12-19');
    // Advance to first Tuesday
    while (csatDate.getDay() !== 2) csatDate = new Date(csatDate.getTime() + DAY);
    let csatLeft = csat.classes;
    while (csatLeft > 0) {
      while (![2,4].includes(csatDate.getDay())) csatDate = new Date(csatDate.getTime() + DAY);
      push(csatDate, csat, csat.classes - csatLeft + 1);
      csatLeft--;
      csatDate = new Date(csatDate.getTime() + DAY);
    }

    // ── TRACK C: Sociology P1 — Saturdays from Oct 4, 2026 ─
    const socP1 = UPSC_SUBJECTS.find(s => s.id === 15);
    let socDate = new Date('2026-11-20');
    while (socDate.getDay() !== 6) socDate = new Date(socDate.getTime() + DAY);
    let socLeft = socP1.classes;
    while (socLeft > 0) {
      push(socDate, socP1, socP1.classes - socLeft + 1);
      socLeft--;
      socDate = new Date(socDate.getTime() + 7 * DAY); // next Saturday
    }

    // ── TRACK D: Sociology P2 — Saturdays after P1 ends ───
    const socP2 = UPSC_SUBJECTS.find(s => s.id === 16);
    let soc2Left = socP2.classes;
    while (soc2Left > 0) {
      push(socDate, socP2, socP2.classes - soc2Left + 1);
      soc2Left--;
      socDate = new Date(socDate.getTime() + 7 * DAY);
    }

    // ── TRACK E: Essay — after main track, 2-week buffer ──
    const essay = UPSC_SUBJECTS.find(s => s.id === 18);
    const mainEnd = schedule
      .filter(e => e.track === 'main')
      .map(e => e.date).sort().pop();
    let essayDate = mainEnd ? new Date(new Date(mainEnd).getTime() + 14 * DAY) : new Date('2027-12-01');
    while (essayDate.getDay() === 0) essayDate = new Date(essayDate.getTime() + DAY);
    for (let i = 0; i < essay.classes; i++) {
      while (essayDate.getDay() === 0) essayDate = new Date(essayDate.getTime() + DAY);
      push(essayDate, essay, i + 1);
      essayDate = new Date(essayDate.getTime() + DAY);
    }

    return schedule.sort((a, b) => a.date.localeCompare(b.date) ||
      a.subject_id - b.subject_id || a.class_number - b.class_number);
  },

  getForDate(dateStr) {
    return (AppState.upscSchedule || []).filter(e => e.date === dateStr);
  },

  getTodayClasses() {
    return this.getForDate(AppState.getTodayKey());
  },

  getDateRange(subjectId) {
    const rows = (AppState.upscSchedule || [])
      .filter(e => e.subject_id === subjectId)
      .map(e => e.date).sort();
    if (!rows.length) return { start: null, end: null };
    return { start: rows[0], end: rows[rows.length - 1] };
  },

  // ── Prelims 2027 milestone coverage ──────────────────────
  getPrelims2027Coverage() {
    const cutoff = '2028-01-17';
    const p1Subjects = UPSC_SUBJECTS.filter(s => s.priority === 1 && s.track === 'main');
    let totalP1 = 0, scheduledBeforePrelims = 0;
    p1Subjects.forEach(s => {
      totalP1 += s.classes;
      scheduledBeforePrelims += (AppState.upscSchedule || [])
        .filter(e => e.subject_id === s.id && e.date <= cutoff).length;
    });
    return { scheduled: scheduledBeforePrelims, total: totalP1 };
  },

  // ── Weekly count (from per-subject progress vs schedule) ─
  getWeeklyCount() {
    const weekStart = new Date();
    weekStart.setHours(0,0,0,0);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
    let count = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart); d.setDate(d.getDate() + i);
      const key = AppState.getDateKey(d);
      const rows = this.getForDate(key);
      rows.forEach(r => {
        const done = AppState.upscSubjectProgress?.[r.subject_id] || 0;
        if (done >= r.class_number) count++;
      });
    }
    return count;
  },

  // ── Current subject (first incomplete) ───────────────────
  getCurrentSubject() {
    for (const s of UPSC_SUBJECTS) {
      const done  = AppState.upscSubjectProgress?.[s.id] || 0;
      const total = this._subjectTotal(s);
      if (done < total) return { subject: s, done };
    }
    return null;
  },

  // ── Metrics update ────────────────────────────────────────
  updateMetrics() {
    let totalCompleted = 0;
    const totalClasses = this.totalClasses();

    UPSC_SUBJECTS.forEach(s => {
      totalCompleted += AppState.upscSubjectProgress?.[s.id] || 0;
    });

    AppState.upscProgress = totalCompleted;

    const pct = totalClasses > 0 ? Math.round((totalCompleted / totalClasses) * 100) : 0;

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    const setW = (id, w) => { const el = document.getElementById(id); if (el) el.style.width = w + '%'; };

    set('upscOverallPct', pct + '%');
    setW('upscOverallBar', pct);
    set('upscCompletedCount', totalCompleted);
    set('upscTotalCount', totalClasses);
    set('upscWeeklyCount', this.getWeeklyCount());

    // Selected date's classes (not hardcoded to today)
    const selDateKey  = AppState.getDateKey();
    const isToday     = selDateKey === AppState.getTodayKey();
    const selDateLabel = isToday
      ? 'today'
      : AppState.selectedDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    // Single canonical render — also updates Today tab's container if present
    this.renderTodayClasses('upscTodayClasses');
    this.renderTodayClasses('todayUpscClasses');

    // Current subject
    const cur = this.getCurrentSubject();
    set('upscCurrentSubject', cur ? cur.subject.name : '✅ All subjects complete');
    set('upscCurrentProgress', cur ? `${cur.done} / ${cur.subject.classes} classes` : '');

    // Prelims 2027 coverage
    const cov = this.getPrelims2027Coverage();
    const covPct = cov.total > 0 ? Math.round((cov.scheduled / cov.total) * 100) : 0;
    set('prelims2027Cov', covPct + '%');
    setW('prelims2027Bar', covPct);

    this.renderLagBanner(totalCompleted, totalClasses);
    this.renderDeadlineTracker();
    this.renderSubjectGrid();
  },

  // ── Intelligent Deadline Tracker ────────────────────────
  renderDeadlineTracker() {
    const el = document.getElementById('upscDeadlineTracker');
    if (!el) return;
    if (typeof CoachEngine === 'undefined') {
      el.innerHTML = '<div class="empty-state" style="font-size:12px;padding:8px 0;">Coach loading…</div>';
      return;
    }

    const p = CoachEngine.getUPSCProjection();
    const trackColor = p.onTrack === null ? 'var(--text-muted)'
      : p.onTrack ? 'var(--accent-green)' : 'var(--accent-rose)';
    const trackText  = p.onTrack === null ? 'Calculating…'
      : p.onTrack ? '✓ On Track' : '⚠ Behind Schedule';

    const fmt = d => {
      if (!d) return '—';
      const [y, m, dy] = d.split('-');
      return `${['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m]} ${dy}, ${y}`;
    };

    el.innerHTML = `
      <div style="font-size:13px;font-weight:700;color:${trackColor};margin-bottom:10px;">${trackText}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
        <div class="stat-card" style="padding:10px;">
          <div class="stat-card-title" style="font-size:10px;">Completed</div>
          <div class="stat-card-value" style="font-size:20px;">${p.completed}</div>
          <div class="stat-card-sub">${p.total} total</div>
        </div>
        <div class="stat-card" style="padding:10px;">
          <div class="stat-card-title" style="font-size:10px;">Remaining</div>
          <div class="stat-card-value" style="font-size:20px;">${p.remaining}</div>
          <div class="stat-card-sub">${p.lag > 0 ? `${p.lag} behind` : p.lag < 0 ? `${Math.abs(p.lag)} ahead` : 'on schedule'}</div>
        </div>
      </div>
      <div style="display:grid;gap:1px;">
        <div class="dt-row"><span class="dt-label">30-day pace</span><span class="dt-val">${p.pacePerDay} cl/day</span></div>
        <div class="dt-row"><span class="dt-label">Study avg (30d)</span><span class="dt-val">${p.avgStudyH30}h/day</span></div>
        <div class="dt-row"><span class="dt-label">Projected finish</span><span class="dt-val" style="color:${trackColor};">${fmt(p.projectedEnd)}</span></div>
        <div class="dt-row"><span class="dt-label">Target deadline</span><span class="dt-val">${fmt(p.targetEnd)}</span></div>
        ${p.requiredPacePerDay != null ? `
        <div class="dt-row"><span class="dt-label">Required pace</span><span class="dt-val" style="color:${p.onTrack ? 'var(--accent-green)' : 'var(--accent-amber)'};">${p.requiredPacePerDay} cl/day</span></div>
        <div class="dt-row"><span class="dt-label">Days remaining</span><span class="dt-val">${p.daysLeft}d</span></div>` : ''}
      </div>`;
  },

  // ── Lag banner: expected vs completed (irrespective of phase/schedule) ──
  renderLagBanner(totalCompleted, totalClasses) {
    const banner = document.getElementById('upscLagBanner');
    if (!banner) return;
    const todayKey = AppState.getTodayKey();
    const expected = (AppState.upscSchedule || [])
      .filter(e => e.date <= todayKey).length;
    const deficit = expected - totalCompleted;
    if (deficit > 0) {
      banner.innerHTML =
        `<span class="ulb-icon">⚠️</span>` +
        `<span class="ulb-text">Expected to complete <b>${expected}</b> classes out of <b>${totalClasses}</b> by today, ` +
        `but you completed only <b>${totalCompleted}</b>. ` +
        `You are lagging behind by <b>${deficit}</b> ${deficit === 1 ? 'class' : 'classes'}.</span>`;
      banner.style.display = 'flex';
    } else {
      banner.style.display = 'none';
      banner.innerHTML = '';
    }
  },

  // Shared render for today's classes — used by both Today tab and UPSC tab
  renderTodayClasses(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    this.initSchedule(false);
    const dateKey   = AppState.getDateKey();
    const isToday   = dateKey === AppState.getTodayKey();
    const dateLabel = isToday
      ? 'today'
      : AppState.selectedDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    if (PhaseManager.isUPSCPaused(AppState.selectedDate)) {
      el.innerHTML = `<div class="pause-badge">⏸ UPSC Paused</div>`;
      return;
    }
    const classes = this.getForDate(dateKey);
    el.innerHTML = classes.length
      ? classes.map(c =>
          `<div class="today-class-item track-${c.track}">
            <span class="tc-num">Class ${c.class_number}/${c.total_classes}</span>
            <span class="tc-name">${c.subject_name}</span>
            <span class="tc-track">${c.track.toUpperCase()}</span>
          </div>`).join('')
      : `<div class="empty-state">No classes scheduled for ${dateLabel}</div>`;
  },

  renderSubjectGrid() {
    const grid = document.getElementById('upscSubjectsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    UPSC_SUBJECTS.forEach(s => {
      const done   = AppState.upscSubjectProgress?.[s.id] || 0;
      const total  = this._subjectTotal(s);
      const pct    = total > 0 ? Math.round((done / total) * 100) : 0;
      const status = pct === 100 ? 'completed' : pct > 0 ? 'in-progress' : 'not-started';
      const { start, end } = this.getDateRange(s.id);

      const trackClass = `track-badge-${s.track}`;
      const priorityBadge = s.priority === 1
        ? '<span class="priority-badge">2027</span>'
        : '<span class="priority-badge p2">2028</span>';

      const card = document.createElement('div');
      card.className = `upsc-card status-${status}`;
      card.innerHTML = `
        <div class="upsc-card-header">
          <div class="upsc-card-title">${s.name}</div>
          <div class="upsc-card-badges">
            ${priorityBadge}
            <span class="${trackClass} track-badge">${s.track.toUpperCase()}</span>
          </div>
        </div>
        <div class="upsc-card-progress">
          <div class="upsc-prog-labels">
            <span><b>${done}</b> / ${total}</span>
            <span>${pct}%</span>
          </div>
          <div class="upsc-prog-bar">
            <div class="upsc-prog-fill" style="width:${pct}%"></div>
          </div>
        </div>
        <div class="upsc-card-dates">${start ? `${start} → ${end}` : 'Not yet scheduled'}</div>
        <div class="upsc-card-input">
          <label>Classes done:</label>
          <input type="number" min="0" max="${total}" value="${done}" class="upsc-num-input">
          <button type="button" class="btn-xs btn-primary upsc-update-btn">Save</button>
        </div>
        <div class="upsc-card-total-edit">
          <label>Total classes:</label>
          <input type="number" min="1" value="${total}" class="upsc-total-input" title="Override total classes for this subject">
          <button type="button" class="btn-xs upsc-total-btn">Update</button>
        </div>`;

      const inp    = card.querySelector('.upsc-num-input');
      const btn    = card.querySelector('.upsc-update-btn');
      const totInp = card.querySelector('.upsc-total-input');
      const totBtn = card.querySelector('.upsc-total-btn');

      const apply = () => {
        const currentTotal = this._subjectTotal(s);
        let v = parseInt(inp.value, 10);
        if (isNaN(v) || v < 0) v = 0;
        if (v > currentTotal) v = currentTotal;
        inp.value = v;
        AppState.upscSubjectProgress = AppState.upscSubjectProgress || {};
        AppState.upscSubjectProgress[s.id] = v;
        AppState.upscSubjectProgressUpdatedAt = new Date().toISOString();
        AppState.save();
        this.updateMetrics();
        if (typeof UI !== 'undefined') UI.tryCompletePendingActivity('upsc');
      };

      const applyTotal = () => {
        let t = parseInt(totInp.value, 10);
        if (isNaN(t) || t < 1) t = s.classes;
        const done = AppState.upscSubjectProgress?.[s.id] || 0;
        if (t < done) { totInp.value = done; t = done; }
        AppState.upscSubjectTotals = AppState.upscSubjectTotals || {};
        AppState.upscSubjectTotals[s.id] = t;
        AppState.upscSubjectTotalsUpdatedAt = new Date().toISOString();
        AppState.save();
        this.renderSubjectGrid();
        this.updateMetrics();
      };

      btn.addEventListener('click', apply);
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') apply(); });
      totBtn.addEventListener('click', applyTotal);
      totInp.addEventListener('keydown', e => { if (e.key === 'Enter') applyTotal(); });

      grid.appendChild(card);
    });
  },

  // ── Current Affairs ──────────────────────────────────────
  renderCASection() {
    this._renderCAStats();
    this._renderCALog();
    this._bindCAForm();
  },

  _renderCAStats() {
    const row = document.getElementById('caStatsRow');
    if (!row) return;

    const streak  = AppState.getCAStreak();
    const todayCA = AppState.getSelectedCA();
    const todayCount = todayCA.articles?.length || 0;

    // Count last 7 days
    let weekDone = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      if (AppState.caLog[AppState.getDateKey(d)]?.done) weekDone++;
    }

    row.innerHTML = `
      <div class="analytics-grid cols-3" style="margin-bottom:16px;">
        <div class="stat-card">
          <div class="stat-card-title">Today</div>
          <div class="stat-card-value" style="font-size:22px;">${todayCount}</div>
          <div class="stat-card-sub">${todayCA.done ? '✅ CA Done' : '⏳ Not done yet'}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-title">Streak</div>
          <div class="stat-card-value" style="font-size:22px;">${streak}d</div>
          <div class="stat-card-sub">Consecutive days</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-title">This Week</div>
          <div class="stat-card-value" style="font-size:22px;">${weekDone}/7</div>
          <div class="stat-card-sub">Days CA done</div>
        </div>
      </div>`;
  },

  _renderCALog() {
    const container = document.getElementById('caDailyLog');
    if (!container) return;

    // Build flat list of ALL CA articles across all dates, sorted newest first
    const allEntries = [];
    Object.entries(AppState.caLog || {}).forEach(([date, dayData]) => {
      (dayData.articles || []).forEach(a => {
        allEntries.push({ ...a, date });
      });
    });
    allEntries.sort((a, b) => b.date.localeCompare(a.date));

    if (!allEntries.length) {
      container.innerHTML = '<div class="empty-state" style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;">No CA entries yet. Log your first article above.</div>';
      return;
    }

    // Today's date key for highlighting
    const todayKey = AppState.getTodayKey();
    const selKey   = AppState.getDateKey();

    container.innerHTML = `
      <div class="data-table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>Date</th><th>Source</th><th>Topic / Article</th><th>Notes</th><th>Links</th><th></th>
          </tr></thead>
          <tbody>
            ${allEntries.map(a => {
              const isToday  = a.date === todayKey;
              const isSel    = a.date === selKey;
              const dateFmt  = new Date(a.date + 'T00:00:00').toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
              const rowStyle = isSel ? 'background:rgba(77,121,255,0.06);' : '';

              // Build links column — validate URL scheme to block javascript: / data: URIs
              const isSafeUrl = (u) => { try { const p = new URL(u).protocol; return p === 'https:' || p === 'http:'; } catch { return false; } };
              const urlLink = a.url && isSafeUrl(a.url)
                ? `<a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer" class="btn-xs" style="display:inline-flex;align-items:center;gap:3px;margin-right:4px;" title="Open article URL">🔗</a>`
                : '';
              const attachBtn = a.attachmentKey
                ? `<button class="btn-xs" data-open-attach="${esc(a.attachmentKey)}" data-attach-name="${esc(a.fileName || 'attachment')}" title="Download/view attachment">📎 ${esc(a.fileName || 'File')}</button>`
                : '';

              return `<tr style="${rowStyle}">
                <td style="font-family:'Space Mono',monospace;font-size:11px;white-space:nowrap;">
                  ${dateFmt}${isToday ? ' <span style="color:var(--accent-green);font-size:10px;">Today</span>' : ''}
                </td>
                <td><span class="ca-source-badge">${esc(a.source)}</span></td>
                <td style="font-weight:500;">${esc(a.title)}</td>
                <td style="color:var(--text-muted);font-size:12px;">${esc(a.notes) || '—'}</td>
                <td style="white-space:nowrap;">${urlLink}${attachBtn || '—'}</td>
                <td><button class="btn-xs btn-danger" data-del-ca="${a.id}" data-del-ca-date="${esc(a.date)}" data-del-ca-attach="${esc(a.attachmentKey || '')}">✕</button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;

    // Delete handlers
    container.querySelectorAll('[data-del-ca]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id          = parseInt(btn.dataset.delCa);
        const date        = btn.dataset.delCaDate;
        const attachKey   = btn.dataset.delCaAttach;
        if (AppState.caLog[date]) {
          AppState.caLog[date].articles = (AppState.caLog[date].articles || []).filter(a => a.id !== id);
          if (!AppState.caLog[date].articles.length) AppState.caLog[date].done = false;
          AppState.save();
        }
        // Delete stored attachment if any
        if (attachKey && typeof Storage !== 'undefined') {
          await Storage.deleteAttachment(attachKey).catch(() => {});
        }
        if (typeof UI !== 'undefined') UI.syncQuickCheckins();
        this.renderCASection();
      });
    });

    // Open/download attachment handlers
    container.querySelectorAll('[data-open-attach]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const key  = btn.dataset.openAttach;
        const name = btn.dataset.attachName || 'attachment';
        try {
          const result = await Storage.loadAttachment(key);
          if (result) {
            const a = document.createElement('a');
            a.href = result.url;
            a.download = name;
            a.click();
            setTimeout(() => URL.revokeObjectURL(result.url), 5000);
          } else {
            if (typeof UI !== 'undefined') UI.showToast('⚠️ Attachment not found');
          }
        } catch(e) {
          if (typeof UI !== 'undefined') UI.showToast('⚠️ Could not load attachment');
        }
      });
    });
  },

  _bindCAForm() {
    const btn = document.getElementById('caAddBtn');
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = '1';

    btn.addEventListener('click', async () => {
      const source = document.getElementById('caSource')?.value || 'The Hindu';
      const title  = document.getElementById('caTitle')?.value?.trim();
      const notes  = document.getElementById('caNotes')?.value?.trim() || '';
      const url    = document.getElementById('caUrl')?.value?.trim()    || '';
      const fileEl = document.getElementById('caFile');
      const file   = fileEl?.files?.[0] || null;

      if (!title) {
        if (typeof UI !== 'undefined') UI.showToast('⚠️ Enter article title or topic');
        return;
      }

      // Save file attachment to IndexedDB if provided
      let attachmentKey = null;
      if (file && typeof Storage !== 'undefined' && Storage._db) {
        try {
          attachmentKey = `ca_${Date.now()}`;
          await Storage.saveAttachment(attachmentKey, file);
        } catch(e) {
          console.error('Attachment save failed:', e);
          attachmentKey = null;
          if (typeof UI !== 'undefined') UI.showToast('⚠️ File save failed — entry logged without attachment');
        }
      }

      AppState.addCAArticle({ source, title, notes, url, attachmentKey, fileName: file?.name || null });

      // Clear form
      document.getElementById('caTitle').value = '';
      document.getElementById('caNotes').value = '';
      document.getElementById('caUrl').value   = '';
      if (fileEl) fileEl.value = '';

      if (typeof UI !== 'undefined') {
        UI.syncQuickCheckins();
        UI.tryCompletePendingActivity('upsc');
        UI.showToast(attachmentKey ? '📰 CA entry + attachment saved' : '📰 CA entry logged');
      }
      this.renderCASection();
    });
  },

  showNotif(msg) {
    const n = document.createElement('div');
    n.className = 'toast'; n.textContent = msg;
    document.body.appendChild(n);
    requestAnimationFrame(() => n.classList.add('show'));
    setTimeout(() => { n.classList.remove('show'); setTimeout(() => n.remove(), 400); }, 3000);
  }
};
