// ============================================================
// Skadi — Tech Study Tracker (DevOps Career Elevation)
// Mirrors the UPSC Study Tracker but operates on AppState.techStudyLog.
// 25-min tree rule · withered trees · Pomodoro · editable lists
// Default daily goal: 30 minutes (per textbook constraint).
// No FocusGuard integration — that's reserved for UPSC focus blocks.
// ============================================================

const TechStudyTracker = {

  // ── Defaults ──────────────────────────────────────────────

  DEFAULT_SUBJECTS: [
    { id: 'linux',       label: 'Linux & Networking',          emoji: '🐧', color: '#4d79ff' },
    { id: 'docker',      label: 'Docker',                       emoji: '🐳', color: '#0db7ed' },
    { id: 'kubernetes',  label: 'Kubernetes',                   emoji: '☸️',  color: '#326ce5' },
    { id: 'terraform',   label: 'Terraform',                    emoji: '🏗️',  color: '#7b42bc' },
    { id: 'python',      label: 'Python for DevOps',            emoji: '🐍', color: '#ffd43b' },
    { id: 'cicd',        label: 'CI/CD (Jenkins/Groovy/Helm)',  emoji: '🔄', color: '#d33833' },
    { id: 'devsecops',   label: 'DevSecOps',                    emoji: '🛡️',  color: '#00d47c' },
    { id: 'argocd',      label: 'ArgoCD / GitOps',              emoji: '🚀', color: '#ef7b4d' },
    { id: 'multicloud',  label: 'Multi-Cloud (AWS/Azure/GCP)',  emoji: '☁️',  color: '#ff9933' },
    { id: 'aiops',       label: 'AIOps & LLMs',                 emoji: '🤖', color: '#a56eff' },
    { id: 'openshift',   label: 'OpenShift',                    emoji: '🎩', color: '#ee0000' },
    { id: 'sysdesign',   label: 'System Design (PACED)',        emoji: '📐', color: '#56d4e0' },
    { id: 'coding',      label: 'Coding / LeetCode',            emoji: '💻', color: '#5b7fff' },
    { id: 'interview',   label: 'Interview Prep (STAR)',        emoji: '🎤', color: '#e85c5c' },
  ],

  DEFAULT_ACTIVITIES: [
    { id: 'lab',           label: 'KodeKloud Lab',  tree: '⚙️' },
    { id: 'reading',       label: 'Reading/Video',  tree: '📖' },
    { id: 'project',       label: 'Project Work',   tree: '🏗️' },
    { id: 'leetcode',      label: 'LeetCode',       tree: '💻' },
    { id: 'mock_exam',     label: 'Mock Exam',      tree: '📝' },
    { id: 'star_practice', label: 'STAR Practice',  tree: '🎤' },
    { id: 'documentation', label: 'Documentation',  tree: '📋' },
  ],

  MODE_DESCS: {
    stopwatch: 'Counts up — a tree grows every 25 minutes. Stop anytime.',
    countdown: 'Set your target — a tree grows every 25 minutes. Partial rounds wither 🥀.',
    pomodoro:  '25 min focus + 5 min break. A tree grows each focus round; breaks don\'t count.',
  },

  // ── Runtime state ─────────────────────────────────────────

  _timerInterval: null,
  _clockInterval: null,
  _elapsed:           0,  // seconds elapsed in current phase
  _treePhaseElapsed:  0,  // seconds elapsed in current 25-min tree cycle (stopwatch/countdown only)
  _countdown:         0,  // total seconds for countdown/pomodoro work phase
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

  getSubjects()   { return AppState.techStudySubjects   || this.DEFAULT_SUBJECTS; },
  getActivities() { return AppState.techStudyActivities || this.DEFAULT_ACTIVITIES; },
  getSubject(id)  { return this.getSubjects().find(s => s.id === id)   || this.DEFAULT_SUBJECTS[0]; },
  getActivity(id) { return this.getActivities().find(a => a.id === id) || this.DEFAULT_ACTIVITIES[0]; },

  // Ensure saved subject list includes all current defaults (migration for existing users)
  _ensureDefaultSubjects() {
    if (!AppState.techStudySubjects) return;
    const ids     = new Set(AppState.techStudySubjects.map(s => s.id));
    const missing = this.DEFAULT_SUBJECTS.filter(s => !ids.has(s.id));
    if (missing.length) {
      AppState.techStudySubjects = [...AppState.techStudySubjects, ...missing];
      AppState.save();
    }
  },

  // ── Tree logic: 25 min = full tree ────────────────────────

  // Returns the emoji for a completed/saved session
  treeEmoji(durationMin, activityId, completed = true) {
    if (!completed) return '🥀';              // withered — stopped early
    const act = this.getActivity(activityId);
    const full = act?.tree || '🌳';
    if (durationMin < 10) return '🌱';
    if (durationMin < 20) return '🌿';
    if (durationMin < 25) return '🪴';
    return full;                               // ≥ 25 min = full activity species
  },

  // CSS scale for canvas trees — 25 min = scale 1.0
  treeScale(durationMin) {
    if (durationMin < 10) return 0.55;
    if (durationMin < 20) return 0.72;
    if (durationMin < 25) return 0.88;
    return Math.min(1.5, 1.0 + (durationMin - 25) / 100);
  },

  // Seconds (0–1500) into the current 25-min tree cycle
  _treeProgress() {
    if (this._mode === 'pomodoro') {
      return this._pomoPhase === 'work' ? Math.min(this._elapsed, 1500) : 0;
    }
    return this._treePhaseElapsed;
  },

  // Live tree while a session is running — progress resets every 25 min
  liveTreeEmoji(activityId) {
    const min = Math.floor(this._treeProgress() / 60);
    if (min < 5)  return '🌱';
    if (min < 15) return '🌿';
    if (min < 22) return '🪴';
    const act = this.getActivity(activityId);
    return act?.tree || '🌳';
  },

  liveTreeScale() {
    const min = Math.floor(this._treeProgress() / 60);
    return 0.5 + Math.min(min / 25, 1.0) * 0.9; // full scale at 25 min
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
  getSessionsForDate(k) { return (AppState.techStudyLog||[]).filter(s => s.date === k); },

  getSessionsForRange(range) {
    const all = AppState.techStudyLog || [];
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
    this._ensureDefaultSubjects();
    this._renderClock();
    this._startClock();
    this._renderTimerPanel();
    this._renderForestPanel();
  },

  // ── Clock ─────────────────────────────────────────────────

  _renderClock() {
    const now = new Date();
    const t = document.getElementById('techStudyClockTime');
    const d = document.getElementById('techStudyClockDate');
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

    const modeRow = document.getElementById('techStudyModeToggle');
    if (modeRow && !modeRow.dataset.init) {
      modeRow.dataset.init = '1';

      modeRow.querySelectorAll('.study-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (this._running) return;
          modeRow.querySelectorAll('.study-mode-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this._mode = btn.dataset.mode;

          // Show/hide countdown inputs
          const cdEl = document.getElementById('techStudyCountdownSet');
          if (cdEl) cdEl.style.display = this._mode === 'countdown' ? 'flex' : 'none';

          // Show/hide pomodoro config + status
          const pcEl = document.getElementById('techStudyPomoConfig');
          if (pcEl) pcEl.style.display = this._mode === 'pomodoro' ? 'flex' : 'none';
          const psEl = document.getElementById('techStudyPomoStatus');
          if (psEl) psEl.style.display = this._mode === 'pomodoro' ? 'flex' : 'none';

          // Update description
          const desc = document.getElementById('techStudyTimerDesc');
          if (desc) desc.textContent = this.MODE_DESCS[this._mode] || '';

          // Reset display
          this._elapsed = 0; this._countdown = 0;
          this._pomoPhase = 'idle'; this._pomoRound = 0;
          this._updateTimerDisplay();
          this._updateLiveTree();
          this._updatePomoStatus();
        });
      });

      document.getElementById('techStudyStartBtn')?.addEventListener('click', () => this._startTimer());
      document.getElementById('techStudyStopBtn')?.addEventListener('click',  () => this._stopTimer());

      document.getElementById('techStudyGoalInput')?.addEventListener('change', e => {
        const v = parseInt(e.target.value);
        if (v > 0) { AppState.techStudyDailyGoal = v; AppState.save(); this._updateTodayStats(); }
      });

      // Pomodoro duration inputs — persist to AppState and sync runtime vars
      const bindPomo = (id, key, runtimeKey, fallback) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.value = AppState[key] ?? fallback;
        el.addEventListener('change', () => {
          const v = parseInt(el.value);
          if (v > 0) {
            AppState[key] = v;
            this[runtimeKey] = v;
            AppState.save();
          }
        });
      };
      bindPomo('techPomoWorkMin',  'techStudyPomoWork',  '_pomoWorkMin',  25);
      bindPomo('techPomoBreakMin', 'techStudyPomoBreak', '_pomoBreakMin', 5);
      bindPomo('techPomoLongMin',  'techStudyPomoLong',  '_pomoLongMin',  15);
    }

    // Sync pomodoro runtime vars from persisted AppState on every render
    this._pomoWorkMin  = AppState.techStudyPomoWork  ?? 25;
    this._pomoBreakMin = AppState.techStudyPomoBreak ?? 5;
    this._pomoLongMin  = AppState.techStudyPomoLong  ?? 15;

    this._updateTimerDisplay();
    this._updateLiveTree();
    this._updateTodayStats();
    this._updatePomoStatus();

    // Set initial description
    const desc = document.getElementById('techStudyTimerDesc');
    if (desc && !desc.dataset.set) { desc.dataset.set='1'; desc.textContent = this.MODE_DESCS[this._mode]; }
  },

  _populateSelects() {
    const subSel = document.getElementById('techStudySubjectSel');
    const actSel = document.getElementById('techStudyActivitySel');
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
    const disp  = document.getElementById('techStudyTimerDisplay');
    const start = document.getElementById('techStudyStartBtn');
    const stop  = document.getElementById('techStudyStopBtn');

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

    if (start) start.style.display = this._running ? 'none' : '';
    if (stop)  stop.style.display  = this._running ? '' : 'none';
  },

  _updateLiveTree() {
    const treeEl  = document.getElementById('techStudyLiveTree');
    const labelEl = document.getElementById('techStudyLiveTreeLabel');
    const actSel  = document.getElementById('techStudyActivitySel');
    const actId   = this._running ? (this._activeActivity||'class') : (actSel?.value||'class');
    const isBreak = this._mode === 'pomodoro' &&
      (this._pomoPhase === 'break' || this._pomoPhase === 'longbreak');

    if (treeEl) {
      if (isBreak) {
        treeEl.textContent = '☕';
        treeEl.style.fontSize = '48px';
        treeEl.className = 'study-live-tree study-live-tree-active';
      } else {
        const emoji   = this._running ? this.liveTreeEmoji(actId) : (this.getActivity(actId)?.tree || '🌱');
        const scalePx = this._running ? Math.round(48 * this.liveTreeScale()) : 48;
        treeEl.textContent = emoji;
        treeEl.style.fontSize = `${scalePx}px`;
        treeEl.className = 'study-live-tree' + (this._running ? ' study-live-tree-active' : '');
      }
    }
    if (labelEl) {
      if (isBreak) {
        labelEl.textContent = this._pomoPhase === 'longbreak' ? 'Long Break' : 'Break';
      } else {
        labelEl.textContent = this.getActivity(actId)?.label || '';
      }
      labelEl.style.display = this._running ? '' : 'none';
    }
  },

  _updateTodayStats() {
    const min  = this.getTodayTotalMin();
    const goal = AppState.techStudyDailyGoal || 30;
    const pct  = goal > 0 ? Math.min(100, Math.round((min / goal) * 100)) : 0;
    const s    = id => document.getElementById(id);
    if (s('techStudyTodayTotal')) s('techStudyTodayTotal').textContent = this.fmtDur(min);
    if (s('techStudyGoalBar'))    s('techStudyGoalBar').style.width = pct + '%';
    if (s('techStudyGoalPct'))    s('techStudyGoalPct').textContent  = `${pct}% of ${this.fmtDur(goal)} goal`;
    if (s('techStudyTodayBadge')) s('techStudyTodayBadge').textContent = this.fmtDur(min) + ' today';
    if (s('techStudyGoalInput') && !s('techStudyGoalInput').dataset.set) {
      s('techStudyGoalInput').value = goal;
      s('techStudyGoalInput').dataset.set = '1';
    }
  },

  _updatePomoStatus() {
    const el = document.getElementById('techStudyPomoStatus');
    if (!el) return;
    if (this._mode !== 'pomodoro') { el.style.display = 'none'; return; }
    el.style.display = 'flex';

    const phaseEl = document.getElementById('techStudyPomoPhase');
    const roundEl = document.getElementById('techStudyPomoRound');
    const icons   = { idle: '🍅', work: '🎯 Focus', break: '☕ Break', longbreak: '🌙 Long Break' };
    if (phaseEl) phaseEl.textContent = icons[this._pomoPhase] || '🍅';
    if (roundEl) roundEl.textContent = this._pomoPhase === 'idle'
      ? 'Ready to start'
      : `Round ${this._pomoRound + 1}`;
  },

  // ── Timer lifecycle ───────────────────────────────────────

  _startTimer() {
    const subSel = document.getElementById('techStudySubjectSel');
    const actSel = document.getElementById('techStudyActivitySel');
    this._activeSubject   = subSel?.value || 'history';
    this._activeActivity  = actSel?.value || 'class';
    this._startedAt       = new Date().toISOString();
    this._elapsed         = 0;
    this._treePhaseElapsed = 0;
    this._running         = true;

    if (this._mode === 'countdown') {
      const h = parseInt(document.getElementById('techStudyCountHours')?.value) || 0;
      const m = parseInt(document.getElementById('techStudyCountMins')?.value)  || 25;
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
    this._startForestAnim();
    // No FocusGuard for tech track — reserved for UPSC focus blocks.
  },

  _onTick() {
    this._updateTimerDisplay();
    if (this._elapsed % 60 === 0) this._updateLiveTree();

    if (this._mode !== 'pomodoro') {
      // Stopwatch / countdown: advance the 25-min tree cycle counter
      this._treePhaseElapsed++;

      if (this._treePhaseElapsed >= 1500) {
        // 25 min complete — plant a full tree and restart the cycle
        this._saveSession(25, true);
        this._treePhaseElapsed = 0;
        this._updateTodayStats();
        this._renderForestPanel();
        this._updateLiveTree();
        if (typeof UI !== 'undefined') UI.showToast('🌳 Tree planted! 25 minutes complete.');
      }

      if (this._mode === 'countdown' && this._countdown > 0 && this._elapsed >= this._countdown) {
        this._stopTimer();
      }

    } else {
      // Pomodoro
      const phaseSec = this._pomoPhase === 'break'
        ? this._pomoBreakMin * 60
        : this._pomoPhase === 'longbreak'
          ? this._pomoLongMin * 60
          : this._pomoWorkMin * 60;

      if (this._elapsed >= phaseSec) {
        if (this._pomoPhase === 'work') {
          // Work phase complete — plant a tree, then auto-start break
          this._saveSession(this._pomoWorkMin, true);
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
          this._running   = true;
          this._startedAt = new Date().toISOString();
          this._timerInterval = setInterval(() => { this._elapsed++; this._onTick(); }, 1000);

        } else {
          // Break complete
          const wasLongBreak = this._pomoPhase === 'longbreak';
          clearInterval(this._timerInterval);
          this._elapsed = 0;

          if (wasLongBreak) {
            this._running   = false;
            this._pomoPhase = 'idle';
            this._pomoRound = 0;
            const subSel = document.getElementById('techStudySubjectSel');
            const actSel = document.getElementById('techStudyActivitySel');
            if (subSel) subSel.disabled = false;
            if (actSel) actSel.disabled = false;
            this._updatePomoStatus();
            this._updateTimerDisplay();
            this._updateLiveTree();
            if (typeof UI !== 'undefined') UI.showToast('🏆 Pomodoro cycle complete — well done!');
          } else {
            this._pomoPhase = 'work';
            this._countdown = this._pomoWorkMin * 60;
            this._running   = true;
            this._startedAt = new Date().toISOString();
            this._timerInterval = setInterval(() => { this._elapsed++; this._onTick(); }, 1000);
            this._updatePomoStatus();
            this._updateTimerDisplay();
            this._updateLiveTree();
            if (typeof UI !== 'undefined') UI.showToast(`🍅 Break over — Round ${this._pomoRound + 1} starting!`);
          }
        }
      }
    }
  },

  _stopTimer() {
    clearInterval(this._timerInterval);
    this._running = false; this._timerInterval = null;

    // Save any partial tree cycle as a withered entry (full trees auto-save at 25-min marks)
    if (this._mode === 'pomodoro') {
      if (this._pomoPhase === 'work' && Math.round(this._elapsed / 60) >= 1) {
        this._saveSession(Math.round(this._elapsed / 60), false);
      }
    } else {
      if (Math.round(this._treePhaseElapsed / 60) >= 1) {
        this._saveSession(Math.round(this._treePhaseElapsed / 60), false);
      }
    }

    this._elapsed          = 0;
    this._treePhaseElapsed = 0;
    this._countdown        = 0;
    this._startedAt        = null;
    this._pomoPhase        = 'idle';
    this._pomoRound        = 0;

    const subSel = document.getElementById('techStudySubjectSel');
    const actSel = document.getElementById('techStudyActivitySel');
    if (subSel) subSel.disabled = false;
    if (actSel) actSel.disabled = false;

    this._updateTimerDisplay();
    this._updateLiveTree();
    this._updateTodayStats();
    this._updatePomoStatus();
    this._stopForestAnim();
    this._renderForestPanel();
    // No FocusGuard for tech track — see _startTimer comment.
  },

  _saveSession(durationMin, completed) {
    if (durationMin < 1) return;
    if (!AppState.techStudyLog) AppState.techStudyLog = [];
    AppState.techStudyLog.push({
      id:           Date.now(),
      date:         AppState.getTodayKey(),
      subject:      this._activeSubject  || 'history',
      activity:     this._activeActivity || 'class',
      duration_min: durationMin,
      completed:    completed,  // false = withered tree 🥀
      started_at:   this._startedAt,
    });
    AppState.save();
  },

  // ── Forest panel ──────────────────────────────────────────

  _renderForestPanel() {
    const rangeRow = document.getElementById('techStudyRangeRow');
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
    if (window.TechStudyAnalytics) TechStudyAnalytics.render(sessions, this._range);
  },

  // ── Isometric Forest Canvas ───────────────────────────────────────────────

  _FC_DARK: {
    skyA:'#04070f', skyB:'#07150a',
    tileA:'#1e3e23', tileB:'#182f1c', tileEdge:'#111e13',
    sideL:'#0d1a0f', sideR:'#142610',
    trunkA:'#1b0f07',
    rndA:'#163115', rndB:'#1e421a', rndC:'#276021',
    pineA:'#102210', pineB:'#172e15', pineC:'#1e3c1b',
    seedA:'#1c451e', witherA:'#22211c', witherT:'#171710',
    liveA:'#1f6022', liveB:'#2a9030', liveC:'#34b03c', liveGlow:'rgba(44,200,90,0.26)',
    trunkB:'#271508',
  },
  _FC_LIGHT: {
    skyA:'#9ec0ec', skyB:'#c0e8bc',
    tileA:'#5e9e3c', tileB:'#529035', tileEdge:'#3c7025',
    sideL:'#3a6228', sideR:'#4a7e2f',
    trunkA:'#6a3c18',
    rndA:'#2a6e22', rndB:'#369030', rndC:'#44ac3c',
    pineA:'#245018', pineB:'#2e6422', pineC:'#3a7830',
    seedA:'#3a8428', witherA:'#9a9080', witherT:'#7a6850',
    liveA:'#3a8a1e', liveB:'#4aaa28', liveC:'#58cc34', liveGlow:'rgba(0,160,50,0.18)',
    trunkB:'#8a5020',
  },

  _forestAnim: null,
  _forestCanvas: null,
  _forestSessions: [],

  _initForestCanvas() {
    const cv = document.getElementById('techStudyForestCanvas');
    if (!cv || this._forestCanvas === cv) return;
    this._forestCanvas = cv;
    const redraw = () => { if (!this._forestAnim) this._renderForestCanvas(this._forestSessions); };
    new ResizeObserver(redraw).observe(cv);
    new MutationObserver(redraw).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  },

  _startForestAnim() {
    if (this._forestAnim) return;
    const step = () => {
      this._renderForestCanvas(this._forestSessions);
      this._forestAnim = requestAnimationFrame(step);
    };
    this._forestAnim = requestAnimationFrame(step);
  },

  _stopForestAnim() {
    if (this._forestAnim) { cancelAnimationFrame(this._forestAnim); this._forestAnim = null; }
    this._renderForestCanvas(this._forestSessions);
  },

  _renderCanvasTrees(sessions) {
    this._forestSessions = sessions || [];
    this._initForestCanvas();
    if (!this._forestAnim) this._renderForestCanvas(this._forestSessions);
  },

  _renderForestCanvas(sessions = []) {
    const cv = this._forestCanvas || document.getElementById('techStudyForestCanvas');
    if (!cv) return;
    const W = cv.clientWidth, H = cv.clientHeight;
    if (!W || !H) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (cv.width !== W * dpr || cv.height !== H * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const isDark = document.documentElement.dataset.theme !== 'light';
    const p = isDark ? this._FC_DARK : this._FC_LIGHT;

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, p.skyA); sky.addColorStop(1, p.skyB);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

    // Stars (dark mode)
    if (isDark) {
      ctx.save();
      for (let i = 0; i < 55; i++) {
        const sx = (i * 137.5) % W, sy = (i * 53.7) % (H * 0.5);
        const r = 0.5 + (i % 3) * 0.35;
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, 6.28);
        ctx.fillStyle = `rgba(255,255,255,${0.1 + (i % 5) * 0.09})`; ctx.fill();
      }
      ctx.restore();
    }

    // Platform sizing — grows with tree count
    const done = sessions.filter(s => s.completed !== false).length;
    const n = Math.max(3, Math.min(7, 3 + Math.floor(done / 4)));
    const tw = Math.min(72, (W * 0.76) / n);
    const th = tw * 0.5;
    const depth = th * 0.72;
    const platformBottom = H - 16;
    const oy = platformBottom - depth - (n - 1) * th;
    const ox = W / 2;

    // Horizon mist
    const fog = ctx.createLinearGradient(0, oy - 20, 0, oy + th * 0.5);
    fog.addColorStop(0, 'transparent');
    fog.addColorStop(1, isDark ? 'rgba(5,12,6,0.6)' : 'rgba(180,215,175,0.52)');
    ctx.fillStyle = fog; ctx.fillRect(0, oy - 20, W, th * 0.5 + 20);

    // Platform side faces
    const blX = ox - (n-1)*tw/2, blY = oy + (n-1)*th/2;
    const brX = ox + (n-1)*tw/2, brY = blY;
    const botX = ox, botY = oy + (n-1)*th;
    [[blX,blY,botX,botY,p.sideL],[brX,brY,botX,botY,p.sideR]].forEach(([ax,ay,bx,by,col]) => {
      ctx.beginPath();
      ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.lineTo(bx,by+depth); ctx.lineTo(ax,ay+depth);
      ctx.closePath(); ctx.fillStyle=col; ctx.fill();
      ctx.strokeStyle=p.tileEdge; ctx.lineWidth=0.5; ctx.stroke();
    });

    // Tile tops — back-to-front diagonal bands
    for (let d = 0; d < 2*n-1; d++) {
      for (let col = 0; col < n; col++) {
        const row = d - col;
        if (row < 0 || row >= n) continue;
        const x = ox + (col-row)*tw/2, y = oy + (col+row)*th/2;
        ctx.beginPath();
        ctx.moveTo(x,y); ctx.lineTo(x+tw/2,y+th/2); ctx.lineTo(x,y+th); ctx.lineTo(x-tw/2,y+th/2);
        ctx.closePath();
        ctx.fillStyle = (col+row)%2===0 ? p.tileA : p.tileB;
        ctx.fill();
        ctx.strokeStyle=p.tileEdge; ctx.lineWidth=0.5; ctx.stroke();
      }
    }

    // Trees
    const placed = this._fcPlaceTrees(sessions, n);
    for (const {col,row,session,idx} of placed) {
      const tx = ox + (col-row)*tw/2;
      const ty = oy + (col+row)*th/2 + th*0.62;
      this._fcDrawTree(ctx, tx, ty, tw, session, idx, p);
    }

    // Live tree (animated when session running)
    if (this._running && this._pomoPhase !== 'break' && this._pomoPhase !== 'longbreak') {
      const prog = Math.min(1, this._treeProgress() / (25*60));
      const lc = Math.floor(n/2), lr = Math.floor(n/2);
      const ltx = ox + (lc-lr)*tw/2, lty = oy + (lc+lr)*th/2 + th*0.62;
      this._fcDrawLive(ctx, ltx, lty, tw, prog, p);
    }

    // Empty hint
    if (!sessions.length && !this._running) {
      ctx.save();
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.font=`13px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(20,40,20,0.3)';
      ctx.fillText('Start a session to grow your forest', W/2, Math.max(24, oy * 0.52));
      ctx.restore();
    }
  },

  _fcPlaceTrees(sessions, n) {
    const c = (n-1)/2;
    const pos = [];
    for (let col=0; col<n; col++)
      for (let row=0; row<n; row++)
        pos.push({ col, row, d: Math.abs(col-c)+Math.abs(row-c) });
    pos.sort((a,b) => a.d-b.d || a.col-b.col);
    const used = new Set(), result = [];
    sessions.forEach((s,idx) => {
      const seed = (typeof s.id==='number' ? s.id : idx) % pos.length;
      for (let i=0; i<pos.length; i++) {
        const p = pos[(seed+i) % pos.length], k=`${p.col},${p.row}`;
        if (!used.has(k)) { used.add(k); result.push({...p,session:s,idx}); break; }
      }
    });
    result.sort((a,b) => (a.col+a.row)-(b.col+b.row));
    return result;
  },

  _fcShape(ctx, bx, by, sc, shape, p) {
    const u = 11 * sc;
    if (shape === 'seed') {
      ctx.fillStyle = p.trunkA;
      ctx.fillRect(bx-1.5*sc, by-u, 3*sc, u);
      ctx.beginPath(); ctx.arc(bx, by-u-u*0.65, u*0.65, 0, 6.28);
      ctx.fillStyle = p.seedA; ctx.fill();
      return;
    }
    if (shape === 'round') {
      const cR = u * 1.35;
      ctx.fillStyle = p.trunkA;
      ctx.beginPath();
      ctx.moveTo(bx-u*0.28,by); ctx.lineTo(bx+u*0.28,by);
      ctx.lineTo(bx+u*0.15,by-u*0.95); ctx.lineTo(bx-u*0.15,by-u*0.95);
      ctx.closePath(); ctx.fill();
      [[0,-0.60,1.0,p.rndA],[-0.15,-0.80,0.88,p.rndB],[-0.22,-1.02,0.62,p.rndC]].forEach(([ox,oy,r,c]) => {
        ctx.beginPath(); ctx.arc(bx+ox*cR, by-u*0.95+oy*cR, r*cR, 0, 6.28);
        ctx.fillStyle=c; ctx.fill();
      });
      return;
    }
    if (shape === 'pine') {
      ctx.fillStyle = p.trunkA;
      ctx.fillRect(bx-u*0.2, by-u*0.9, u*0.4, u*0.9);
      [[u*2.1,u*1.0,-u*0.7,p.pineA],[u*1.6,u*0.9,-u*1.35,p.pineB],[u*1.1,u*0.8,-u*1.95,p.pineC]]
        .forEach(([w,h,yo,c]) => {
          ctx.beginPath();
          ctx.moveTo(bx,by+yo-h); ctx.lineTo(bx+w/2,by+yo); ctx.lineTo(bx-w/2,by+yo);
          ctx.closePath(); ctx.fillStyle=c; ctx.fill();
        });
    }
  },

  _fcDrawTree(ctx, bx, by, tw, session, idx, p) {
    const done = session.completed !== false;
    const dur = session.duration_min || 0;
    const sc = tw / 72;
    if (!done) {
      this._fcShape(ctx, bx, by, sc*0.52, 'seed', { ...p, trunkA:p.witherT, seedA:p.witherA });
      return;
    }
    const shape = dur >= 25 && idx % 3 === 2 ? 'pine' : dur >= 15 ? 'round' : 'seed';
    const mul = dur < 10 ? 0.52 : dur < 20 ? 0.72 : dur < 25 ? 0.88 : Math.min(1.4, 1+(dur-25)/80);
    this._fcShape(ctx, bx, by, sc*mul, shape, p);
  },

  _fcDrawLive(ctx, bx, by, tw, prog, p) {
    const sc = tw / 72, u = 11 * sc;
    const pulse = 1 + Math.sin(Date.now() / 700) * 0.055;
    const growSc = sc * Math.min(1.0, 0.42 + prog * 0.65) * pulse;
    const gu = 11 * growSc;

    // Glow aura
    const glowR = gu * 3.2;
    const gr = ctx.createRadialGradient(bx, by-gu*1.6, 0, bx, by-gu*1.6, glowR);
    gr.addColorStop(0, p.liveGlow); gr.addColorStop(1, 'transparent');
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.arc(bx, by-gu*1.6, glowR, 0, 6.28); ctx.fill();

    const lp = { ...p, trunkA:p.trunkB, rndA:p.liveA, rndB:p.liveB, rndC:p.liveC,
                 seedA:p.liveC, pineA:p.liveA, pineB:p.liveB, pineC:p.liveC };
    if (prog < 0.28) {
      this._fcShape(ctx, bx, by, growSc, 'seed', lp);
    } else if (prog < 0.65) {
      this._fcShape(ctx, bx, by, growSc, 'round', lp);
    } else {
      this._fcShape(ctx, bx, by, growSc, 'round', lp);
    }
  },

  _renderStats(sessions) {
    const el = document.getElementById('techStudySummaryRow');
    if (!el) return;
    const completed = sessions.filter(s => s.completed !== false);
    const total     = completed.reduce((s,x) => s + x.duration_min, 0);
    const streak    = this.getStreak();
    const label = { today:'Today', '7d':'7 Days', '30d':'30 Days', '3m':'3 Months', all:'All Time' }[this._range] || '';
    el.innerHTML = `
      <div class="study-stat-chip"><span class="study-stat-val">${this.fmtDur(total)||'0m'}</span><span class="study-stat-lbl">${label}</span></div>
      <div class="study-stat-chip"><span class="study-stat-val">${completed.length}</span><span class="study-stat-lbl">trees planted</span></div>
      <div class="study-stat-chip"><span class="study-stat-val">${streak}</span><span class="study-stat-lbl">day streak</span></div>`;
  },

  _renderSubjBars(sessions) {
    const el = document.getElementById('techStudySubjBarsMain');
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
    const el = document.getElementById('techStudyActBarsMain');
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
    const el = document.getElementById('techStudySessionsList');
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
        <button class="btn-xs btn-danger" onclick="TechStudyTracker.deleteSession(${s.id})">✕</button>
      </div>`;
    });
    el.innerHTML = html;
  },

  // ── Manage panel ──────────────────────────────────────────

  _renderManagePanel() {
    const toggle = document.getElementById('techStudyManageToggle');
    if (toggle && !toggle.dataset.init) {
      toggle.dataset.init = '1';
      toggle.addEventListener('click', () => {
        const p = document.getElementById('techStudyManagePanel');
        if (!p) return;
        const open = p.style.display !== 'none';
        p.style.display = open ? 'none' : 'block';
        toggle.textContent = open ? '⚙️ Manage Subjects & Activities' : '✕ Close Manage';
        if (!open) this._renderManageContent();
      });
    }
  },

  _renderManageContent() {
    const tabs    = document.getElementById('techStudyManageTabs');
    const content = document.getElementById('techStudyManageContent');
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
        <button class="btn-xs btn-danger" onclick="TechStudyTracker._deleteSubject(${i})">✕</button>
      </div>`;
    });
    html += '</div>';
    html += `<div class="study-manage-add-row">
      <input id="techMgNewSubjLabel" class="study-manage-input" placeholder="Subject name" style="flex:1">
      <input id="techMgNewSubjEmoji" class="study-manage-input study-manage-emo" placeholder="🏆" maxlength="4">
      <input type="color" id="techMgNewSubjColor" value="#5b7fff">
      <button class="btn btn-primary btn-sm" onclick="TechStudyTracker._addSubject()">+ Add</button>
    </div>`;
    c.innerHTML = html;
    c.querySelectorAll('[data-idx][data-field]').forEach(input => {
      input.addEventListener('change', () => {
        const subjects = [...this.getSubjects()];
        const idx = parseInt(input.dataset.idx);
        subjects[idx] = { ...subjects[idx], [input.dataset.field]: input.value };
        AppState.techStudySubjects = subjects;
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
        <button class="btn-xs btn-danger" onclick="TechStudyTracker._deleteActivity(${i})">✕</button>
      </div>`;
    });
    html += '</div>';
    html += `<div class="study-manage-add-row">
      <input id="techMgNewActLabel" class="study-manage-input" placeholder="Activity name" style="flex:1">
      <input id="techMgNewActTree"  class="study-manage-input study-manage-emo" placeholder="🌳" maxlength="4" title="Tree emoji">
      <button class="btn btn-primary btn-sm" onclick="TechStudyTracker._addActivity()">+ Add</button>
    </div>`;
    c.innerHTML = html;
    c.querySelectorAll('[data-idx][data-field]').forEach(input => {
      input.addEventListener('change', () => {
        const activities = [...this.getActivities()];
        const idx = parseInt(input.dataset.idx);
        activities[idx] = { ...activities[idx], [input.dataset.field]: input.value };
        AppState.techStudyActivities = activities;
        AppState.save();
        this._populateSelects();
        this._renderManageContent();
      });
    });
  },

  _addSubject() {
    const label = document.getElementById('techMgNewSubjLabel')?.value?.trim();
    const emoji = document.getElementById('techMgNewSubjEmoji')?.value?.trim() || '📚';
    const color = document.getElementById('techMgNewSubjColor')?.value || '#5b7fff';
    if (!label) return;
    const s = [...this.getSubjects()];
    s.push({ id: 'custom_' + Date.now(), label, emoji, color });
    AppState.techStudySubjects = s; AppState.save();
    this._populateSelects(); this._renderManageContent();
  },

  _addActivity() {
    const label = document.getElementById('techMgNewActLabel')?.value?.trim();
    const tree  = document.getElementById('techMgNewActTree')?.value?.trim() || '🌱';
    if (!label) return;
    const a = [...this.getActivities()];
    a.push({ id: 'custom_' + Date.now(), label, tree });
    AppState.techStudyActivities = a; AppState.save();
    this._populateSelects(); this._renderManageContent();
  },

  _deleteSubject(idx) {
    const s = [...this.getSubjects()]; s.splice(idx, 1);
    AppState.techStudySubjects = s; AppState.save();
    this._populateSelects(); this._renderManageContent();
  },

  _deleteActivity(idx) {
    const a = [...this.getActivities()]; a.splice(idx, 1);
    AppState.techStudyActivities = a; AppState.save();
    this._populateSelects(); this._renderManageContent();
  },

  deleteSession(id) {
    AppState.techStudyLog = (AppState.techStudyLog||[]).filter(s => s.id !== id);
    AppState.save();
    this._updateTodayStats();
    this._renderForestPanel();
  },
};
