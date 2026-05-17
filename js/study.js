// ============================================================
// ATHENA — Study Tracker v4
// 40-min tree rule · withered trees · Pomodoro · editable lists
// ============================================================

const StudyTracker = {

  // ── Defaults ──────────────────────────────────────────────

  DEFAULT_SUBJECTS: [
    { id: 'history',         label: 'History',        emoji: '🏛️', color: '#e8916a' },
    { id: 'geography',       label: 'Geography',       emoji: '🌍', color: '#5cb88a' },
    { id: 'polity',          label: 'Polity',          emoji: '⚖️', color: '#6a7be8' },
    { id: 'economy',         label: 'Economy',         emoji: '📈', color: '#e8c56a' },
    { id: 'science',         label: 'Science & Tech',  emoji: '🔬', color: '#56d4e0' },
    { id: 'csat',            label: 'CSAT',            emoji: '🧮', color: '#e87ab0' },
    { id: 'current_affairs', label: 'Current Affairs', emoji: '📰', color: '#9b7be8' },
    { id: 'essay',           label: 'Essay',           emoji: '✍️', color: '#7ba8e8' },
    { id: 'optional',        label: 'Optional',        emoji: '🎯', color: '#56e0c8' },
    { id: 'revision',        label: 'Revision',        emoji: '🔄', color: '#e8a556' },
  ],

  DEFAULT_ACTIVITIES: [
    { id: 'class',          label: 'Class',          tree: '🌳' },
    { id: 'reading',        label: 'Reading',        tree: '🌲' },
    { id: 'revision',       label: 'Revision',       tree: '🌿' },
    { id: 'notes',          label: 'Note-making',    tree: '🍀' },
    { id: 'mock_test',      label: 'Mock Test',      tree: '🌵' },
    { id: 'answer_writing', label: 'Answer Writing', tree: '🎋' },
    { id: 'newspaper',      label: 'Newspaper',      tree: '🌸' },
  ],

  MODE_DESCS: {
    stopwatch: 'Counts up freely — stop anytime to save. No target, no pressure.',
    countdown: 'Set your target duration. Stop early and your tree withers 🥀.',
    pomodoro:  '25 min focus + 5 min break, cycling automatically. Complete each round to grow a tree.',
  },

  // ── Runtime state ─────────────────────────────────────────

  _timerInterval: null,
  _clockInterval: null,
  _elapsed:        0,     // seconds elapsed this phase
  _countdown:      0,     // total seconds for countdown/pomodoro work phase
  _running:        false,
  _mode:          'stopwatch',  // stopwatch | countdown | pomodoro
  _activeSubject:  null,
  _activeActivity: null,
  _startedAt:      null,
  _range:         'today',
  _manageTab:     'subjects',
  // Pomodoro state
  _pomoPhase:     'idle',  // idle | work | break | longbreak
  _pomoRound:      0,      // rounds completed this cycle (0-3)
  _pomoWorkMin:    25,
  _pomoBreakMin:   5,
  _pomoLongMin:    15,

  // ── Accessors ─────────────────────────────────────────────

  getSubjects()   { return AppState.studySubjects   || this.DEFAULT_SUBJECTS; },
  getActivities() { return AppState.studyActivities || this.DEFAULT_ACTIVITIES; },
  getSubject(id)  { return this.getSubjects().find(s => s.id === id)   || this.DEFAULT_SUBJECTS[0]; },
  getActivity(id) { return this.getActivities().find(a => a.id === id) || this.DEFAULT_ACTIVITIES[0]; },

  // ── Tree logic: 40 min = full tree ────────────────────────

  // Returns the emoji for a completed/saved session
  treeEmoji(durationMin, activityId, completed = true) {
    if (!completed) return '🥀';              // withered — stopped early
    const act = this.getActivity(activityId);
    const full = act?.tree || '🌳';
    if (durationMin < 10) return '🌱';
    if (durationMin < 25) return '🌿';
    if (durationMin < 40) return '🪴';
    return full;                               // ≥ 40 min = activity species
  },

  // CSS scale for canvas trees — 40 min = scale 1.0
  treeScale(durationMin) {
    if (durationMin < 10) return 0.55;
    if (durationMin < 25) return 0.72;
    if (durationMin < 40) return 0.88;
    // Grows slightly beyond 40 min, capped at 1.5
    return Math.min(1.5, 1.0 + (durationMin - 40) / 120);
  },

  // Live tree while a session is running
  liveTreeEmoji(activityId) {
    const min = Math.floor(this._elapsed / 60);
    if (min < 5)  return '🌱';
    if (min < 15) return '🌿';
    if (min < 30) return '🪴';
    const act = this.getActivity(activityId);
    return act?.tree || '🌳';
  },

  liveTreeScale() {
    const min = Math.floor(this._elapsed / 60);
    // Grows from tiny seedling to full tree over 40 min
    return 0.5 + Math.min(min / 40, 1.0) * 0.9;
  },

  // ── Format helpers ────────────────────────────────────────

  fmtDur(min) {
    if (!min) return '0m';
    const h = Math.floor(min / 60), m = min % 60;
    return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`;
  },

  fmtTimer(sec) {
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    const mm = String(m).padStart(2,'0'), ss = String(s).padStart(2,'0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  },

  fmtClock(d) { return d.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:true }); },
  fmtDate(d)  { return d.toLocaleDateString('en-US', { weekday:'long', day:'numeric', month:'long' }); },

  // ── Session queries ───────────────────────────────────────

  getTodaySessions()    { return this.getSessionsForRange('today'); },
  getTodayTotalMin()    { return this.getTodaySessions().reduce((s,x) => s + x.duration_min, 0); },
  getSessionsForDate(k) { return (AppState.studyLog||[]).filter(s => s.date === k); },

  getSessionsForRange(range) {
    const all = AppState.studyLog || [];
    const tk  = AppState.getTodayKey();
    if (range === 'today') return all.filter(s => s.date === tk);
    if (range === 'all')   return all;
    const cut = new Date();
    if (range === '7d')  cut.setDate(cut.getDate() - 6);
    if (range === '30d') cut.setDate(cut.getDate() - 29);
    if (range === '3m')  cut.setMonth(cut.getMonth() - 3);
    const ck = AppState.getDateKey(cut);
    return all.filter(s => s.date >= ck);
  },

  getStreak() {
    let n = 0; const d = new Date();
    while (this.getSessionsForDate(AppState.getDateKey(d)).some(s => s.completed !== false)) {
      n++; d.setDate(d.getDate()-1);
    }
    return n;
  },

  // ── Main render ───────────────────────────────────────────

  render() {
    this._renderClock();
    this._startClock();
    this._renderTimerPanel();
    this._renderForestPanel();
  },

  // ── Clock ─────────────────────────────────────────────────

  _renderClock() {
    const now = new Date();
    const t = document.getElementById('studyClockTime');
    const d = document.getElementById('studyClockDate');
    if (t) t.textContent = this.fmtClock(now);
    if (d) d.textContent = this.fmtDate(now);
  },

  _startClock() {
    if (this._clockInterval) return;
    this._clockInterval = setInterval(() => this._renderClock(), 30000);
  },

  // ── Timer panel ───────────────────────────────────────────

  _renderTimerPanel() {
    this._populateSelects();

    const modeRow = document.getElementById('studyModeToggle');
    if (modeRow && !modeRow.dataset.init) {
      modeRow.dataset.init = '1';

      modeRow.querySelectorAll('.study-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (this._running) return;
          modeRow.querySelectorAll('.study-mode-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this._mode = btn.dataset.mode;

          // Show/hide countdown inputs
          const cdEl = document.getElementById('studyCountdownSet');
          if (cdEl) cdEl.style.display = this._mode === 'countdown' ? 'flex' : 'none';

          // Show/hide pomodoro status
          const psEl = document.getElementById('studyPomoStatus');
          if (psEl) psEl.style.display = this._mode === 'pomodoro' ? 'flex' : 'none';

          // Update description
          const desc = document.getElementById('studyTimerDesc');
          if (desc) desc.textContent = this.MODE_DESCS[this._mode] || '';

          // Reset display
          this._elapsed = 0; this._countdown = 0;
          this._pomoPhase = 'idle'; this._pomoRound = 0;
          this._updateTimerDisplay();
          this._updateLiveTree();
          this._updatePomoStatus();
        });
      });

      document.getElementById('studyStartBtn')?.addEventListener('click',  () => this._startTimer());
      document.getElementById('studyPauseBtn')?.addEventListener('click',  () => this._pauseResumeTimer());
      document.getElementById('studyStopBtn')?.addEventListener('click',   () => this._stopTimer(false));

      document.getElementById('studyGoalInput')?.addEventListener('change', e => {
        const v = parseInt(e.target.value);
        if (v > 0) { AppState.studyDailyGoal = v * 60; AppState.save(); this._updateTodayStats(); }
      });
    }

    this._updateTimerDisplay();
    this._updateLiveTree();
    this._updateTodayStats();
    this._updatePomoStatus();

    // Set initial description
    const desc = document.getElementById('studyTimerDesc');
    if (desc && !desc.dataset.set) { desc.dataset.set='1'; desc.textContent = this.MODE_DESCS[this._mode]; }
  },

  _populateSelects() {
    const subSel = document.getElementById('studySubjectSel');
    const actSel = document.getElementById('studyActivitySel');
    if (subSel) {
      const cur = subSel.value;
      subSel.innerHTML = this.getSubjects().map(s =>
        `<option value="${esc(s.id)}">${esc(s.emoji)} ${esc(s.label)}</option>`).join('');
      if (cur) subSel.value = cur;
    }
    if (actSel) {
      const cur = actSel.value;
      actSel.innerHTML = this.getActivities().map(a =>
        `<option value="${esc(a.id)}">${esc(a.tree||'🌱')} ${esc(a.label)}</option>`).join('');
      if (cur) actSel.value = cur;
      if (!actSel.dataset.init) {
        actSel.dataset.init = '1';
        actSel.addEventListener('change', () => this._updateLiveTree());
      }
    }
  },

  _updateTimerDisplay() {
    const disp  = document.getElementById('studyTimerDisplay');
    const start = document.getElementById('studyStartBtn');
    const pause = document.getElementById('studyPauseBtn');
    const stop  = document.getElementById('studyStopBtn');

    let display = this.fmtTimer(this._elapsed);
    if (this._mode === 'countdown' && this._countdown > 0) {
      display = this.fmtTimer(Math.max(0, this._countdown - this._elapsed));
    } else if (this._mode === 'pomodoro') {
      const target = this._pomoPhase === 'break'
        ? this._pomoBreakMin * 60
        : this._pomoPhase === 'longbreak'
          ? this._pomoLongMin * 60
          : this._pomoWorkMin * 60;
      display = this.fmtTimer(Math.max(0, target - this._elapsed));
    }
    if (disp) disp.textContent = display;

    const active = this._running || this._elapsed > 0;
    if (start) start.style.display = active ? 'none' : '';
    if (pause) {
      pause.style.display = active ? '' : 'none';
      pause.textContent = this._running ? '⏸ Pause' : '▶ Resume';
    }
    if (stop) stop.style.display = active ? '' : 'none';
  },

  _updateLiveTree() {
    const treeEl  = document.getElementById('studyLiveTree');
    const labelEl = document.getElementById('studyLiveTreeLabel');
    const actSel  = document.getElementById('studyActivitySel');
    const actId   = this._running ? (this._activeActivity||'class') : (actSel?.value||'class');

    if (treeEl) {
      const emoji    = this._running ? this.liveTreeEmoji(actId) : (this.getActivity(actId)?.tree || '🌱');
      const scalePx  = this._running ? Math.round(48 * this.liveTreeScale()) : 48;
      treeEl.textContent = emoji;
      treeEl.style.fontSize = `${scalePx}px`;
      treeEl.className = 'study-live-tree' + (this._running ? ' study-live-tree-active' : '');
    }
    if (labelEl) {
      const act = this.getActivity(actId);
      labelEl.textContent = act?.label || '';
      labelEl.style.display = this._running ? '' : 'none';
    }
  },

  _updateTodayStats() {
    const min  = this.getTodayTotalMin();
    const goal = AppState.studyDailyGoal || 480;
    const pct  = goal > 0 ? Math.min(100, Math.round((min / goal) * 100)) : 0;
    const s    = id => document.getElementById(id);
    if (s('studyTodayTotal')) s('studyTodayTotal').textContent = this.fmtDur(min);
    if (s('studyGoalBar'))    s('studyGoalBar').style.width = pct + '%';
    if (s('studyGoalPct'))    s('studyGoalPct').textContent  = `${pct}% of ${this.fmtDur(goal)} goal`;
    if (s('studyTodayBadge')) s('studyTodayBadge').textContent = this.fmtDur(min) + ' today';
    if (s('studyGoalInput') && !s('studyGoalInput').dataset.set) {
      s('studyGoalInput').value = Math.round(goal / 60);
      s('studyGoalInput').dataset.set = '1';
    }
  },

  _updatePomoStatus() {
    const el = document.getElementById('studyPomoStatus');
    if (!el) return;
    if (this._mode !== 'pomodoro') { el.style.display = 'none'; return; }
    el.style.display = 'flex';

    const phaseEl = document.getElementById('studyPomoPhase');
    const roundEl = document.getElementById('studyPomoRound');
    const icons   = { idle: '🍅', work: '🎯 Focus', break: '☕ Break', longbreak: '🌙 Long Break' };
    if (phaseEl) phaseEl.textContent = icons[this._pomoPhase] || '🍅';
    if (roundEl) roundEl.textContent = this._pomoPhase === 'idle'
      ? 'Ready to start'
      : `Round ${this._pomoRound + 1}`;
  },

  // ── Timer lifecycle ───────────────────────────────────────

  _startTimer() {
    const subSel = document.getElementById('studySubjectSel');
    const actSel = document.getElementById('studyActivitySel');
    this._activeSubject  = subSel?.value || 'history';
    this._activeActivity = actSel?.value || 'class';
    this._startedAt      = new Date().toISOString();
    this._elapsed        = 0;
    this._running        = true;

    if (this._mode === 'countdown') {
      const h = parseInt(document.getElementById('studyCountHours')?.value) || 0;
      const m = parseInt(document.getElementById('studyCountMins')?.value)  || 25;
      this._countdown = (h * 60 + m) * 60;
    } else if (this._mode === 'pomodoro') {
      this._pomoPhase = 'work';
      this._countdown = this._pomoWorkMin * 60;
      this._updatePomoStatus();
    } else {
      this._countdown = 0;
    }

    if (subSel) subSel.disabled = true;
    if (actSel) actSel.disabled = true;

    this._timerInterval = setInterval(() => { this._elapsed++; this._onTick(); }, 1000);
    this._updateTimerDisplay();
    this._updateLiveTree();
  },

  _onTick() {
    // Update display every tick
    this._updateTimerDisplay();
    // Update live tree every minute
    if (this._elapsed % 60 === 0) this._updateLiveTree();

    if (this._mode === 'countdown' && this._countdown > 0) {
      if (this._elapsed >= this._countdown) { this._stopTimer(true); }

    } else if (this._mode === 'pomodoro') {
      const phaseSec = this._pomoPhase === 'break'
        ? this._pomoBreakMin * 60
        : this._pomoPhase === 'longbreak'
          ? this._pomoLongMin * 60
          : this._pomoWorkMin * 60;

      if (this._elapsed >= phaseSec) {
        if (this._pomoPhase === 'work') {
          // Work phase complete — save a completed session, then start break
          this._saveSession(true);
          this._pomoRound++;
          clearInterval(this._timerInterval);
          this._elapsed   = 0;
          this._running   = false;
          const isLong    = this._pomoRound >= 4;
          this._pomoPhase = isLong ? 'longbreak' : 'break';
          if (isLong) this._pomoRound = 0;
          this._updatePomoStatus();
          this._updateTimerDisplay();
          this._updateLiveTree();
          this._updateTodayStats();
          this._renderForestPanel();
          if (typeof UI !== 'undefined') UI.showToast(`🌳 Pomodoro complete! Time for a ${isLong ? 'long ' : ''}break.`);
          // Auto-start break
          this._running  = true;
          this._startedAt = new Date().toISOString();
          this._timerInterval = setInterval(() => { this._elapsed++; this._onTick(); }, 1000);

        } else {
          // Break complete — stop and wait for user to start next round
          clearInterval(this._timerInterval);
          this._running   = false;
          this._elapsed   = 0;
          this._pomoPhase = 'idle';
          this._updatePomoStatus();
          this._updateTimerDisplay();
          const subSel = document.getElementById('studySubjectSel');
          const actSel = document.getElementById('studyActivitySel');
          if (subSel) subSel.disabled = false;
          if (actSel) actSel.disabled = false;
          if (typeof UI !== 'undefined') UI.showToast('☕ Break over — ready for next Pomodoro!');
        }
      }
    }
  },

  _pauseResumeTimer() {
    if (this._running) {
      clearInterval(this._timerInterval);
      this._running = false;
    } else {
      this._running = true;
      this._timerInterval = setInterval(() => { this._elapsed++; this._onTick(); }, 1000);
    }
    this._updateTimerDisplay();
    this._updateLiveTree();
  },

  _stopTimer(completed = false) {
    clearInterval(this._timerInterval);
    this._running = false; this._timerInterval = null;

    // Only save for non-pomodoro, or manual stop of pomodoro work phase
    const shouldSave = this._mode !== 'pomodoro' || this._pomoPhase === 'work';
    if (shouldSave) this._saveSession(completed);

    this._elapsed    = 0;
    this._countdown  = 0;
    this._startedAt  = null;
    this._pomoPhase  = 'idle';
    this._pomoRound  = 0;

    const subSel = document.getElementById('studySubjectSel');
    const actSel = document.getElementById('studyActivitySel');
    if (subSel) subSel.disabled = false;
    if (actSel) actSel.disabled = false;

    this._updateTimerDisplay();
    this._updateLiveTree();
    this._updateTodayStats();
    this._updatePomoStatus();
    this._renderForestPanel();

    if (completed && typeof UI !== 'undefined') {
      UI.showToast('⏰ Session complete — tree planted! 🌳');
    }
  },

  _saveSession(completed) {
    // For countdown, use the target as duration when completed; elapsed otherwise
    let durationMin;
    if (this._mode === 'countdown' && this._countdown > 0) {
      durationMin = completed
        ? Math.round(this._countdown / 60)
        : Math.round(this._elapsed   / 60);
    } else if (this._mode === 'pomodoro') {
      durationMin = this._pomoWorkMin; // always the full work interval
    } else {
      durationMin = Math.round(this._elapsed / 60);
    }

    if (durationMin < 1) return;
    if (!AppState.studyLog) AppState.studyLog = [];
    AppState.studyLog.push({
      id:           Date.now(),
      date:         AppState.getTodayKey(),
      subject:      this._activeSubject  || 'history',
      activity:     this._activeActivity || 'class',
      duration_min: durationMin,
      completed:    completed,  // false = withered tree
      started_at:   this._startedAt,
    });
    AppState.save();
  },

  // ── Forest panel ──────────────────────────────────────────

  _renderForestPanel() {
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
    this._renderManagePanel();
  },

  _renderForestContent() {
    const sessions = this.getSessionsForRange(this._range);
    this._renderCanvasTrees(sessions);
    this._renderStats(sessions);
    this._renderSubjBars(sessions);
    this._renderActivityBars(sessions);
    this._renderSessionList(sessions);
  },

  _renderCanvasTrees(sessions) {
    const c = document.getElementById('studyCanvasTrees');
    if (!c) return;

    let liveHtml = '';
    if (this._running && this._activeActivity && this._pomoPhase !== 'break' && this._pomoPhase !== 'longbreak') {
      const emoji = this.liveTreeEmoji(this._activeActivity);
      const scl   = this.liveTreeScale();
      liveHtml = `<div class="study-canvas-tree study-canvas-tree-live"
        style="left:50%;bottom:20%;font-size:${Math.round(32*scl)}px;transform:translateX(-50%)"
        title="Current session (${this.fmtTimer(this._elapsed)})"></div>`;
      // Set inner text via textContent to avoid XSS — but since we build as HTML let's use esc
      liveHtml = `<div class="study-canvas-tree study-canvas-tree-live"
        style="left:50%;bottom:20%;font-size:${Math.round(32*scl)}px;transform:translateX(-50%)"
        title="In progress — ${this.fmtTimer(this._elapsed)}">${emoji}</div>`;
    }

    if (!sessions.length && !liveHtml) {
      c.innerHTML = '<div class="study-canvas-empty">Start a session to grow your forest 🌱</div>';
      return;
    }

    const trees = sessions.map((s, i) => {
      const subj  = this.getSubject(s.subject);
      const emoji = this.treeEmoji(s.duration_min, s.activity, s.completed !== false);
      const scale = s.completed !== false ? this.treeScale(s.duration_min) : 0.6;
      const seed  = s.id % 1000;
      const left  = 5 + ((seed * 13 + i * 37) % 82);
      const btm   = 8 + ((seed * 7  + i * 11) % 20);
      const opacity = s.completed !== false ? 1 : 0.6;
      return `<div class="study-canvas-tree${s.completed === false ? ' study-canvas-tree-dead' : ''}"
        style="left:${left}%;bottom:${btm}%;font-size:${Math.round(28*scale)}px;opacity:${opacity}"
        title="${subj.label} · ${s.activity} · ${this.fmtDur(s.duration_min)}${s.completed===false?' (incomplete)':''}">${emoji}</div>`;
    });

    c.innerHTML = trees.join('') + liveHtml;
  },

  _renderStats(sessions) {
    const el = document.getElementById('studySummaryRow');
    if (!el) return;
    const completed = sessions.filter(s => s.completed !== false);
    const total     = completed.reduce((s,x) => s + x.duration_min, 0);
    const streak    = this.getStreak();
    const label = { today:'Today', '7d':'7 Days', '30d':'30 Days', '3m':'3 Months', all:'All Time' }[this._range] || '';
    el.innerHTML = `
      <div class="study-stat-chip"><span class="study-stat-val">${this.fmtDur(total)||'0m'}</span><span class="study-stat-lbl">${label}</span></div>
      <div class="study-stat-chip"><span class="study-stat-val">${completed.length}</span><span class="study-stat-lbl">trees planted</span></div>
      <div class="study-stat-chip"><span class="study-stat-val">${streak}</span><span class="study-stat-lbl">day streak 🔥</span></div>`;
  },

  _renderSubjBars(sessions) {
    const el = document.getElementById('studySubjBarsMain');
    if (!el) return;
    const done = sessions.filter(s => s.completed !== false);
    if (!done.length) { el.innerHTML = ''; return; }
    const total = done.reduce((s,x) => s + x.duration_min, 0);
    const byS   = {};
    done.forEach(s => { byS[s.subject] = (byS[s.subject]||0) + s.duration_min; });
    let html = '<div class="study-bars-title">By Subject</div>';
    Object.entries(byS).sort((a,b) => b[1]-a[1]).forEach(([id,min]) => {
      const subj = this.getSubject(id);
      const pct  = Math.round((min/total)*100);
      html += `<div class="study-subj-bar-row">
        <span class="study-subj-name">${subj.emoji} ${subj.label}</span>
        <div class="study-subj-track"><div class="study-subj-fill" style="width:${pct}%;background:${subj.color}"></div></div>
        <span class="study-subj-dur">${this.fmtDur(min)}</span>
      </div>`;
    });
    el.innerHTML = html;
  },

  _renderActivityBars(sessions) {
    const el = document.getElementById('studyActBarsMain');
    if (!el) return;
    const done = sessions.filter(s => s.completed !== false);
    if (!done.length) { el.innerHTML = ''; return; }
    const total = done.reduce((s,x) => s + x.duration_min, 0);
    const byA   = {};
    done.forEach(s => { byA[s.activity] = (byA[s.activity]||0) + s.duration_min; });
    let html = '<div class="study-bars-title">By Activity</div>';
    Object.entries(byA).sort((a,b) => b[1]-a[1]).forEach(([id,min]) => {
      const act  = this.getActivity(id);
      const pct  = Math.round((min/total)*100);
      html += `<div class="study-subj-bar-row">
        <span class="study-subj-name">${act?.tree||'🌱'} ${act?.label||id}</span>
        <div class="study-subj-track"><div class="study-subj-fill" style="width:${pct}%;background:var(--accent-teal)"></div></div>
        <span class="study-subj-dur">${this.fmtDur(min)}</span>
      </div>`;
    });
    el.innerHTML = html;
  },

  _renderSessionList(sessions) {
    const el = document.getElementById('studySessionsList');
    if (!el) return;
    if (!sessions.length) { el.innerHTML = ''; return; }
    const shown = [...sessions].reverse().slice(0, 30);
    let html = '<div class="study-sessions-hdr">Recent Sessions</div>';
    shown.forEach(s => {
      const subj      = this.getSubject(s.subject);
      const act       = this.getActivity(s.activity);
      const completed = s.completed !== false;
      const emoji     = this.treeEmoji(s.duration_min, s.activity, completed);
      html += `<div class="study-session-row${completed ? '' : ' study-session-dead'}">
        <span class="study-session-tree">${emoji}</span>
        <span class="study-session-subj" style="color:${subj.color}">${subj.emoji} ${subj.label}</span>
        <span class="study-session-act">${act?.label||s.activity}</span>
        <span class="study-session-date">${s.date !== AppState.getTodayKey() ? s.date : ''}</span>
        <span class="study-session-dur">${this.fmtDur(s.duration_min)}${completed ? '' : ' <span class="study-dead-badge">incomplete</span>'}</span>
        <button class="btn-xs btn-danger" onclick="StudyTracker.deleteSession(${s.id})">✕</button>
      </div>`;
    });
    el.innerHTML = html;
  },

  // ── Manage panel ──────────────────────────────────────────

  _renderManagePanel() {
    const toggle = document.getElementById('studyManageToggle');
    if (toggle && !toggle.dataset.init) {
      toggle.dataset.init = '1';
      toggle.addEventListener('click', () => {
        const p = document.getElementById('studyManagePanel');
        if (!p) return;
        const open = p.style.display !== 'none';
        p.style.display = open ? 'none' : 'block';
        toggle.textContent = open ? '⚙️ Manage Subjects & Activities' : '✕ Close Manage';
        if (!open) this._renderManageContent();
      });
    }
  },

  _renderManageContent() {
    const tabs    = document.getElementById('studyManageTabs');
    const content = document.getElementById('studyManageContent');
    if (!tabs || !content) return;
    if (!tabs.dataset.init) {
      tabs.dataset.init = '1';
      tabs.querySelectorAll('.study-mtab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          tabs.querySelectorAll('.study-mtab-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this._manageTab = btn.dataset.mtab;
          this._renderManageContent();
        });
      });
    }
    this._manageTab === 'subjects' ? this._renderManageSubjects(content) : this._renderManageActivities(content);
  },

  _renderManageSubjects(c) {
    const list = this.getSubjects();
    let html = '<div class="study-manage-list">';
    list.forEach((s, i) => {
      html += `<div class="study-manage-row">
        <span class="study-manage-preview">${esc(s.emoji)}</span>
        <input class="study-manage-input study-manage-lbl" data-idx="${i}" data-field="label" value="${esc(s.label)}" placeholder="Label">
        <input class="study-manage-input study-manage-emo" data-idx="${i}" data-field="emoji" value="${esc(s.emoji)}" placeholder="Emoji" maxlength="4">
        <input type="color" class="study-manage-color" data-idx="${i}" data-field="color" value="${esc(s.color)}">
        <button class="btn-xs btn-danger" onclick="StudyTracker._deleteSubject(${i})">✕</button>
      </div>`;
    });
    html += '</div>';
    html += `<div class="study-manage-add-row">
      <input id="mgNewSubjLabel" class="study-manage-input" placeholder="Subject name" style="flex:1">
      <input id="mgNewSubjEmoji" class="study-manage-input study-manage-emo" placeholder="🏆" maxlength="4">
      <input type="color" id="mgNewSubjColor" value="#5b7fff">
      <button class="btn btn-primary btn-sm" onclick="StudyTracker._addSubject()">+ Add</button>
    </div>`;
    c.innerHTML = html;
    c.querySelectorAll('[data-idx][data-field]').forEach(input => {
      input.addEventListener('change', () => {
        const subjects = [...this.getSubjects()];
        const idx = parseInt(input.dataset.idx);
        subjects[idx] = { ...subjects[idx], [input.dataset.field]: input.value };
        AppState.studySubjects = subjects;
        AppState.save();
        this._populateSelects();
        this._renderManageContent();
      });
    });
  },

  _renderManageActivities(c) {
    const list = this.getActivities();
    let html = '<div class="study-manage-list">';
    list.forEach((a, i) => {
      html += `<div class="study-manage-row">
        <span class="study-manage-preview">${esc(a.tree||'🌱')}</span>
        <input class="study-manage-input study-manage-lbl" data-idx="${i}" data-field="label" value="${esc(a.label)}" placeholder="Activity name">
        <input class="study-manage-input study-manage-emo" data-idx="${i}" data-field="tree" value="${esc(a.tree||'🌱')}" placeholder="🌱" maxlength="4" title="Tree emoji">
        <button class="btn-xs btn-danger" onclick="StudyTracker._deleteActivity(${i})">✕</button>
      </div>`;
    });
    html += '</div>';
    html += `<div class="study-manage-add-row">
      <input id="mgNewActLabel" class="study-manage-input" placeholder="Activity name" style="flex:1">
      <input id="mgNewActTree"  class="study-manage-input study-manage-emo" placeholder="🌳" maxlength="4" title="Tree emoji">
      <button class="btn btn-primary btn-sm" onclick="StudyTracker._addActivity()">+ Add</button>
    </div>`;
    c.innerHTML = html;
    c.querySelectorAll('[data-idx][data-field]').forEach(input => {
      input.addEventListener('change', () => {
        const activities = [...this.getActivities()];
        const idx = parseInt(input.dataset.idx);
        activities[idx] = { ...activities[idx], [input.dataset.field]: input.value };
        AppState.studyActivities = activities;
        AppState.save();
        this._populateSelects();
        this._renderManageContent();
      });
    });
  },

  _addSubject() {
    const label = document.getElementById('mgNewSubjLabel')?.value?.trim();
    const emoji = document.getElementById('mgNewSubjEmoji')?.value?.trim() || '📚';
    const color = document.getElementById('mgNewSubjColor')?.value || '#5b7fff';
    if (!label) return;
    const s = [...this.getSubjects()];
    s.push({ id: 'custom_' + Date.now(), label, emoji, color });
    AppState.studySubjects = s; AppState.save();
    this._populateSelects(); this._renderManageContent();
  },

  _addActivity() {
    const label = document.getElementById('mgNewActLabel')?.value?.trim();
    const tree  = document.getElementById('mgNewActTree')?.value?.trim() || '🌱';
    if (!label) return;
    const a = [...this.getActivities()];
    a.push({ id: 'custom_' + Date.now(), label, tree });
    AppState.studyActivities = a; AppState.save();
    this._populateSelects(); this._renderManageContent();
  },

  _deleteSubject(idx) {
    const s = [...this.getSubjects()]; s.splice(idx, 1);
    AppState.studySubjects = s; AppState.save();
    this._populateSelects(); this._renderManageContent();
  },

  _deleteActivity(idx) {
    const a = [...this.getActivities()]; a.splice(idx, 1);
    AppState.studyActivities = a; AppState.save();
    this._populateSelects(); this._renderManageContent();
  },

  deleteSession(id) {
    AppState.studyLog = (AppState.studyLog||[]).filter(s => s.id !== id);
    AppState.save();
    this._updateTodayStats();
    this._renderForestPanel();
  },
};
