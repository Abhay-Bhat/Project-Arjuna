// ============================================================
// Skadi — Tasks (Eisenhower Matrix)
// 2x2 urgent/important grid with inline analytics.
// ============================================================

const TasksTracker = {

  PRIORITIES: [
    { value: 'urgent', label: 'Urgent', color: 'var(--accent-rose)',   icon: '🔴' },
    { value: 'high',   label: 'High',   color: 'var(--accent-amber)',  icon: '🟠' },
    { value: 'medium', label: 'Medium', color: 'var(--accent-blue)',   icon: '🔵' },
    { value: 'low',    label: 'Low',    color: 'var(--accent-green)',  icon: '🟢' },
  ],

  QUADRANTS: [
    { id: 1, key: 'q1', label: 'Do First',     icon: '🔥', color: 'var(--accent-rose)',  desc: 'Urgent + Important' },
    { id: 2, key: 'q2', label: 'Schedule',      icon: '📅', color: 'var(--accent-blue)',  desc: 'Important, Not Urgent' },
    { id: 3, key: 'q3', label: 'Quick Wins',    icon: '⚡', color: 'var(--accent-amber)', desc: 'Urgent, Less Important' },
    { id: 4, key: 'q4', label: 'Eliminate',      icon: '🌙', color: 'var(--accent-teal)',  desc: 'Neither Urgent nor Important' },
  ],

  BUCKET_COLORS: [
    '#5b7fff', '#00d4c8', '#ff9933', '#ff5c80',
    '#a56eff', '#00d47c', '#ffc107', '#ff6b6b',
  ],

  _openSubtaskIds: new Set(),

  _taskTimerKey: 'skadi_task_timer',
  _taskTimerInterval: null,
  _runningTaskId: null,
  _taskElapsed: 0,
  _taskStartedAt: null,

  render() {
    this._renderMatrix();
    this._renderStats();
    this._renderCompleted();
    this._renderAnalytics();
    this._renderQuickAdd();
    this._bindFilters();
    this._restoreTaskTimerState();
    this._bindNativeResumeSync();
  },

  _bindNativeResumeSync() {
    if (this._nativeResumeSyncBound) return;
    this._nativeResumeSyncBound = true;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this._reconcileWithNativeTimer();
    });
  },

  _buckets()  { return (AppState.taskBuckets || []).filter(b => !b.deleted); },
  _tasks()    { return (AppState.tasks       || []).filter(t => !t.deleted); },

  _priorityMeta(value) {
    return this.PRIORITIES.find(p => p.value === value) || this.PRIORITIES[2];
  },

  _quadrantFor(t) {
    if (t.matrixQ >= 1 && t.matrixQ <= 4) return t.matrixQ;
    const p = t.priority || 'medium';
    const isUrgent = p === 'urgent' || (t.dueDate && (new Date(t.dueDate) - new Date()) < 3 * 864e5);
    const isImportant = p === 'urgent' || p === 'high';
    if (isUrgent && isImportant) return 1;
    if (isImportant) return 2;
    if (isUrgent) return 3;
    return 4;
  },

  _dueMeta(dateStr) {
    if (!dateStr) return null;
    const due  = new Date(dateStr);
    const now  = new Date();
    const diffDays = Math.floor((due - now) / 86400000);
    if (diffDays < 0)  return { label: 'Overdue',  cls: 'due-overdue'  };
    if (diffDays === 0) return { label: 'Today',    cls: 'due-today'    };
    if (diffDays <= 3) return { label: `${diffDays}d`,  cls: 'due-soon' };
    if (diffDays <= 7) return { label: dateStr.slice(5), cls: 'due-week' };
    return { label: dateStr.slice(5), cls: 'due-normal' };
  },

  _isLate(t) {
    if (!t.done || !t.dueDate || !t.completedAt) return null;
    const due       = new Date(t.dueDate + 'T23:59:59');
    const completed = new Date(t.completedAt);
    if (completed <= due) return null;
    return { days: Math.max(1, Math.round((completed - due) / 86400000)) };
  },

  _subtaskProgress(t) {
    const subs = t.subtasks || [];
    return { done: subs.filter(s => s.done).length, total: subs.length };
  },

  _activeFilter() {
    return {
      priority: document.getElementById('taskFilterPriority')?.value || 'all',
      status:   document.getElementById('taskFilterStatus')?.value   || 'all',
      due:      document.getElementById('taskFilterDue')?.value      || 'all',
      sort:     document.getElementById('taskSort')?.value           || 'default',
    };
  },

  _filterTasks(tasks) {
    const { priority, status, due } = this._activeFilter();
    const now = new Date();
    return tasks.filter(t => {
      if (priority !== 'all' && t.priority !== priority) return false;
      if (status !== 'all') {
        const tStatus = t.status || 'todo';
        if (tStatus !== status) return false;
      }
      if (due === 'overdue') {
        if (!t.dueDate) return false;
        return new Date(t.dueDate) < now;
      }
      if (due === 'today') {
        if (!t.dueDate) return false;
        return new Date(t.dueDate).toDateString() === now.toDateString();
      }
      if (due === 'week') {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate) - now;
        return d >= 0 && d <= 7 * 86400000;
      }
      return true;
    });
  },

  _applySort(tasks) {
    const { sort } = this._activeFilter();
    if (sort === 'priority') {
      const order = ['urgent', 'high', 'medium', 'low'];
      return [...tasks].sort((a, b) => order.indexOf(a.priority) - order.indexOf(b.priority));
    }
    if (sort === 'due') {
      return [...tasks].sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    }
    if (sort === 'title') {
      return [...tasks].sort((a, b) => a.title.localeCompare(b.title));
    }
    return tasks;
  },

  _esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },

  _fmtEst(min) {
    if (!min) return '';
    if (min < 60) return `${min}m`;
    const h = Math.floor(min / 60), m = min % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  },

  // ── Subject/Activity link (Feature 2) ─────────────────
  _allSubjectActivityOptions(selectedValue) {
    const groups = [
      { label: 'UPSC Subjects',   domain: 'upsc', type: 'subject',  items: typeof StudyTracker !== 'undefined' ? StudyTracker.getSubjects() : [] },
      { label: 'UPSC Activities', domain: 'upsc', type: 'activity', items: typeof StudyTracker !== 'undefined' ? StudyTracker.getActivities() : [] },
      { label: 'Tech Subjects',   domain: 'tech', type: 'subject',  items: typeof TechStudyTracker !== 'undefined' ? TechStudyTracker.getSubjects() : [] },
      { label: 'Tech Activities', domain: 'tech', type: 'activity', items: typeof TechStudyTracker !== 'undefined' ? TechStudyTracker.getActivities() : [] },
    ];
    const optgroups = groups.filter(g => g.items.length).map(g => `
      <optgroup label="${this._esc(g.label)}">
        ${g.items.map(item => {
          const val = `${g.domain}:${g.type}:${item.id}`;
          return `<option value="${val}" ${val === selectedValue ? 'selected' : ''}>${this._esc(item.emoji || item.tree || '📌')} ${this._esc(item.label)}</option>`;
        }).join('')}
      </optgroup>`).join('');
    return `<option value="" ${!selectedValue ? 'selected' : ''}>— none —</option>${optgroups}`;
  },

  _subjectRefMeta(ref) {
    if (!ref) return null;
    const tracker = ref.domain === 'tech' ? (typeof TechStudyTracker !== 'undefined' ? TechStudyTracker : null)
                                            : (typeof StudyTracker !== 'undefined' ? StudyTracker : null);
    if (!tracker) return null;
    const item = ref.type === 'activity' ? tracker.getActivity(ref.id) : tracker.getSubject(ref.id);
    if (!item) return null;
    return { emoji: item.emoji || item.tree || '📌', label: item.label, color: item.color || 'var(--text-muted)' };
  },

  _parseSubjectRefValue(value) {
    if (!value) return null;
    const [domain, type, ...idParts] = value.split(':');
    return { domain, type, id: idParts.join(':') };
  },

  // ── Stats strip ──────────────────────────────────────
  _renderStats() {
    const el = document.getElementById('tasksStats');
    if (!el) return;
    const all     = this._tasks();
    const done    = all.filter(t => t.done).length;
    const overdue = all.filter(t => !t.done && t.dueDate && new Date(t.dueDate) < new Date()).length;
    const urgent  = all.filter(t => !t.done && t.priority === 'urgent').length;
    el.innerHTML = `
      <div class="tasks-stat"><span class="tasks-stat-n">${all.length}</span><span class="tasks-stat-l">Total</span></div>
      <div class="tasks-stat"><span class="tasks-stat-n" style="color:var(--accent-green);">${done}</span><span class="tasks-stat-l">Done</span></div>
      <div class="tasks-stat"><span class="tasks-stat-n" style="color:var(--accent-rose);">${overdue}</span><span class="tasks-stat-l">Overdue</span></div>
      <div class="tasks-stat"><span class="tasks-stat-n" style="color:var(--accent-amber);">${urgent}</span><span class="tasks-stat-l">Urgent</span></div>
    `;
  },

  // ── Eisenhower Matrix ────────────────────────────────
  _renderMatrix() {
    const grid = document.getElementById('tasksMatrixGrid');
    if (!grid) return;

    const allTasks = this._tasks();
    const active = allTasks.filter(t => !t.done);
    const filtered = this._applySort(this._filterTasks(active));

    const grouped = { 1: [], 2: [], 3: [], 4: [] };
    filtered.forEach(t => {
      const q = this._quadrantFor(t);
      grouped[q].push(t);
    });

    grid.innerHTML = this.QUADRANTS.map(q => {
      const items = grouped[q.id] || [];
      return `
        <div class="matrix-quadrant ${q.key}" data-quadrant="${q.id}">
          <div class="matrix-quadrant-header">
            <span class="matrix-quadrant-title">${q.icon} ${q.label}</span>
            <span class="matrix-count">${items.length}</span>
          </div>
          <div class="matrix-quadrant-sub">${q.desc}</div>
          <div class="matrix-item-list" id="matrixQ${q.id}" data-q="${q.id}">
            ${items.length ? items.map(t => this._matrixItemHTML(t)).join('') : '<div class="matrix-empty">No tasks</div>'}
          </div>
        </div>`;
    }).join('');

    this._bindMatrixEvents(grid);
    this._bindDragDrop(grid);
  },

  _matrixItemHTML(t) {
    const pri = this._priorityMeta(t.priority);
    const due = this._dueMeta(t.dueDate);
    const sub = this._subtaskProgress(t);
    const status = t.status || 'todo';
    const isRunning = this._runningTaskId === t.id;
    const actualMin = t.actualMin || 0;
    const subjMeta = this._subjectRefMeta(t.subjectRef);
    return `
      <div class="matrix-task-item${isRunning ? ' task-timer-active' : ''}" data-tid="${t.id}" draggable="true">
        <label class="matrix-task-cb-wrap" title="${t.done ? 'Mark incomplete' : 'Mark complete'}">
          <input type="checkbox" class="matrix-task-cb" data-tid="${t.id}" ${t.done ? 'checked' : ''}>
          <span class="task-cb-visual"></span>
        </label>
        <div class="matrix-task-body">
          <div class="matrix-task-title">${this._esc(t.title)}</div>
          <div class="matrix-task-meta">
            <span class="task-pri-dot" style="background:${pri.color};" title="${pri.label}"></span>
            ${subjMeta ? `<span class="task-subject-chip" style="color:${subjMeta.color};">${subjMeta.emoji} ${this._esc(subjMeta.label)}</span>` : ''}
            ${due ? `<span class="task-due-badge ${due.cls}">${due.label}</span>` : ''}
            ${sub.total > 0 ? `<span class="task-subtask-badge">☑ ${sub.done}/${sub.total}</span>` : ''}
            ${t.estimatedMin ? `<span class="task-est-badge">⏱ ${this._fmtEst(t.estimatedMin)}</span>` : ''}
            ${!isRunning && actualMin > 0 ? `<span class="task-actual-badge" title="Time logged">⏲ ${this._fmtEst(actualMin)}</span>` : ''}
            ${isRunning ? `<span class="task-timer-badge task-timer-live-dot" data-timer-display-tid="${t.id}">${this._fmtTimerTask(this._taskElapsed)}</span>` : ''}
            ${status === 'in-progress' ? '<span class="task-status-badge status-inprogress" data-status-tid="' + t.id + '">⏳</span>' : ''}
          </div>
        </div>
        <div class="matrix-task-actions">
          <button class="task-timer-btn${isRunning ? ' task-timer-running' : ''}" data-timer-tid="${t.id}" title="${isRunning ? 'Stop timer' : 'Start timer'}">${isRunning ? '⏹' : '▶️'}</button>
          <button class="task-edit-btn" data-edit-tid="${t.id}" title="Edit">✏️</button>
          <button class="task-del-btn" data-tid="${t.id}" title="Delete">🗑</button>
        </div>
      </div>`;
  },

  // ── Completed tasks (collapsed) ──────────────────────
  _renderCompleted() {
    const section = document.getElementById('tasksCompletedSection');
    const list = document.getElementById('tasksCompletedList');
    const badge = document.getElementById('tasksCompletedCount');
    if (!section || !list) return;

    const done = this._tasks().filter(t => t.done);
    if (badge) badge.textContent = done.length;

    if (!done.length) {
      list.innerHTML = '<div class="matrix-empty" style="padding:16px;">No completed tasks yet</div>';
      return;
    }

    const sorted = [...done].sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0)).slice(0, 20);
    list.innerHTML = sorted.map(t => {
      const pri = this._priorityMeta(t.priority);
      const late = this._isLate(t);
      return `
        <div class="matrix-task-item task-done" data-tid="${t.id}">
          <label class="matrix-task-cb-wrap">
            <input type="checkbox" class="matrix-task-cb" data-tid="${t.id}" checked>
            <span class="task-cb-visual"></span>
          </label>
          <div class="matrix-task-body">
            <div class="matrix-task-title" style="text-decoration:line-through;opacity:0.6;">${this._esc(t.title)}</div>
            <div class="matrix-task-meta">
              <span class="task-pri-dot" style="background:${pri.color};"></span>
              ${t.completedAt ? `<span style="font-size:10px;color:var(--text-faint);">${t.completedAt.slice(0,10)}</span>` : ''}
              ${late ? `<span class="task-late-badge">⏰ +${late.days}d late</span>` : ''}
            </div>
          </div>
          <div class="matrix-task-actions">
            <button class="task-del-btn" data-tid="${t.id}" title="Delete">🗑</button>
          </div>
        </div>`;
    }).join('');

    this._bindCompletedEvents(list);
  },

  // ── Quick Add ────────────────────────────────────────
  _renderQuickAdd() {
    const el = document.getElementById('tasksQuickAdd');
    if (!el) return;

    if (!el.dataset.init) {
      el.dataset.init = '1';
      el.innerHTML = `
        <input class="task-qa-input" id="qaTitle" placeholder="New task…" maxlength="200">
        <div class="task-qa-fields">
          <input type="date" class="task-qa-date" id="qaDate" title="Due date">
          <select class="task-qa-pri" id="qaPri" title="Priority">
            ${this.PRIORITIES.map(p => `<option value="${p.value}">${p.icon} ${p.label}</option>`).join('')}
          </select>
        </div>
        <select class="task-qa-subject" id="qaSubjectRef" title="Link to subject/activity"></select>
        <div class="task-qa-quadrant">
          <button class="task-qa-q-btn active" data-q="0">Auto</button>
          ${this.QUADRANTS.map(q => `<button class="task-qa-q-btn ${q.key}" data-q="${q.id}">${q.icon} Q${q.id}</button>`).join('')}
        </div>
        <button class="btn btn-primary btn-xs" id="qaSubmit" style="width:100%;margin-top:8px;">+ Add Task</button>`;

      let selectedQ = 0;
      el.querySelectorAll('.task-qa-q-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          el.querySelectorAll('.task-qa-q-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          selectedQ = parseInt(btn.dataset.q);
        });
      });

      const save = () => {
        const title = document.getElementById('qaTitle')?.value.trim();
        if (!title) { document.getElementById('qaTitle')?.focus(); return; }
        const dueDate = document.getElementById('qaDate')?.value || '';
        const priority = document.getElementById('qaPri')?.value || 'medium';
        const subjectRef = this._parseSubjectRefValue(document.getElementById('qaSubjectRef')?.value);

        let buckets = AppState.taskBuckets || [];
        if (!buckets.filter(b => !b.deleted).length) {
          buckets.push({ id: Date.now() - 1, title: 'General', color: '#5b7fff', createdAt: new Date().toISOString() });
          AppState.taskBuckets = buckets;
        }
        const bucketId = buckets.filter(b => !b.deleted)[0].id;

        AppState.tasks = AppState.tasks || [];
        AppState.tasks.push({
          id: Date.now(), bucketId, title, description: '', dueDate, priority,
          status: 'todo', done: false, completedAt: null, subtasks: [],
          estimatedMin: null, matrixQ: selectedQ > 0 ? selectedQ : null,
          subjectRef, timeSessions: [], actualMin: 0,
          createdAt: new Date().toISOString(),
        });
        AppState.save();
        document.getElementById('qaTitle').value = '';
        document.getElementById('qaDate').value = '';
        this.render();
        if (typeof UI !== 'undefined') UI.showToast('Task added');
      };

      document.getElementById('qaSubmit')?.addEventListener('click', save);
      document.getElementById('qaTitle')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') save();
      });
    }

    const subjSel = document.getElementById('qaSubjectRef');
    if (subjSel) subjSel.innerHTML = this._allSubjectActivityOptions(subjSel.value);
  },

  // ── Analytics ────────────────────────────────────────
  _renderAnalytics() {
    const el = document.getElementById('tasksAnalytics');
    if (!el) return;

    const all = this._tasks();
    const active = all.filter(t => !t.done);
    const done = all.filter(t => t.done);
    const overdue = active.filter(t => t.dueDate && new Date(t.dueDate) < new Date());
    const withDue = done.filter(t => t.dueDate && t.completedAt);
    const late = withDue.filter(t => this._isLate(t));
    const onTime = withDue.length - late.length;
    const onTimePct = withDue.length ? Math.round((onTime / withDue.length) * 100) : 100;

    const qCounts = [0, 0, 0, 0];
    active.forEach(t => { const q = this._quadrantFor(t); qCounts[q - 1]++; });

    const q1Rate = qCounts[0] > 0 ? Math.max(0, 100 - qCounts[0] * 15) : 100;
    const overduePenalty = Math.min(20, overdue.length * 5);
    const prodScore = Math.max(0, Math.min(100, Math.round(
      onTimePct * 0.35 + q1Rate * 0.25 + (100 - overduePenalty) * 0.2 + (done.length > 0 ? 20 : 0)
    )));

    const priCounts = {};
    this.PRIORITIES.forEach(p => { priCounts[p.value] = active.filter(t => t.priority === p.value).length; });

    const weeklyData = this._weeklyActivity(done);
    const qEstimates = [0, 0, 0, 0];
    active.forEach(t => { if (t.estimatedMin) qEstimates[this._quadrantFor(t) - 1] += t.estimatedMin; });

    const qActuals = [0, 0, 0, 0];
    all.forEach(t => { if (t.actualMin) qActuals[this._quadrantFor(t) - 1] += t.actualMin; });

    const withBoth = all.filter(t => t.estimatedMin > 0 && t.actualMin > 0);
    let overCount = 0, underCount = 0, accuracyPct = 100;
    if (withBoth.length) {
      const errs = withBoth.map(t => {
        if (t.actualMin > t.estimatedMin) overCount++;
        else if (t.actualMin < t.estimatedMin) underCount++;
        return Math.abs(t.actualMin - t.estimatedMin) / t.estimatedMin;
      });
      accuracyPct = Math.max(0, Math.min(100, Math.round(100 - (errs.reduce((s, x) => s + x, 0) / errs.length) * 100)));
    }

    el.innerHTML = `
      <div class="analytics-card">${this._svgGauge(prodScore, done.length, active.length, all.length)}</div>
      <div class="analytics-card">${this._svgDonut(done.length, active.length, overdue.length)}</div>
      <div class="analytics-card">${this._svgStackedBar(qCounts)}</div>
      <div class="analytics-card analytics-card-wide">${this._svgAreaChart(weeklyData)}</div>
      <div class="analytics-card">${this._svgBarChart(priCounts)}</div>
      <div class="analytics-card">
        <div class="analytics-card-title">On-Time Rate</div>
        <div style="font-size:32px;font-weight:800;color:var(--text);text-align:center;margin:12px 0 4px;">${onTimePct}%</div>
        <div class="tasks-ontime-bar"><div class="tasks-ontime-fill" style="width:${onTimePct}%;"></div></div>
        <div style="font-size:11px;color:var(--text-muted);text-align:center;margin-top:6px;">${onTime} on time · ${late.length} late</div>
      </div>
      <div class="analytics-card analytics-card-wide">
        <div class="analytics-card-title">Time Estimates by Quadrant</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px;">
          ${this.QUADRANTS.map((q, i) => `
            <div style="text-align:center;padding:10px 4px;background:var(--card-bg);border-radius:10px;border:1px solid var(--border);">
              <div style="font-size:18px;">${q.icon}</div>
              <div style="font-size:16px;font-weight:700;color:var(--text);margin-top:4px;">${this._fmtEst(qEstimates[i]) || '0m'}</div>
              <div style="font-size:10px;color:var(--text-muted);">Q${q.id}</div>
            </div>`).join('')}
        </div>
      </div>
      <div class="analytics-card analytics-card-wide">${this._svgEstVsActualChart(qEstimates, qActuals)}</div>
      <div class="analytics-card">
        <div class="analytics-card-title">Estimation Accuracy</div>
        <div style="font-size:32px;font-weight:800;color:var(--text);text-align:center;margin:12px 0 4px;">${withBoth.length ? accuracyPct + '%' : '—'}</div>
        <div class="tasks-ontime-bar"><div class="tasks-ontime-fill" style="width:${withBoth.length ? accuracyPct : 0}%;"></div></div>
        <div style="font-size:11px;color:var(--text-muted);text-align:center;margin-top:6px;">${withBoth.length ? `${overCount} over-estimated · ${underCount} under-estimated` : 'No tasks with both estimate and logged time yet'}</div>
      </div>
    `;
  },

  _weeklyActivity(doneTasks) {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en', { weekday: 'short' });
      const count = doneTasks.filter(t => t.completedAt && t.completedAt.startsWith(key)).length;
      days.push({ key, dayName, count });
    }
    return days;
  },

  _svgGauge(score, doneN, activeN, totalN) {
    const r = 70, cx = 90, cy = 90, stroke = 14;
    const startAngle = -220, endAngle = 40, range = endAngle - startAngle;
    const needleAngle = startAngle + (score / 100) * range;
    const toRad = a => a * Math.PI / 180;

    const arcPath = (from, to) => {
      const x1 = cx + r * Math.cos(toRad(from)), y1 = cy + r * Math.sin(toRad(from));
      const x2 = cx + r * Math.cos(toRad(to)),   y2 = cy + r * Math.sin(toRad(to));
      const large = (to - from) > 180 ? 1 : 0;
      return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
    };

    const zones = [
      { from: startAngle, to: startAngle + range * 0.3, color: 'var(--accent-rose)' },
      { from: startAngle + range * 0.3, to: startAngle + range * 0.6, color: 'var(--accent-amber)' },
      { from: startAngle + range * 0.6, to: endAngle, color: 'var(--accent-green)' },
    ];

    const nx = cx + (r - 20) * Math.cos(toRad(needleAngle));
    const ny = cy + (r - 20) * Math.sin(toRad(needleAngle));

    return `
      <div class="analytics-card-title">Productivity</div>
      <svg class="gauge-svg" viewBox="0 0 180 130">
        ${zones.map(z => `<path d="${arcPath(z.from, z.to)}" fill="none" stroke="${z.color}" stroke-width="${stroke}" stroke-linecap="round" opacity="0.25"/>`).join('')}
        ${score > 0 ? `<path d="${arcPath(startAngle, needleAngle)}" fill="none" stroke="${score < 30 ? 'var(--accent-rose)' : score < 60 ? 'var(--accent-amber)' : 'var(--accent-green)'}" stroke-width="${stroke}" stroke-linecap="round"/>` : ''}
        <line x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}" stroke="var(--text)" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="${cx}" cy="${cy}" r="4" fill="var(--text)"/>
        <text x="${cx}" y="${cy + 2}" text-anchor="middle" class="gauge-score">${score}</text>
      </svg>
      <div style="font-size:11px;color:var(--text-muted);text-align:center;margin-top:2px;">${doneN} done · ${activeN} active · ${totalN} total</div>`;
  },

  _svgDonut(doneN, activeN, overdueN) {
    const total = doneN + activeN;
    if (total === 0) {
      return `
        <div class="analytics-card-title">Task Status</div>
        <svg class="donut-svg" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="45" fill="none" stroke="var(--border)" stroke-width="12"/>
          <text x="60" y="56" text-anchor="middle" class="donut-center-n">0</text>
          <text x="60" y="70" text-anchor="middle" style="font-size:8px;fill:var(--text-muted);">tasks</text>
        </svg>`;
    }
    const r = 45, circ = 2 * Math.PI * r;
    const segments = [
      { n: doneN, color: 'var(--accent-green)', label: 'Done' },
      { n: activeN - overdueN, color: 'var(--accent-blue)', label: 'Active' },
      { n: overdueN, color: 'var(--accent-rose)', label: 'Overdue' },
    ].filter(s => s.n > 0);

    let offset = 0;
    const paths = segments.map(s => {
      const pct = s.n / total;
      const dash = pct * circ;
      const html = `<circle cx="60" cy="60" r="${r}" fill="none" stroke="${s.color}" stroke-width="12"
        stroke-dasharray="${dash} ${circ - dash}" stroke-dashoffset="${-offset}" transform="rotate(-90 60 60)"/>`;
      offset += dash;
      return html;
    });

    return `
      <div class="analytics-card-title">Task Status</div>
      <svg class="donut-svg" viewBox="0 0 120 120">
        ${paths.join('')}
        <text x="60" y="56" text-anchor="middle" class="donut-center-n">${total}</text>
        <text x="60" y="70" text-anchor="middle" style="font-size:8px;fill:var(--text-muted);">tasks</text>
      </svg>
      <div style="display:flex;justify-content:center;gap:12px;margin-top:6px;font-size:10px;">
        ${segments.map(s => `<span style="color:${s.color};">● ${s.label} ${s.n}</span>`).join('')}
      </div>`;
  },

  _svgStackedBar(qCounts) {
    const total = qCounts.reduce((a, b) => a + b, 0) || 1;
    const colors = ['var(--accent-rose)', 'var(--accent-blue)', 'var(--accent-amber)', 'var(--accent-teal)'];
    let x = 0;
    const barW = 280;

    const rects = qCounts.map((n, i) => {
      const w = (n / total) * barW;
      const html = w > 0 ? `<rect x="${x}" y="0" width="${w}" height="28" rx="4" fill="${colors[i]}"/>` : '';
      x += w;
      return html;
    });

    return `
      <div class="analytics-card-title">By Quadrant</div>
      <svg class="stacked-bar-svg" viewBox="0 0 ${barW} 28" preserveAspectRatio="none" style="width:100%;height:28px;margin:12px 0 8px;border-radius:6px;overflow:hidden;">
        <rect x="0" y="0" width="${barW}" height="28" fill="var(--border)" rx="4"/>
        ${rects.join('')}
      </svg>
      <div style="display:flex;justify-content:space-between;font-size:10px;">
        ${this.QUADRANTS.map((q, i) => `<span style="color:${colors[i]};">Q${q.id}: ${qCounts[i]}</span>`).join('')}
      </div>`;
  },

  _svgAreaChart(data) {
    const max = Math.max(1, ...data.map(d => d.count));
    const w = 280, h = 80, pad = 2;
    const stepX = (w - pad * 2) / Math.max(1, data.length - 1);

    const points = data.map((d, i) => {
      const x = pad + i * stepX;
      const y = h - pad - ((d.count / max) * (h - pad * 2 - 10));
      return { x, y };
    });

    const linePoints = points.map(p => `${p.x},${p.y}`).join(' ');
    const areaPoints = `${points[0].x},${h - pad} ${linePoints} ${points[points.length - 1].x},${h - pad}`;

    return `
      <div class="analytics-card-title">Weekly Activity</div>
      <svg class="area-chart-svg" viewBox="0 0 ${w} ${h + 16}" style="width:100%;margin-top:8px;">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--accent-blue)" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="var(--accent-blue)" stop-opacity="0.02"/>
          </linearGradient>
        </defs>
        <polygon points="${areaPoints}" fill="url(#areaGrad)"/>
        <polyline points="${linePoints}" fill="none" stroke="var(--accent-blue)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        ${points.map((p, i) => `<circle cx="${p.x}" cy="${p.y}" r="3" fill="var(--accent-blue)"/>`).join('')}
        ${data.map((d, i) => `<text x="${points[i].x}" y="${h + 12}" text-anchor="middle" style="font-size:8px;fill:var(--text-muted);">${d.dayName}</text>`).join('')}
      </svg>`;
  },

  _svgBarChart(priCounts) {
    const keys = ['urgent', 'high', 'medium', 'low'];
    const colors = ['var(--accent-rose)', 'var(--accent-amber)', 'var(--accent-blue)', 'var(--accent-green)'];
    const labels = ['Urgent', 'High', 'Med', 'Low'];
    const max = Math.max(1, ...keys.map(k => priCounts[k] || 0));
    const barW = 36, gap = 16, h = 80;
    const totalW = keys.length * barW + (keys.length - 1) * gap;
    const offsetX = (totalW > 200 ? 0 : (200 - totalW) / 2);

    const bars = keys.map((k, i) => {
      const n = priCounts[k] || 0;
      const barH = Math.max(2, (n / max) * (h - 16));
      const x = offsetX + i * (barW + gap);
      const y = h - barH;
      return `
        <rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="4" fill="${colors[i]}" opacity="0.8"/>
        <text x="${x + barW / 2}" y="${y - 4}" text-anchor="middle" style="font-size:9px;font-weight:700;fill:${colors[i]};">${n}</text>
        <text x="${x + barW / 2}" y="${h + 12}" text-anchor="middle" style="font-size:8px;fill:var(--text-muted);">${labels[i]}</text>`;
    });

    return `
      <div class="analytics-card-title">Priority Breakdown</div>
      <svg class="bar-chart-svg" viewBox="0 0 ${totalW + offsetX * 2} ${h + 18}" style="width:100%;margin-top:8px;">
        ${bars.join('')}
      </svg>`;
  },

  _svgEstVsActualChart(qEstimates, qActuals) {
    const max = Math.max(1, ...qEstimates, ...qActuals);
    const groupW = 60, barW = 22, gap = 4, h = 90;
    const totalW = this.QUADRANTS.length * groupW;

    const groups = this.QUADRANTS.map((q, i) => {
      const estH = Math.max(1, (qEstimates[i] / max) * (h - 20));
      const actH = Math.max(1, (qActuals[i] / max) * (h - 20));
      const gx = i * groupW + (groupW - (barW * 2 + gap)) / 2;
      return `
        <rect x="${gx}" y="${h - estH}" width="${barW}" height="${estH}" rx="3" fill="var(--text-faint)" opacity="0.6"/>
        <rect x="${gx + barW + gap}" y="${h - actH}" width="${barW}" height="${actH}" rx="3" fill="var(--accent-blue)"/>
        <text x="${gx + barW}" y="${h + 12}" text-anchor="middle" style="font-size:8px;fill:var(--text-muted);">Q${q.id}</text>`;
    });

    return `
      <div class="analytics-card-title">Estimate vs Actual</div>
      <svg class="est-actual-chart-svg" viewBox="0 0 ${totalW} ${h + 18}" style="width:100%;margin-top:8px;">
        ${groups.join('')}
      </svg>
      <div style="display:flex;justify-content:center;gap:14px;margin-top:6px;font-size:10px;">
        <span style="color:var(--text-faint);">■ Estimated</span>
        <span style="color:var(--accent-blue);">■ Actual</span>
      </div>`;
  },

  // ── Matrix event binding ─────────────────────────────
  _bindMatrixEvents(grid) {
    grid.querySelectorAll('.matrix-task-cb').forEach(cb => {
      cb.addEventListener('change', () => {
        const t = (AppState.tasks || []).find(x => x.id === parseInt(cb.dataset.tid));
        if (t) {
          t.done = cb.checked;
          t.completedAt = cb.checked ? new Date().toISOString() : null;
          if (!cb.checked) t.status = 'todo';
          t.modifiedAt = new Date().toISOString();
          AppState.save();
          this.render();
        }
      });
    });

    grid.querySelectorAll('.task-timer-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tid = parseInt(btn.dataset.timerTid);
        if (this._runningTaskId === tid) this._stopTaskTimer();
        else this._startTaskTimer(tid);
      });
    });

    grid.querySelectorAll('.task-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => this._openEditTask(parseInt(btn.dataset.editTid)));
    });

    grid.querySelectorAll('.task-del-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('Delete this task?')) return;
        const now = new Date().toISOString();
        AppState.tasks = (AppState.tasks || []).map(t =>
          t.id !== parseInt(btn.dataset.tid) ? t : { ...t, deleted: true, deletedAt: now, modifiedAt: now }
        );
        AppState.save();
        this.render();
      });
    });

    grid.querySelectorAll('.task-status-badge').forEach(badge => {
      badge.addEventListener('click', () => {
        const t = (AppState.tasks || []).find(x => x.id === parseInt(badge.dataset.statusTid));
        if (t && !t.done) {
          t.status = t.status === 'in-progress' ? 'todo' : 'in-progress';
          t.modifiedAt = new Date().toISOString();
          AppState.save();
          this.render();
        }
      });
    });
  },

  _bindCompletedEvents(list) {
    list.querySelectorAll('.matrix-task-cb').forEach(cb => {
      cb.addEventListener('change', () => {
        const t = (AppState.tasks || []).find(x => x.id === parseInt(cb.dataset.tid));
        if (t) {
          t.done = cb.checked;
          if (!cb.checked) { t.status = 'todo'; t.completedAt = null; }
          t.modifiedAt = new Date().toISOString();
          AppState.save();
          this.render();
        }
      });
    });

    list.querySelectorAll('.task-del-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('Delete this task?')) return;
        const now = new Date().toISOString();
        AppState.tasks = (AppState.tasks || []).map(t =>
          t.id !== parseInt(btn.dataset.tid) ? t : { ...t, deleted: true, deletedAt: now, modifiedAt: now }
        );
        AppState.save();
        this.render();
      });
    });
  },

  // ── Drag and drop (tasks between quadrants) ──────────
  _bindDragDrop(grid) {
    let dragTaskId = null;

    grid.querySelectorAll('.matrix-task-item').forEach(el => {
      el.addEventListener('dragstart', e => {
        if (e.target.closest('button, input, label')) { e.preventDefault(); return; }
        dragTaskId = parseInt(el.dataset.tid);
        setTimeout(() => el.classList.add('matrix-dragging'), 0);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(dragTaskId));
      });
      el.addEventListener('dragend', () => {
        el.classList.remove('matrix-dragging');
        grid.querySelectorAll('.matrix-drop-over').forEach(l => l.classList.remove('matrix-drop-over'));
        dragTaskId = null;
      });
    });

    grid.querySelectorAll('.matrix-item-list').forEach(list => {
      const q = parseInt(list.dataset.q);
      list.addEventListener('dragover', e => {
        if (dragTaskId == null) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        list.classList.add('matrix-drop-over');
      });
      list.addEventListener('dragleave', e => {
        if (!list.contains(e.relatedTarget)) list.classList.remove('matrix-drop-over');
      });
      list.addEventListener('drop', e => {
        e.preventDefault();
        list.classList.remove('matrix-drop-over');
        if (dragTaskId == null) return;
        const t = (AppState.tasks || []).find(x => x.id === dragTaskId);
        if (t) {
          t.matrixQ = q;
          t.modifiedAt = new Date().toISOString();
          AppState.save();
          this.render();
        }
        dragTaskId = null;
      });
    });
  },

  // ── Task Timer (single active timer, mirrors js/study.js pattern) ──
  _fmtTimerTask(sec) {
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    const mm = String(m).padStart(2, '0'), ss = String(s).padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  },

  _saveTaskTimerState() {
    if (this._runningTaskId == null) return;
    try {
      localStorage.setItem(this._taskTimerKey, JSON.stringify({
        running: true, taskId: this._runningTaskId, elapsed: this._taskElapsed,
        startedAt: this._taskStartedAt, savedAt: Date.now(),
      }));
    } catch (e) {}
  },

  _clearTaskTimerState() {
    try { localStorage.removeItem(this._taskTimerKey); } catch (e) {}
  },

  _restoreTaskTimerState() {
    if (this._runningTaskId != null) return;
    try {
      const raw = localStorage.getItem(this._taskTimerKey);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (!s?.running || s.taskId == null) return;
      const t = (AppState.tasks || []).find(x => x.id === s.taskId);
      if (!t || t.deleted || t.done) { this._clearTaskTimerState(); return; }

      const wallElapsed = Math.floor((Date.now() - (s.savedAt || Date.now())) / 1000);
      this._runningTaskId = s.taskId;
      this._taskElapsed = (s.elapsed || 0) + Math.max(0, wallElapsed);
      this._taskStartedAt = s.startedAt;
      clearInterval(this._taskTimerInterval);
      this._taskTimerInterval = setInterval(() => this._onTaskTimerTick(), 1000);
      this._renderMatrix();
      this._reconcileWithNativeTimer();
    } catch (e) {}
  },

  // On the Android wrapper, a foreground service keeps ticking (and its own
  // elapsed clock accurate) while this page is backgrounded/screen-locked.
  // Adopt its elapsed time on resume since it's the more trustworthy source
  // for time that passed while this JS interval may have been throttled.
  async _reconcileWithNativeTimer() {
    if (typeof NativeTimerBridge === 'undefined' || !NativeTimerBridge.isNative()) return;
    const native = await NativeTimerBridge.getElapsed();
    if (!native || !native.running || native.taskId == null) return;
    const nativeTaskId = parseInt(native.taskId);
    if (this._runningTaskId !== nativeTaskId || native.elapsedSec > this._taskElapsed) {
      this._runningTaskId = nativeTaskId;
      this._taskElapsed = native.elapsedSec;
      this._renderMatrix();
    }
  },

  _startTaskTimer(taskId) {
    const t = (AppState.tasks || []).find(x => x.id === taskId);
    if (!t || t.done) return;
    if (this._runningTaskId != null && this._runningTaskId !== taskId) {
      this._stopTaskTimer(true);
      if (typeof UI !== 'undefined') UI.showToast(`⏱ Switched timer to "${t.title}"`);
    }
    this._runningTaskId = taskId;
    this._taskElapsed = 0;
    this._taskStartedAt = new Date().toISOString();
    clearInterval(this._taskTimerInterval);
    this._taskTimerInterval = setInterval(() => this._onTaskTimerTick(), 1000);
    this._saveTaskTimerState();
    if (typeof NativeTimerBridge !== 'undefined') NativeTimerBridge.start(taskId, t.title);
    this._refreshAfterTimerChange();
  },

  _stopTaskTimer(suppressRefresh) {
    if (this._runningTaskId == null) return;
    clearInterval(this._taskTimerInterval);
    this._taskTimerInterval = null;
    const t = (AppState.tasks || []).find(x => x.id === this._runningTaskId);
    if (t && this._taskElapsed >= 60) {
      const min = Math.round(this._taskElapsed / 60);
      t.timeSessions = t.timeSessions || [];
      t.timeSessions.push({ id: Date.now(), startedAt: this._taskStartedAt, endedAt: new Date().toISOString(), min });
      t.actualMin = t.timeSessions.reduce((s, x) => s + x.min, 0);
      t.modifiedAt = new Date().toISOString();
      AppState.save();
    }
    this._runningTaskId = null;
    this._taskElapsed = 0;
    this._taskStartedAt = null;
    this._clearTaskTimerState();
    if (typeof NativeTimerBridge !== 'undefined') NativeTimerBridge.stop();
    if (!suppressRefresh) this._refreshAfterTimerChange();
  },

  _onTaskTimerTick() {
    this._taskElapsed++;
    document.querySelectorAll(`[data-timer-display-tid="${this._runningTaskId}"]`).forEach(el => {
      el.textContent = this._fmtTimerTask(this._taskElapsed);
    });
    if (this._taskElapsed % 10 === 0) this._saveTaskTimerState();
  },

  _refreshAfterTimerChange() {
    if (document.querySelector('.task-edit-area')) {
      document.querySelectorAll('.task-timer-btn').forEach(btn => {
        const isRun = this._runningTaskId === parseInt(btn.dataset.timerTid);
        btn.classList.toggle('task-timer-running', isRun);
        btn.textContent = isRun ? '⏹' : '▶️';
        btn.title = isRun ? 'Stop timer' : 'Start timer';
      });
      document.querySelectorAll('[data-timer-display-tid]').forEach(el => {
        const isRun = this._runningTaskId === parseInt(el.dataset.timerDisplayTid);
        el.textContent = isRun ? this._fmtTimerTask(this._taskElapsed) : '00:00';
      });
      this._renderStats();
      this._renderAnalytics();
    } else {
      this.render();
    }
  },

  // ── Inline task editor ────────────────────────────────
  _openEditTask(tid) {
    document.querySelectorAll('.task-edit-area').forEach(a => a.remove());
    document.querySelectorAll('.task-item-editing').forEach(el => el.classList.remove('task-item-editing'));

    const t = (AppState.tasks || []).find(x => x.id === tid);
    if (!t) return;
    const el = document.querySelector(`.matrix-task-item[data-tid="${tid}"]`);
    if (!el) return;

    el.classList.add('task-item-editing');

    let workingMatrixQ = t.matrixQ ?? null;
    const mqA = (q) => workingMatrixQ === q ? ' active' : '';

    const editDiv = document.createElement('div');
    editDiv.className = 'task-edit-area';
    editDiv.innerHTML = `
      <input class="task-edit-title" value="${this._esc(t.title)}" placeholder="Task title" maxlength="200">
      <textarea class="task-edit-desc" placeholder="Description (optional)" rows="2" maxlength="1000">${this._esc(t.description || '')}</textarea>
      <div class="task-edit-fields">
        <input type="date" class="task-edit-date" value="${this._esc(t.dueDate || '')}" title="Due date">
        <select class="task-edit-pri" title="Priority">
          ${this.PRIORITIES.map(p => `<option value="${p.value}" ${t.priority === p.value ? 'selected' : ''}>${p.icon} ${p.label}</option>`).join('')}
        </select>
        <select class="task-edit-status" title="Status">
          <option value="todo" ${(t.status || 'todo') === 'todo' ? 'selected' : ''}>○ Todo</option>
          <option value="in-progress" ${t.status === 'in-progress' ? 'selected' : ''}>⏳ In Progress</option>
        </select>
        <input type="number" class="task-edit-est" min="0" max="9999" step="5" value="${t.estimatedMin != null ? t.estimatedMin : ''}" placeholder="⏱ min" title="Estimated time (minutes)">
      </div>
      <div class="task-edit-timer-row">
        <button class="task-timer-btn${this._runningTaskId === t.id ? ' task-timer-running' : ''}" data-timer-tid="${t.id}" title="${this._runningTaskId === t.id ? 'Stop timer' : 'Start timer'}">${this._runningTaskId === t.id ? '⏹' : '▶️'}</button>
        <span class="task-timer-badge" data-timer-display-tid="${t.id}">${this._runningTaskId === t.id ? this._fmtTimerTask(this._taskElapsed) : '00:00'}</span>
        <span class="task-edit-timer-logged">Logged: ${this._fmtEst(t.actualMin || 0) || '0m'}</span>
      </div>
      <select class="task-edit-subject" title="Link to subject/activity">
        ${this._allSubjectActivityOptions(t.subjectRef ? `${t.subjectRef.domain}:${t.subjectRef.type}:${t.subjectRef.id}` : '')}
      </select>
      <div class="task-edit-subtasks">
        <div class="task-edit-subtasks-label">Subtasks</div>
        <div class="task-edit-subtask-list"></div>
        <div class="task-edit-subtask-add">
          <input class="task-edit-subtask-input" placeholder="Add subtask…" maxlength="200">
          <button class="btn btn-xs task-edit-subtask-add-btn">+ Add</button>
        </div>
      </div>
      <div class="task-edit-matrix">
        <span class="task-edit-matrix-label">Quadrant:</span>
        <button class="task-edit-mq-btn${mqA(null)}" data-q="null">Auto</button>
        <button class="task-edit-mq-btn q1${mqA(1)}" data-q="1">🔥 Q1</button>
        <button class="task-edit-mq-btn q2${mqA(2)}" data-q="2">📅 Q2</button>
        <button class="task-edit-mq-btn q3${mqA(3)}" data-q="3">⚡ Q3</button>
        <button class="task-edit-mq-btn q4${mqA(4)}" data-q="4">🌙 Q4</button>
      </div>
      <div class="task-edit-actions">
        <button class="btn btn-xs btn-primary task-edit-save">Save</button>
        <button class="btn btn-xs task-edit-cancel">Cancel</button>
      </div>`;

    el.after(editDiv);
    const titleInput = editDiv.querySelector('.task-edit-title');
    titleInput.focus();
    titleInput.select();

    let workingSubtasks = (t.subtasks || []).map(s => ({ ...s }));
    const subtaskListEl = editDiv.querySelector('.task-edit-subtask-list');
    const renderSubtaskList = () => {
      subtaskListEl.innerHTML = workingSubtasks.length
        ? workingSubtasks.map((s, i) => `
            <div class="task-edit-subtask-row">
              <label class="task-subtask-row">
                <input type="checkbox" class="task-edit-subtask-cb" data-idx="${i}" ${s.done ? 'checked' : ''}>
                <span class="${s.done ? 'task-subtask-done' : ''}">${this._esc(s.title)}</span>
              </label>
              <button class="task-edit-subtask-del" data-idx="${i}" title="Remove subtask">✕</button>
            </div>`).join('')
        : `<div class="task-edit-subtask-empty">No subtasks yet</div>`;

      subtaskListEl.querySelectorAll('.task-edit-subtask-cb').forEach(cb => {
        cb.addEventListener('change', () => {
          workingSubtasks[parseInt(cb.dataset.idx)].done = cb.checked;
          renderSubtaskList();
        });
      });
      subtaskListEl.querySelectorAll('.task-edit-subtask-del').forEach(btn => {
        btn.addEventListener('click', () => {
          workingSubtasks.splice(parseInt(btn.dataset.idx), 1);
          renderSubtaskList();
        });
      });
    };
    renderSubtaskList();

    const subtaskInput = editDiv.querySelector('.task-edit-subtask-input');
    const addSubtask = () => {
      const title = subtaskInput.value.trim();
      if (!title) return;
      workingSubtasks.push({ id: `st-${Date.now()}-${Math.floor(Math.random() * 10000)}`, title, done: false });
      subtaskInput.value = '';
      renderSubtaskList();
      subtaskInput.focus();
    };
    editDiv.querySelector('.task-edit-subtask-add-btn').addEventListener('click', addSubtask);
    subtaskInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); addSubtask(); }
    });

    editDiv.querySelectorAll('.task-edit-mq-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        workingMatrixQ = btn.dataset.q === 'null' ? null : parseInt(btn.dataset.q);
        editDiv.querySelectorAll('.task-edit-mq-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    editDiv.querySelector('.task-edit-timer-row .task-timer-btn')?.addEventListener('click', () => {
      if (this._runningTaskId === tid) this._stopTaskTimer();
      else this._startTaskTimer(tid);
    });

    const save = () => {
      const newTitle = editDiv.querySelector('.task-edit-title').value.trim();
      if (!newTitle) { editDiv.querySelector('.task-edit-title').focus(); return; }
      t.title       = newTitle;
      t.description = editDiv.querySelector('.task-edit-desc').value.trim();
      t.dueDate     = editDiv.querySelector('.task-edit-date').value || '';
      t.priority    = editDiv.querySelector('.task-edit-pri').value;
      t.status      = editDiv.querySelector('.task-edit-status').value;
      const estRaw  = editDiv.querySelector('.task-edit-est').value;
      t.estimatedMin = estRaw === '' ? null : Math.max(0, parseInt(estRaw) || 0);
      t.subtasks    = workingSubtasks;
      t.matrixQ     = workingMatrixQ;
      t.subjectRef  = this._parseSubjectRefValue(editDiv.querySelector('.task-edit-subject')?.value);
      t.modifiedAt  = new Date().toISOString();
      AppState.save();
      this.render();
      if (typeof UI !== 'undefined') UI.showToast('Task updated');
    };

    const cancel = () => {
      editDiv.remove();
      el.classList.remove('task-item-editing');
      if (this._runningTaskId != null) this._renderMatrix();
    };

    editDiv.querySelector('.task-edit-save').addEventListener('click', save);
    editDiv.querySelector('.task-edit-cancel').addEventListener('click', cancel);
    titleInput.addEventListener('keydown', e => {
      if (e.key === 'Enter')  save();
      if (e.key === 'Escape') cancel();
    });
  },

  // ── Filter bar bindings ───────────────────────────────
  _bindFilters() {
    const rerender = () => this._renderMatrix();
    document.getElementById('taskFilterPriority')?.addEventListener('change', rerender);
    document.getElementById('taskFilterStatus')?.addEventListener('change',   rerender);
    document.getElementById('taskFilterDue')?.addEventListener('change',      rerender);
    document.getElementById('taskSort')?.addEventListener('change',           rerender);
  },
};
