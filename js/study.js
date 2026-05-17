// ============================================================
// ATHENA — Study Tracker
// Live timer + session logging + forest visualization + analytics
// ============================================================

const StudyTracker = {

  SUBJECTS: [
    { id: 'history',         label: 'History',         emoji: '🏛️',  color: '#e8916a' },
    { id: 'geography',       label: 'Geography',        emoji: '🌍',  color: '#5cb88a' },
    { id: 'polity',          label: 'Polity',           emoji: '⚖️',  color: '#6a7be8' },
    { id: 'economy',         label: 'Economy',          emoji: '📈',  color: '#e8c56a' },
    { id: 'science',         label: 'Science & Tech',   emoji: '🔬',  color: '#56d4e0' },
    { id: 'csat',            label: 'CSAT',             emoji: '🧮',  color: '#e87ab0' },
    { id: 'current_affairs', label: 'Current Affairs',  emoji: '📰',  color: '#9b7be8' },
    { id: 'essay',           label: 'Essay',            emoji: '✍️',  color: '#7ba8e8' },
    { id: 'optional',        label: 'Optional',         emoji: '🎯',  color: '#56e0c8' },
    { id: 'revision',        label: 'Revision',         emoji: '🔄',  color: '#e8a556' },
  ],

  ACTIVITIES: [
    { id: 'reading',         label: 'Reading' },
    { id: 'revision',        label: 'Revision' },
    { id: 'notes',           label: 'Note-making' },
    { id: 'mock_test',       label: 'Mock Test' },
    { id: 'answer_writing',  label: 'Answer Writing' },
    { id: 'newspaper',       label: 'Newspaper' },
  ],

  _timerInterval: null,
  _elapsed: 0,
  _running: false,
  _activeSubject: null,
  _activeActivity: null,
  _startedAt: null,

  // ── Helpers ───────────────────────────────────────────────

  getSubject(id) {
    return this.SUBJECTS.find(s => s.id === id) || this.SUBJECTS[0];
  },

  getTreeEmoji(durationMin) {
    if (durationMin < 15) return '🌱';
    if (durationMin < 30) return '🌿';
    if (durationMin < 60) return '🌲';
    if (durationMin < 120) return '🌳';
    return '🌴';
  },

  fmtDur(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h === 0) return `${m}m`;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  },

  fmtTimer(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    if (h > 0) return `${h}:${mm}:${ss}`;
    return `${mm}:${ss}`;
  },

  getTodaySessions() {
    const today = AppState.getTodayKey();
    return (AppState.studyLog || []).filter(s => s.date === today);
  },

  getTodayTotalMin() {
    return this.getTodaySessions().reduce((sum, s) => sum + (s.duration_min || 0), 0);
  },

  getSessionsForDate(dateKey) {
    return (AppState.studyLog || []).filter(s => s.date === dateKey);
  },

  // ── Main render entry point ───────────────────────────────

  render() {
    this._renderTimer();
    this._renderForest();
    this._renderAnalytics();
  },

  // ── Timer ─────────────────────────────────────────────────

  _renderTimer() {
    const subSel = document.getElementById('studySubjectSel');
    const actSel = document.getElementById('studyActivitySel');
    if (!subSel) return;

    // Bind once
    if (!subSel.dataset.init) {
      subSel.dataset.init = '1';
      document.getElementById('studyStartBtn')?.addEventListener('click',  () => this._startTimer());
      document.getElementById('studyPauseBtn')?.addEventListener('click',  () => this._pauseResumeTimer());
      document.getElementById('studyStopBtn')?.addEventListener('click',   () => this._stopTimer());
    }

    this._updateTimerDisplay();
    this._updateTodayStats();
  },

  _updateTimerDisplay() {
    const disp  = document.getElementById('studyTimerDisplay');
    const start = document.getElementById('studyStartBtn');
    const pause = document.getElementById('studyPauseBtn');
    const stop  = document.getElementById('studyStopBtn');
    if (disp) disp.textContent = this.fmtTimer(this._elapsed);
    const active = this._elapsed > 0;
    if (start) start.style.display = active ? 'none' : '';
    if (pause) {
      pause.style.display = active ? '' : 'none';
      pause.textContent   = this._running ? '⏸ Pause' : '▶ Resume';
    }
    if (stop) stop.style.display = active ? '' : 'none';
  },

  _updateTodayStats() {
    const min  = this.getTodayTotalMin();
    const goal = 480; // 8h in minutes
    const pct  = Math.min(100, Math.round((min / goal) * 100));
    const el   = document.getElementById('studyTodayTotal');
    const bar  = document.getElementById('studyGoalBar');
    const pEl  = document.getElementById('studyGoalPct');
    if (el) el.textContent  = min > 0 ? this.fmtDur(min) : '0m';
    if (bar) bar.style.width = pct + '%';
    if (pEl) pEl.textContent = `${pct}% of 8h goal`;
  },

  _startTimer() {
    const subSel = document.getElementById('studySubjectSel');
    const actSel = document.getElementById('studyActivitySel');
    this._activeSubject  = subSel?.value  || 'history';
    this._activeActivity = actSel?.value  || 'reading';
    this._startedAt      = new Date().toISOString();
    this._elapsed        = 0;
    this._running        = true;
    if (subSel) subSel.disabled = true;
    if (actSel) actSel.disabled = true;
    this._timerInterval = setInterval(() => {
      this._elapsed++;
      const el = document.getElementById('studyTimerDisplay');
      if (el) el.textContent = this.fmtTimer(this._elapsed);
    }, 1000);
    this._updateTimerDisplay();
  },

  _pauseResumeTimer() {
    if (this._running) {
      clearInterval(this._timerInterval);
      this._running = false;
    } else {
      this._running = true;
      this._timerInterval = setInterval(() => {
        this._elapsed++;
        const el = document.getElementById('studyTimerDisplay');
        if (el) el.textContent = this.fmtTimer(this._elapsed);
      }, 1000);
    }
    this._updateTimerDisplay();
  },

  _stopTimer() {
    clearInterval(this._timerInterval);
    this._running       = false;
    this._timerInterval = null;

    const durationMin = Math.round(this._elapsed / 60);
    if (durationMin >= 1) {
      const session = {
        id:           Date.now(),
        date:         AppState.getTodayKey(),
        subject:      this._activeSubject  || 'history',
        activity:     this._activeActivity || 'reading',
        duration_min: durationMin,
        started_at:   this._startedAt,
      };
      if (!AppState.studyLog) AppState.studyLog = [];
      AppState.studyLog.push(session);
      AppState.save();
    }

    this._elapsed       = 0;
    this._startedAt     = null;
    const subSel = document.getElementById('studySubjectSel');
    const actSel = document.getElementById('studyActivitySel');
    if (subSel) subSel.disabled = false;
    if (actSel) actSel.disabled = false;
    this._updateTimerDisplay();
    this._updateTodayStats();
    this._renderForest();
    this._renderAnalytics();
  },

  // ── Forest ────────────────────────────────────────────────

  _renderForest() {
    const container = document.getElementById('studyForest');
    if (!container) return;
    const sessions = this.getTodaySessions();

    if (!sessions.length) {
      container.innerHTML = '<div class="study-forest-empty">Plant your first tree — start a session above 🌱</div>';
      return;
    }

    let trees = '';
    sessions.forEach(s => {
      const subj  = this.getSubject(s.subject);
      const emoji = this.getTreeEmoji(s.duration_min);
      trees += `<div class="study-tree" style="--tree-color:${subj.color}"
        title="${subj.label} · ${s.activity} · ${this.fmtDur(s.duration_min)}">
        <span class="study-tree-icon">${emoji}</span>
        <span class="study-tree-label">${subj.emoji} ${this.fmtDur(s.duration_min)}</span>
      </div>`;
    });

    const total = this.getTodayTotalMin();
    container.innerHTML = `
      <div class="study-forest-trees">${trees}</div>
      <div class="study-forest-total">Total today: <strong>${this.fmtDur(total)}</strong></div>`;
  },

  // ── Analytics ─────────────────────────────────────────────

  _renderAnalytics() {
    const tabs = document.getElementById('studyPeriodTabs');
    if (tabs && !tabs.dataset.init) {
      tabs.dataset.init = '1';
      tabs.querySelectorAll('.study-period-tab').forEach(btn => {
        btn.addEventListener('click', () => {
          tabs.querySelectorAll('.study-period-tab').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this._renderAnalyticsContent();
        });
      });
    }
    this._renderAnalyticsContent();
  },

  _renderAnalyticsContent() {
    const container = document.getElementById('studyAnalyticsContent');
    if (!container) return;
    const period = document.querySelector('.study-period-tab.active')?.dataset?.period || 'week';
    if (period === 'day')   this._renderDayView(container);
    if (period === 'week')  this._renderWeekView(container);
    if (period === 'month') this._renderMonthView(container);
    if (period === 'year')  this._renderYearView(container);
  },

  // Day view — session list + subject breakdown bars
  _renderDayView(c) {
    const sessions = this.getTodaySessions();
    if (!sessions.length) {
      c.innerHTML = '<div class="study-empty-state">No sessions logged today.</div>';
      return;
    }
    const total = sessions.reduce((sum, s) => sum + s.duration_min, 0);
    const bySubj = {};
    sessions.forEach(s => { bySubj[s.subject] = (bySubj[s.subject] || 0) + s.duration_min; });

    let html = '<div class="study-sessions-list">';
    [...sessions].reverse().forEach(s => {
      const subj = this.getSubject(s.subject);
      html += `<div class="study-session-row">
        <span class="study-session-tree">${this.getTreeEmoji(s.duration_min)}</span>
        <span class="study-session-subj" style="color:${subj.color}">${subj.emoji} ${subj.label}</span>
        <span class="study-session-act">${s.activity}</span>
        <span class="study-session-dur">${this.fmtDur(s.duration_min)}</span>
        <button class="btn-xs btn-danger" onclick="StudyTracker.deleteSession(${s.id})">✕</button>
      </div>`;
    });
    html += '</div><div class="study-subj-bars">';
    Object.entries(bySubj).sort((a, b) => b[1] - a[1]).forEach(([id, min]) => {
      const subj = this.getSubject(id);
      const pct  = Math.round((min / total) * 100);
      html += `<div class="study-subj-bar-row">
        <span class="study-subj-name">${subj.emoji} ${subj.label}</span>
        <div class="study-subj-track"><div class="study-subj-fill" style="width:${pct}%;background:${subj.color}"></div></div>
        <span class="study-subj-dur">${this.fmtDur(min)}</span>
      </div>`;
    });
    html += '</div>';
    c.innerHTML = html;
  },

  // Week view — stacked bar chart, 7 days
  _renderWeekView(c) {
    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key  = AppState.getDateKey(d);
      const sess = this.getSessionsForDate(key);
      const min  = sess.reduce((sum, s) => sum + s.duration_min, 0);
      days.push({ d, key, sess, min });
    }
    const maxMin = Math.max(...days.map(d => d.min), 60);

    let html = '<div class="study-week-chart">';
    days.forEach(({ d, key, sess, min }) => {
      const label   = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum  = d.getDate();
      const isToday = key === AppState.getTodayKey();
      const hPct    = Math.round((min / maxMin) * 100);

      const bySubj = {};
      sess.forEach(s => { bySubj[s.subject] = (bySubj[s.subject] || 0) + s.duration_min; });

      let segs = '';
      Object.entries(bySubj).forEach(([id, m]) => {
        const subj   = this.getSubject(id);
        const segPct = Math.round((m / min) * 100);
        segs += `<div class="study-week-seg" style="height:${segPct}%;background:${subj.color}"
          title="${subj.label}: ${this.fmtDur(m)}"></div>`;
      });

      html += `<div class="study-week-col${isToday ? ' today' : ''}">
        <div class="study-week-bar-wrap" title="${this.fmtDur(min)}">
          <div class="study-week-bar" style="height:${hPct}%">${segs}</div>
        </div>
        <div class="study-week-total">${min > 0 ? this.fmtDur(min) : ''}</div>
        <div class="study-week-label">${label}</div>
        <div class="study-week-date">${dayNum}</div>
      </div>`;
    });
    html += '</div>';

    // Legend for subjects actually used this week
    const usedSubjs = new Set(days.flatMap(d => d.sess.map(s => s.subject)));
    if (usedSubjs.size) {
      html += '<div class="study-week-legend">';
      usedSubjs.forEach(id => {
        const subj = this.getSubject(id);
        html += `<span class="study-legend-item">
          <span class="study-legend-dot" style="background:${subj.color}"></span>${subj.emoji} ${subj.label}
        </span>`;
      });
      html += '</div>';
    }
    c.innerHTML = html;
  },

  // Month view — calendar heatmap
  _renderMonthView(c) {
    const today      = new Date();
    const year       = today.getFullYear();
    const month      = today.getMonth();
    const daysInMo   = new Date(year, month + 1, 0).getDate();
    const firstDow   = new Date(year, month, 1).getDay();
    const startOff   = firstDow === 0 ? 6 : firstDow - 1; // Mon-based

    const isDark     = document.documentElement.getAttribute('data-theme') !== 'light';
    const emptyClr   = isDark ? '#1e254a' : '#dde3f5';
    const moLabel    = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    let html = `<div class="study-month-title">${moLabel}</div>
      <div class="study-month-grid">`;
    ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(d => {
      html += `<div class="study-month-hdr">${d}</div>`;
    });
    for (let i = 0; i < startOff; i++) html += '<div class="study-month-cell empty"></div>';
    for (let day = 1; day <= daysInMo; day++) {
      const d   = new Date(year, month, day);
      const key = AppState.getDateKey(d);
      const min = this.getSessionsForDate(key).reduce((s, x) => s + x.duration_min, 0);
      const isToday = key === AppState.getTodayKey();
      const bg  = min > 0
        ? `rgba(91,127,255,${Math.min(1, 0.3 + (min / 480) * 0.7).toFixed(2)})`
        : emptyClr;
      const hLabel = min > 0 ? `<span class="study-month-hrs">${this.fmtDur(min)}</span>` : '';
      html += `<div class="study-month-cell${isToday ? ' today' : ''}" style="background:${bg}"
        title="${day} ${moLabel.split(' ')[0]}: ${min > 0 ? this.fmtDur(min) : 'No study'}">
        <span class="study-month-daynum">${day}</span>${hLabel}
      </div>`;
    }
    html += '</div>';
    c.innerHTML = html;
  },

  // Year view — GitHub-style 52-week heatmap
  _renderYearView(c) {
    const today    = new Date();
    const weeks    = 52;
    const isDark   = document.documentElement.getAttribute('data-theme') !== 'light';
    const emptyCl  = isDark ? '#1e254a' : '#dde3f5';

    const start = new Date(today);
    start.setDate(today.getDate() - (weeks * 7 - 1));
    const dow = start.getDay();
    start.setDate(start.getDate() - (dow === 0 ? 6 : dow - 1));

    // Find max single-day minutes for scaling
    let maxMin = 60;
    for (let i = 0; i < weeks * 7; i++) {
      const d   = new Date(start);
      d.setDate(start.getDate() + i);
      const min = this.getSessionsForDate(AppState.getDateKey(d)).reduce((s, x) => s + x.duration_min, 0);
      if (min > maxMin) maxMin = min;
    }

    let html = '<div class="study-year-heatmap">';
    for (let col = 0; col < weeks; col++) {
      html += '<div class="study-year-col">';
      for (let row = 0; row < 7; row++) {
        const d = new Date(start);
        d.setDate(start.getDate() + col * 7 + row);
        if (d > today) { html += '<div class="study-year-cell"></div>'; continue; }
        const key   = AppState.getDateKey(d);
        const min   = this.getSessionsForDate(key).reduce((s, x) => s + x.duration_min, 0);
        const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        const bg    = min > 0
          ? `rgba(91,127,255,${Math.min(1, 0.3 + (min / maxMin) * 0.7).toFixed(2)})`
          : emptyCl;
        html += `<div class="study-year-cell" style="background:${bg}"
          title="${label}: ${min > 0 ? this.fmtDur(min) : 'No study'}"></div>`;
      }
      html += '</div>';
    }
    html += '</div>';
    html += `<div class="study-year-legend">
      <span>Less</span>
      <div class="study-year-legend-swatches">
        <div style="background:${emptyCl}"></div>
        <div style="background:rgba(91,127,255,0.3)"></div>
        <div style="background:rgba(91,127,255,0.55)"></div>
        <div style="background:rgba(91,127,255,0.75)"></div>
        <div style="background:rgba(91,127,255,1)"></div>
      </div>
      <span>More</span>
    </div>`;
    c.innerHTML = html;
  },

  // ── Actions ───────────────────────────────────────────────

  deleteSession(id) {
    AppState.studyLog = (AppState.studyLog || []).filter(s => s.id !== id);
    AppState.save();
    this._updateTodayStats();
    this._renderForest();
    this._renderAnalyticsContent();
  },
};
