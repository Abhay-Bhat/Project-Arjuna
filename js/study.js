// ============================================================
// ATHENA — Study Tracker v3
// Stopwatch/countdown · activity-keyed trees · live growth
// Editable subjects & activities · Forest-app canvas
// ============================================================

const StudyTracker = {

  // ── Default data (used when AppState lists are null) ──────

  DEFAULT_SUBJECTS: [
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

  DEFAULT_ACTIVITIES: [
    { id: 'class',           label: 'Class',           tree: '🌳' },
    { id: 'reading',         label: 'Reading',         tree: '🌲' },
    { id: 'revision',        label: 'Revision',        tree: '🌿' },
    { id: 'notes',           label: 'Note-making',     tree: '🍀' },
    { id: 'mock_test',       label: 'Mock Test',       tree: '🌵' },
    { id: 'answer_writing',  label: 'Answer Writing',  tree: '🎋' },
    { id: 'newspaper',       label: 'Newspaper',       tree: '🌸' },
  ],

  // ── Runtime state ─────────────────────────────────────────

  _timerInterval: null,
  _clockInterval: null,
  _elapsed:       0,      // seconds counted so far
  _countdown:     0,      // total countdown seconds (0 = stopwatch mode)
  _running:       false,
  _activeSubject:  null,
  _activeActivity: null,
  _startedAt:      null,
  _range:         'today',
  _manageTab:     'subjects',
  _editingSubject: null,
  _editingActivity: null,

  // ── Accessors ─────────────────────────────────────────────

  getSubjects()   { return AppState.studySubjects   || this.DEFAULT_SUBJECTS; },
  getActivities() { return AppState.studyActivities || this.DEFAULT_ACTIVITIES; },

  getSubject(id) {
    return this.getSubjects().find(s => s.id === id) || this.DEFAULT_SUBJECTS[0];
  },

  getActivity(id) {
    return this.getActivities().find(a => a.id === id) || this.DEFAULT_ACTIVITIES[0];
  },

  getTreeForActivity(activityId, durationMin) {
    const act   = this.getActivity(activityId);
    const base  = act?.tree || '🌱';
    // Scale hint via CSS, tree species comes from activity
    return base;
  },

  // Scale factor applied to tree based on session duration
  treeScale(min) {
    if (min < 15)  return 0.75;
    if (min < 30)  return 0.9;
    if (min < 60)  return 1.05;
    if (min < 120) return 1.25;
    return 1.45;
  },

  // Live tree while running: grows from seedling → activity tree
  livTreeEmoji(activityId) {
    const elapsedMin = Math.floor(this._elapsed / 60);
    if (elapsedMin < 5)  return '🌱';
    if (elapsedMin < 15) return '🌿';
    const act = this.getActivity(activityId);
    return act?.tree || '🌱';
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

  getTodaySessions()  { return this.getSessionsForRange('today'); },
  getTodayTotalMin()  { return this.getTodaySessions().reduce((s, x) => s + x.duration_min, 0); },

  getSessionsForDate(key) {
    return (AppState.studyLog || []).filter(s => s.date === key);
  },

  getSessionsForRange(range) {
    const all      = AppState.studyLog || [];
    const todayKey = AppState.getTodayKey();
    if (range === 'today') return all.filter(s => s.date === todayKey);
    if (range === 'all')   return all;
    const cutoff = new Date();
    if (range === '7d')  cutoff.setDate(cutoff.getDate() - 6);
    if (range === '30d') cutoff.setDate(cutoff.getDate() - 29);
    if (range === '3m')  cutoff.setMonth(cutoff.getMonth() - 3);
    const cutoffKey = AppState.getDateKey(cutoff);
    return all.filter(s => s.date >= cutoffKey);
  },

  getStreak() {
    let streak = 0;
    const d = new Date();
    while (true) {
      if (!this.getSessionsForDate(AppState.getDateKey(d)).length) break;
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
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
    if (d) d.textContent = this.fmtDateLabel(now);
  },

  _startClock() {
    if (this._clockInterval) return;
    this._clockInterval = setInterval(() => this._renderClock(), 30000);
  },

  // ── Timer panel ───────────────────────────────────────────

  _renderTimerPanel() {
    // Rebuild selects with live subjects/activities
    this._populateSelects();

    const modeRow = document.getElementById('studyModeToggle');
    if (modeRow && !modeRow.dataset.init) {
      modeRow.dataset.init = '1';
      modeRow.querySelectorAll('.study-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (this._running) return;
          modeRow.querySelectorAll('.study-mode-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const isCountdown = btn.dataset.mode === 'countdown';
          const cdEl = document.getElementById('studyCountdownSet');
          if (cdEl) cdEl.style.display = isCountdown ? 'flex' : 'none';
          this._elapsed = 0;
          this._countdown = 0;
          this._updateTimerDisplay();
        });
      });
      document.getElementById('studyStartBtn')?.addEventListener('click',  () => this._startTimer());
      document.getElementById('studyPauseBtn')?.addEventListener('click',  () => this._pauseResumeTimer());
      document.getElementById('studyStopBtn')?.addEventListener('click',   () => this._stopTimer());
      document.getElementById('studyGoalInput')?.addEventListener('change', e => {
        const v = parseInt(e.target.value);
        if (v > 0) { AppState.studyDailyGoal = v * 60; AppState.save(); this._updateTodayStats(); }
      });
    }

    this._updateTimerDisplay();
    this._updateLiveTree();
    this._updateTodayStats();
  },

  _populateSelects() {
    const subSel = document.getElementById('studySubjectSel');
    const actSel = document.getElementById('studyActivitySel');

    if (subSel) {
      const cur = subSel.value;
      subSel.innerHTML = this.getSubjects().map(s =>
        `<option value="${esc(s.id)}">${esc(s.emoji)} ${esc(s.label)}</option>`
      ).join('');
      if (cur) subSel.value = cur;
    }

    if (actSel) {
      const cur = actSel.value;
      actSel.innerHTML = this.getActivities().map(a =>
        `<option value="${esc(a.id)}">${esc(a.tree || '🌱')} ${esc(a.label)}</option>`
      ).join('');
      if (cur) actSel.value = cur;
      // Live tree preview on change
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

    let display;
    if (this._countdown > 0) {
      // Countdown: show remaining
      const remaining = Math.max(0, this._countdown - this._elapsed);
      display = this.fmtTimer(remaining);
    } else {
      display = this.fmtTimer(this._elapsed);
    }
    if (disp) disp.textContent = display;

    const active = this._elapsed > 0;
    if (start) start.style.display = active ? 'none' : '';
    if (pause) { pause.style.display = active ? '' : 'none'; pause.textContent = this._running ? '⏸ Pause' : '▶ Resume'; }
    if (stop)  stop.style.display  = active ? '' : 'none';
  },

  _updateLiveTree() {
    const treeEl  = document.getElementById('studyLiveTree');
    const labelEl = document.getElementById('studyLiveTreeLabel');
    const actSel  = document.getElementById('studyActivitySel');
    const actId   = actSel?.value || (this._activeActivity || 'class');
    const emoji   = this._running ? this.livTreeEmoji(actId) : (this.getActivity(actId)?.tree || '🌱');
    const elMin   = Math.floor(this._elapsed / 60);

    if (treeEl) {
      treeEl.textContent = emoji;
      treeEl.className   = 'study-live-tree' + (this._running ? ' study-live-tree-active' : '');
      // Scale based on elapsed time
      const scale = this._running ? (0.8 + Math.min(elMin / 60, 1) * 0.7) : 1;
      treeEl.style.fontSize = `${Math.round(48 * scale)}px`;
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

    const el    = document.getElementById('studyTodayTotal');
    const bar   = document.getElementById('studyGoalBar');
    const pEl   = document.getElementById('studyGoalPct');
    const badge = document.getElementById('studyTodayBadge');
    const gi    = document.getElementById('studyGoalInput');

    if (el)    el.textContent   = this.fmtDur(min) || '0m';
    if (bar)   bar.style.width  = pct + '%';
    if (pEl)   pEl.textContent  = `${pct}% of ${this.fmtDur(goal)} goal`;
    if (badge) badge.textContent = min > 0 ? `${this.fmtDur(min)} today` : '0m today';
    if (gi && !gi.dataset.set)  { gi.value = Math.round(goal / 60); gi.dataset.set = '1'; }
  },

  _startTimer() {
    const subSel = document.getElementById('studySubjectSel');
    const actSel = document.getElementById('studyActivitySel');
    const isCountdown = document.querySelector('.study-mode-btn.active')?.dataset?.mode === 'countdown';

    this._activeSubject  = subSel?.value || 'history';
    this._activeActivity = actSel?.value || 'class';
    this._startedAt      = new Date().toISOString();
    this._elapsed        = 0;
    this._running        = true;

    if (isCountdown) {
      const h = parseInt(document.getElementById('studyCountHours')?.value) || 0;
      const m = parseInt(document.getElementById('studyCountMins')?.value)  || 25;
      this._countdown = (h * 60 + m) * 60;
    } else {
      this._countdown = 0;
    }

    if (subSel) subSel.disabled = true;
    if (actSel) actSel.disabled = true;

    this._timerInterval = setInterval(() => {
      this._elapsed++;
      this._tickTimer();
    }, 1000);

    this._updateTimerDisplay();
    this._updateLiveTree();
  },

  _tickTimer() {
    const disp = document.getElementById('studyTimerDisplay');
    if (this._countdown > 0) {
      const remaining = this._countdown - this._elapsed;
      if (disp) disp.textContent = this.fmtTimer(Math.max(0, remaining));
      if (remaining <= 0) {
        // Countdown finished — auto-save
        this._stopTimer(true);
        return;
      }
    } else {
      if (disp) disp.textContent = this.fmtTimer(this._elapsed);
    }
    // Update live tree every 60 ticks (1 min)
    if (this._elapsed % 60 === 0) this._updateLiveTree();
  },

  _pauseResumeTimer() {
    if (this._running) {
      clearInterval(this._timerInterval);
      this._running = false;
    } else {
      this._running = true;
      this._timerInterval = setInterval(() => { this._elapsed++; this._tickTimer(); }, 1000);
    }
    this._updateTimerDisplay();
    this._updateLiveTree();
  },

  _stopTimer(autoFinished = false) {
    clearInterval(this._timerInterval);
    this._running = false; this._timerInterval = null;

    // Duration: for countdown, use the countdown target; for stopwatch, use elapsed
    const durationMin = this._countdown > 0
      ? Math.round(this._countdown / 60)
      : Math.round(this._elapsed / 60);

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

    this._elapsed   = 0;
    this._countdown = 0;
    this._startedAt = null;

    const subSel = document.getElementById('studySubjectSel');
    const actSel = document.getElementById('studyActivitySel');
    if (subSel) subSel.disabled = false;
    if (actSel) actSel.disabled = false;

    this._updateTimerDisplay();
    this._updateLiveTree();
    this._updateTodayStats();
    this._renderForestPanel();

    if (autoFinished && typeof UI !== 'undefined') {
      UI.showToast('⏰ Session complete! Great work 🌳');
    }
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

    // Show live growing tree if session in progress
    let liveHtml = '';
    if (this._running && this._activeActivity) {
      const act   = this.getActivity(this._activeActivity);
      const emoji = this.livTreeEmoji(this._activeActivity);
      liveHtml = `<div class="study-canvas-tree study-canvas-tree-live" style="left:50%;bottom:20%;transform:translateX(-50%)"
        title="Current session (${this.fmtTimer(this._elapsed)})">${emoji}</div>`;
    }

    if (!sessions.length && !liveHtml) {
      c.innerHTML = '<div class="study-canvas-empty">Start a session to grow your forest 🌱</div>';
      return;
    }

    const trees = sessions.map((s, i) => {
      const subj  = this.getSubject(s.subject);
      const tree  = this.getTreeForActivity(s.activity, s.duration_min);
      const scale = this.treeScale(s.duration_min);
      const seed  = s.id % 1000;
      const left  = 5 + ((seed * 13 + i * 37) % 82);
      const btm   = 8 + ((seed * 7  + i * 11) % 20);
      return `<div class="study-canvas-tree" style="left:${left}%;bottom:${btm}%;font-size:${Math.round(28 * scale)}px"
        title="${subj.label} · ${s.activity} · ${this.fmtDur(s.duration_min)}">${tree}</div>`;
    });

    c.innerHTML = trees.join('') + liveHtml;
  },

  _renderStats(sessions) {
    const el = document.getElementById('studySummaryRow');
    if (!el) return;
    const total  = sessions.reduce((s, x) => s + x.duration_min, 0);
    const streak = this.getStreak();
    const label  = { today: 'Today', '7d': '7 Days', '30d': '30 Days', '3m': '3 Months', all: 'All Time' }[this._range] || '';
    el.innerHTML = `
      <div class="study-stat-chip"><span class="study-stat-val">${this.fmtDur(total) || '0m'}</span><span class="study-stat-lbl">${label}</span></div>
      <div class="study-stat-chip"><span class="study-stat-val">${sessions.length}</span><span class="study-stat-lbl">sessions</span></div>
      <div class="study-stat-chip"><span class="study-stat-val">${streak}</span><span class="study-stat-lbl">day streak 🔥</span></div>`;
  },

  _renderSubjBars(sessions) {
    const el = document.getElementById('studySubjBarsMain');
    if (!el) return;
    if (!sessions.length) { el.innerHTML = ''; return; }
    const total  = sessions.reduce((s, x) => s + x.duration_min, 0);
    const bySubj = {};
    sessions.forEach(s => { bySubj[s.subject] = (bySubj[s.subject] || 0) + s.duration_min; });

    let html = '<div class="study-bars-title">By Subject</div>';
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

  _renderActivityBars(sessions) {
    const el = document.getElementById('studyActBarsMain');
    if (!el) return;
    if (!sessions.length) { el.innerHTML = ''; return; }
    const total = sessions.reduce((s, x) => s + x.duration_min, 0);
    const byAct = {};
    sessions.forEach(s => { byAct[s.activity] = (byAct[s.activity] || 0) + s.duration_min; });

    let html = '<div class="study-bars-title">By Activity</div>';
    Object.entries(byAct).sort((a, b) => b[1] - a[1]).forEach(([id, min]) => {
      const act  = this.getActivity(id);
      const pct  = Math.round((min / total) * 100);
      html += `<div class="study-subj-bar-row">
        <span class="study-subj-name">${act?.tree || '🌱'} ${act?.label || id}</span>
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
      const subj = this.getSubject(s.subject);
      const act  = this.getActivity(s.activity);
      html += `<div class="study-session-row">
        <span class="study-session-tree">${act?.tree || '🌱'}</span>
        <span class="study-session-subj" style="color:${subj.color}">${subj.emoji} ${subj.label}</span>
        <span class="study-session-act">${act?.label || s.activity}</span>
        <span class="study-session-date">${s.date !== AppState.getTodayKey() ? s.date : ''}</span>
        <span class="study-session-dur">${this.fmtDur(s.duration_min)}</span>
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

    if (this._manageTab === 'subjects') this._renderManageSubjects(content);
    else this._renderManageActivities(content);
  },

  _renderManageSubjects(c) {
    const list = this.getSubjects();
    let html = '<div class="study-manage-list">';
    list.forEach((s, i) => {
      html += `<div class="study-manage-row" data-idx="${i}">
        <span class="study-manage-emoji">${esc(s.emoji)}</span>
        <input class="study-manage-label" data-field="label" value="${esc(s.label)}" placeholder="Label">
        <input class="study-manage-emoji-input" data-field="emoji" value="${esc(s.emoji)}" placeholder="Emoji" maxlength="4">
        <input type="color" class="study-manage-color" data-field="color" value="${esc(s.color)}">
        <button class="btn-xs btn-danger" onclick="StudyTracker._deleteSubject(${i})">✕</button>
      </div>`;
    });
    html += '</div>';
    html += `<div class="study-manage-add-row">
      <input id="mgNewSubjLabel" placeholder="New subject name" style="flex:1">
      <input id="mgNewSubjEmoji" placeholder="🏆" style="width:50px" maxlength="4">
      <input type="color" id="mgNewSubjColor" value="#5b7fff">
      <button class="btn btn-primary btn-sm" onclick="StudyTracker._addSubject()">+ Add</button>
    </div>`;
    c.innerHTML = html;

    // Bind inline edits (debounced save on change)
    c.querySelectorAll('.study-manage-row').forEach(row => {
      const idx = parseInt(row.dataset.idx);
      row.querySelectorAll('[data-field]').forEach(input => {
        input.addEventListener('change', () => {
          const subjects = [...this.getSubjects()];
          subjects[idx] = { ...subjects[idx], [input.dataset.field]: input.value };
          AppState.studySubjects = subjects;
          AppState.save();
          this._populateSelects();
        });
      });
    });
  },

  _renderManageActivities(c) {
    const list = this.getActivities();
    let html = '<div class="study-manage-list">';
    list.forEach((a, i) => {
      html += `<div class="study-manage-row" data-idx="${i}">
        <span class="study-manage-emoji">${esc(a.tree || '🌱')}</span>
        <input class="study-manage-label" data-field="label" value="${esc(a.label)}" placeholder="Label">
        <input class="study-manage-emoji-input" data-field="tree" value="${esc(a.tree || '🌱')}" placeholder="🌱" maxlength="4" title="Tree emoji for this activity">
        <button class="btn-xs btn-danger" onclick="StudyTracker._deleteActivity(${i})">✕</button>
      </div>`;
    });
    html += '</div>';
    html += `<div class="study-manage-add-row">
      <input id="mgNewActLabel" placeholder="New activity name" style="flex:1">
      <input id="mgNewActTree" placeholder="🌳" style="width:50px" maxlength="4" title="Tree emoji">
      <button class="btn btn-primary btn-sm" onclick="StudyTracker._addActivity()">+ Add</button>
    </div>`;
    c.innerHTML = html;

    c.querySelectorAll('.study-manage-row').forEach(row => {
      const idx = parseInt(row.dataset.idx);
      row.querySelectorAll('[data-field]').forEach(input => {
        input.addEventListener('change', () => {
          const activities = [...this.getActivities()];
          activities[idx] = { ...activities[idx], [input.dataset.field]: input.value };
          AppState.studyActivities = activities;
          AppState.save();
          this._populateSelects();
        });
      });
    });
  },

  _addSubject() {
    const label = document.getElementById('mgNewSubjLabel')?.value?.trim();
    const emoji = document.getElementById('mgNewSubjEmoji')?.value?.trim() || '📚';
    const color = document.getElementById('mgNewSubjColor')?.value || '#5b7fff';
    if (!label) return;
    const subjects = [...this.getSubjects()];
    const id = 'custom_' + Date.now();
    subjects.push({ id, label, emoji, color });
    AppState.studySubjects = subjects;
    AppState.save();
    this._populateSelects();
    this._renderManageContent();
  },

  _addActivity() {
    const label = document.getElementById('mgNewActLabel')?.value?.trim();
    const tree  = document.getElementById('mgNewActTree')?.value?.trim() || '🌱';
    if (!label) return;
    const activities = [...this.getActivities()];
    activities.push({ id: 'custom_' + Date.now(), label, tree });
    AppState.studyActivities = activities;
    AppState.save();
    this._populateSelects();
    this._renderManageContent();
  },

  _deleteSubject(idx) {
    const subjects = [...this.getSubjects()];
    subjects.splice(idx, 1);
    AppState.studySubjects = subjects;
    AppState.save();
    this._populateSelects();
    this._renderManageContent();
  },

  _deleteActivity(idx) {
    const activities = [...this.getActivities()];
    activities.splice(idx, 1);
    AppState.studyActivities = activities;
    AppState.save();
    this._populateSelects();
    this._renderManageContent();
  },

  // ── Delete session ────────────────────────────────────────

  deleteSession(id) {
    AppState.studyLog = (AppState.studyLog || []).filter(s => s.id !== id);
    AppState.save();
    this._updateTodayStats();
    this._renderForestPanel();
  },
};
