// ============================================================
// ATHENA — Study Tracker
// Forest-style: unified canvas + range-filtered trees + stats
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
    { id: 'class',           label: 'Class' },
    { id: 'reading',         label: 'Reading' },
    { id: 'revision',        label: 'Revision' },
    { id: 'notes',           label: 'Note-making' },
    { id: 'mock_test',       label: 'Mock Test' },
    { id: 'answer_writing',  label: 'Answer Writing' },
    { id: 'newspaper',       label: 'Newspaper' },
  ],

  _timerInterval: null,
  _clockInterval: null,
  _elapsed: 0,
  _running: false,
  _activeSubject: null,
  _activeActivity: null,
  _startedAt: null,
  _range: 'today',  // active range: today | 7d | 30d | 3m | all

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
    const h  = Math.floor(sec / 3600);
    const m  = Math.floor((sec % 3600) / 60);
    const s  = sec % 60;
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  },

  fmtClock(date) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  },

  fmtDateLabel(date) {
    return date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  },

  getSessionsForRange(range) {
    const all  = AppState.studyLog || [];
    const today = new Date();
    const todayKey = AppState.getTodayKey();

    if (range === 'today') return all.filter(s => s.date === todayKey);

    const cutoff = new Date(today);
    if (range === '7d')  cutoff.setDate(today.getDate() - 6);
    if (range === '30d') cutoff.setDate(today.getDate() - 29);
    if (range === '3m')  cutoff.setMonth(today.getMonth() - 3);
    if (range === 'all') return all;

    const cutoffKey = AppState.getDateKey(cutoff);
    return all.filter(s => s.date >= cutoffKey);
  },

  getTodaySessions()  { return this.getSessionsForRange('today'); },
  getTodayTotalMin()  { return this.getTodaySessions().reduce((s, x) => s + x.duration_min, 0); },
  getSessionsForDate(key) { return (AppState.studyLog || []).filter(s => s.date === key); },

  getStreak() {
    let streak = 0;
    const d = new Date();
    while (true) {
      const k = AppState.getDateKey(d);
      if (!this.getSessionsForDate(k).length) break;
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  },

  // ── Main render entry ─────────────────────────────────────

  render() {
    this._renderTimer();
    this._renderClock();
    this._startClock();
    this._renderForestPanel();
  },

  // ── Live clock ────────────────────────────────────────────

  _renderClock() {
    const el   = document.getElementById('studyClockTime');
    const dateEl = document.getElementById('studyClockDate');
    const now  = new Date();
    if (el)   el.textContent   = this.fmtClock(now);
    if (dateEl) dateEl.textContent = this.fmtDateLabel(now);
  },

  _startClock() {
    if (this._clockInterval) return;
    this._clockInterval = setInterval(() => this._renderClock(), 30000);
  },

  // ── Timer (sidebar) ───────────────────────────────────────

  _renderTimer() {
    const subSel = document.getElementById('studySubjectSel');
    if (!subSel) return;
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
    if (pause) { pause.style.display = active ? '' : 'none'; pause.textContent = this._running ? '⏸ Pause' : '▶ Resume'; }
    if (stop)  stop.style.display = active ? '' : 'none';
  },

  _updateTodayStats() {
    const min = this.getTodayTotalMin();
    const pct = Math.min(100, Math.round((min / 480) * 100));
    const el    = document.getElementById('studyTodayTotal');
    const bar   = document.getElementById('studyGoalBar');
    const pEl   = document.getElementById('studyGoalPct');
    const badge = document.getElementById('studyTodayBadge');
    if (el)    el.textContent   = min > 0 ? this.fmtDur(min) : '0m';
    if (bar)   bar.style.width  = pct + '%';
    if (pEl)   pEl.textContent  = `${pct}% of 8h goal`;
    if (badge) badge.textContent = min > 0 ? `${this.fmtDur(min)} today` : '0m today';
  },

  _startTimer() {
    const subSel = document.getElementById('studySubjectSel');
    const actSel = document.getElementById('studyActivitySel');
    this._activeSubject  = subSel?.value || 'history';
    this._activeActivity = actSel?.value || 'class';
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
    this._running = false; this._timerInterval = null;
    const durationMin = Math.round(this._elapsed / 60);
    if (durationMin >= 1) {
      if (!AppState.studyLog) AppState.studyLog = [];
      AppState.studyLog.push({
        id:           Date.now(),
        date:         AppState.getTodayKey(),
        subject:      this._activeSubject  || 'history',
        activity:     this._activeActivity || 'class',
        duration_min: durationMin,
        started_at:   this._startedAt,
      });
      AppState.save();
    }
    this._elapsed = 0; this._startedAt = null;
    const subSel = document.getElementById('studySubjectSel');
    const actSel = document.getElementById('studyActivitySel');
    if (subSel) subSel.disabled = false;
    if (actSel) actSel.disabled = false;
    this._updateTimerDisplay();
    this._updateTodayStats();
    this._renderForestPanel();
  },

  // ── Unified Forest Panel ──────────────────────────────────

  _renderForestPanel() {
    // Bind range buttons once
    const rangeRow = document.getElementById('studyRangeRow');
    if (rangeRow && !rangeRow.dataset.init) {
      rangeRow.dataset.init = '1';
      rangeRow.querySelectorAll('.study-range-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          rangeRow.querySelectorAll('.study-range-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this._range = btn.dataset.range;
          this._renderForestContent();
        });
      });
    }
    this._renderForestContent();
  },

  _renderForestContent() {
    const sessions = this.getSessionsForRange(this._range);
    this._renderCanvasTrees(sessions);
    this._renderStats(sessions);
    this._renderSubjBars(sessions);
    this._renderSessionList(sessions);
  },

  // Trees scattered across the canvas background
  _renderCanvasTrees(sessions) {
    const container = document.getElementById('studyCanvasTrees');
    if (!container) return;

    if (!sessions.length) {
      container.innerHTML = '<div class="study-canvas-empty">Start a session to grow your forest 🌱</div>';
      return;
    }

    // Deterministic positions using session id as seed (stable on re-render)
    const trees = sessions.map((s, i) => {
      const subj  = this.getSubject(s.subject);
      const emoji = this.getTreeEmoji(s.duration_min);
      const seed  = s.id % 1000;
      // Spread across canvas: left 5–90%, bottom row varies slightly
      const left  = 5 + ((seed * 13 + i * 37) % 86);
      const btm   = 8 + ((seed * 7  + i * 11) % 22);
      const scale = s.duration_min < 15 ? 0.8 : s.duration_min < 60 ? 1 : 1.25;
      return `<div class="study-canvas-tree" style="left:${left}%;bottom:${btm}%;transform:scale(${scale})"
        title="${subj.label} · ${s.activity} · ${this.fmtDur(s.duration_min)}">
        ${emoji}
      </div>`;
    });

    container.innerHTML = trees.join('');
  },

  // Summary stats row
  _renderStats(sessions) {
    const el = document.getElementById('studySummaryRow');
    if (!el) return;
    const total   = sessions.reduce((s, x) => s + x.duration_min, 0);
    const count   = sessions.length;
    const streak  = this.getStreak();

    const rangeLabel = { today: 'Today', '7d': 'This Week', '30d': 'This Month', '3m': 'Last 3 Months', all: 'All Time' }[this._range] || '';

    el.innerHTML = `
      <div class="study-stat-chip"><span class="study-stat-val">${this.fmtDur(total)}</span><span class="study-stat-lbl">${rangeLabel}</span></div>
      <div class="study-stat-chip"><span class="study-stat-val">${count}</span><span class="study-stat-lbl">sessions</span></div>
      <div class="study-stat-chip"><span class="study-stat-val">${streak}</span><span class="study-stat-lbl">day streak 🔥</span></div>`;
  },

  // Subject breakdown bars
  _renderSubjBars(sessions) {
    const el = document.getElementById('studySubjBarsMain');
    if (!el) return;
    if (!sessions.length) { el.innerHTML = ''; return; }

    const total  = sessions.reduce((s, x) => s + x.duration_min, 0);
    const bySubj = {};
    sessions.forEach(s => { bySubj[s.subject] = (bySubj[s.subject] || 0) + s.duration_min; });

    let html = '';
    Object.entries(bySubj).sort((a, b) => b[1] - a[1]).forEach(([id, min]) => {
      const subj = this.getSubject(id);
      const pct  = Math.round((min / total) * 100);
      html += `<div class="study-subj-bar-row">
        <span class="study-subj-name">${subj.emoji} ${subj.label}</span>
        <div class="study-subj-track"><div class="study-subj-fill" style="width:${pct}%;background:${subj.color}"></div></div>
        <span class="study-subj-dur">${this.fmtDur(min)}</span>
      </div>`;
    });
    el.innerHTML = html;
  },

  // Recent session list with delete
  _renderSessionList(sessions) {
    const el = document.getElementById('studySessionsList');
    if (!el) return;
    if (!sessions.length) { el.innerHTML = ''; return; }

    const shown = [...sessions].reverse().slice(0, 20);
    let html = '<div class="study-sessions-hdr">Recent Sessions</div>';
    shown.forEach(s => {
      const subj = this.getSubject(s.subject);
      html += `<div class="study-session-row">
        <span class="study-session-tree">${this.getTreeEmoji(s.duration_min)}</span>
        <span class="study-session-subj" style="color:${subj.color}">${subj.emoji} ${subj.label}</span>
        <span class="study-session-act">${s.activity}</span>
        <span class="study-session-date">${s.date !== AppState.getTodayKey() ? s.date : ''}</span>
        <span class="study-session-dur">${this.fmtDur(s.duration_min)}</span>
        <button class="btn-xs btn-danger" onclick="StudyTracker.deleteSession(${s.id})">✕</button>
      </div>`;
    });
    el.innerHTML = html;
  },

  // ── Actions ───────────────────────────────────────────────

  deleteSession(id) {
    AppState.studyLog = (AppState.studyLog || []).filter(s => s.id !== id);
    AppState.save();
    this._updateTodayStats();
    this._renderForestPanel();
  },
};
