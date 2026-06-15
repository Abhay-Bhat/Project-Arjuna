// ============================================================
// Skadi — Time Management Matrix (Eisenhower)
// Auto-categorizes Tasks, today's Routine, and upcoming
// Milestones into the Urgent/Important 2x2 grid.
// ============================================================

const TimeMatrix = {

  QUADRANTS: [
    { id: 1, cls: 'q1', icon: '🔥', label: 'Do First',   sub: 'Urgent & Important'    },
    { id: 2, cls: 'q2', icon: '📅', label: 'Schedule',   sub: 'Important, Not Urgent' },
    { id: 3, cls: 'q3', icon: '⚡', label: 'Quick Wins', sub: 'Urgent, Not Important' },
    { id: 4, cls: 'q4', icon: '🌙', label: 'Eliminate',  sub: 'Neither'               }
  ],

  ROUTINE_IMPORTANT: new Set(['Work', 'Learning', 'Health', 'Fitness', 'Mind', 'Reflection']),
  ROUTINE_URGENT:    new Set(['Daily']),

  // Milestones beyond this horizon are not shown — keeps the matrix focused.
  MILESTONE_HORIZON_DAYS: 60,
  MILESTONE_URGENT_DAYS:  14,

  _quadrantFor(important, urgent) {
    if (important && urgent)  return 1;
    if (important && !urgent) return 2;
    if (!important && urgent) return 3;
    return 4;
  },

  _fromTasks() {
    return TasksTracker._tasks()
      .filter(t => !t.done)
      .map(t => {
        const daysUntil = t.dueDate
          ? Math.floor((new Date(t.dueDate) - new Date()) / 86400000)
          : null;
        const important = t.priority === 'urgent' || t.priority === 'high';
        const urgent     = t.priority === 'urgent' || (daysUntil != null && daysUntil <= 2);
        const due        = t.dueDate ? TasksTracker._dueMeta(t.dueDate) : null;
        return {
          id: `task-${t.id}`,
          title: t.title,
          source: 'task',
          meta: due ? due.label : '',
          quadrant: this._quadrantFor(important, urgent),
          action: { type: 'task', tid: t.id },
          nav: 'tasks'
        };
      });
  },

  _fromRoutine() {
    const scheduleKey = AppState.getScheduleKey();
    const sched       = SCHEDULE_DATA[scheduleKey] || [];
    const dateKey     = AppState.getDateKey();

    return sched
      .map((item, i) => ({ item, i }))
      .filter(({ i }) => !AppState.checkedItems[`${dateKey}-${i}`])
      .map(({ item, i }) => {
        const important = this.ROUTINE_IMPORTANT.has(item.category);
        const urgent    = this.ROUTINE_URGENT.has(item.category);
        return {
          id: `routine-${i}`,
          title: item.activity,
          source: 'routine',
          meta: item.time,
          quadrant: this._quadrantFor(important, urgent),
          action: { type: 'routine', key: `${dateKey}-${i}` },
          nav: 'today'
        };
      });
  },

  _fromMilestones() {
    const today = new Date();
    return MILESTONES
      .filter(m => !m.done)
      .map(m => {
        const daysUntil = Math.ceil((new Date(m.date) - today) / 86400000);
        if (daysUntil < 0 || daysUntil > this.MILESTONE_HORIZON_DAYS) return null;
        const urgent = daysUntil <= this.MILESTONE_URGENT_DAYS;
        return {
          id: `milestone-${m.label}`,
          title: m.label,
          source: 'milestone',
          meta: daysUntil === 0 ? 'Today' : `${daysUntil}d`,
          quadrant: this._quadrantFor(true, urgent),
          action: null,
          nav: 'today'
        };
      })
      .filter(Boolean);
  },

  SOURCE_ICONS: { task: '📋', routine: '🗓️', milestone: '🏁' },

  categorize() {
    const all = [...this._fromTasks(), ...this._fromRoutine(), ...this._fromMilestones()];
    const out = { 1: [], 2: [], 3: [], 4: [] };
    all.forEach(item => out[item.quadrant].push(item));
    return out;
  },

  render() {
    const groups = this.categorize();

    this.QUADRANTS.forEach(q => {
      const list  = document.getElementById(`matrixQ${q.id}`);
      const count = document.getElementById(`matrixCount${q.id}`);
      if (!list) return;

      const items = groups[q.id];
      if (count) count.textContent = items.length;

      list.innerHTML = items.length
        ? items.map(it => `
          <div class="matrix-item" data-source="${it.source}" data-nav="${it.nav}">
            ${it.action
              ? `<input type="checkbox" class="matrix-item-cb" data-action='${esc(JSON.stringify(it.action))}' title="Mark done">`
              : `<span class="matrix-item-icon">${this.SOURCE_ICONS[it.source]}</span>`}
            <span class="matrix-item-title">${esc(it.title)}</span>
            ${it.meta ? `<span class="matrix-item-meta">${esc(it.meta)}</span>` : ''}
          </div>`).join('')
        : `<div class="matrix-empty">Nothing here 🎉</div>`;
    });

    this._bindEvents();
  },

  _bindEvents() {
    document.querySelectorAll('.matrix-item-cb').forEach(cb => {
      cb.addEventListener('change', (e) => {
        e.stopPropagation();
        const action = JSON.parse(cb.dataset.action);
        if (action.type === 'task')    this._completeTask(action.tid);
        if (action.type === 'routine') this._completeRoutine(action.key);
      });
    });

    document.querySelectorAll('.matrix-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.classList.contains('matrix-item-cb')) return;
        UI._navigateToTab(el.dataset.nav);
      });
    });
  },

  _completeTask(tid) {
    const t = (AppState.tasks || []).find(x => x.id === tid);
    if (!t) return;
    t.done        = true;
    t.completedAt = new Date().toISOString();
    t.modifiedAt  = new Date().toISOString();
    AppState.save();
    UI.updateAll();
  },

  _completeRoutine(key) {
    AppState.toggleActivity(key, true);
    UI.updateAll();
  }
};
