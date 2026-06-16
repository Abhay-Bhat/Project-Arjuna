// ============================================================
// Skadi — Time Management Matrix (Eisenhower)
// Auto-categorizes Tasks into the Urgent/Important 2x2 grid.
// Routine and Milestones are excluded — they have dedicated
// sections on the Today tab and need no triage.
// ============================================================

const TimeMatrix = {

  QUADRANTS: [
    { id: 1, cls: 'q1', icon: '🔥', label: 'Do First',   sub: 'Urgent & Important'    },
    { id: 2, cls: 'q2', icon: '📅', label: 'Schedule',   sub: 'Important, Not Urgent' },
    { id: 3, cls: 'q3', icon: '⚡', label: 'Quick Wins', sub: 'Urgent, Not Important' },
    { id: 4, cls: 'q4', icon: '🌙', label: 'Eliminate',  sub: 'Neither'               }
  ],

  // Break/Hobby (meals, rest, family time, leisure) are treated as important —
  // they sustain health and wellbeing, so they belong in "Schedule" (protect
  // this time), never "Eliminate". Only ad-hoc low-priority Tasks should ever
  // land in Q4 — the daily routine itself is never something to cut.
  ROUTINE_IMPORTANT: new Set(['Work', 'Learning', 'Health', 'Fitness', 'Mind', 'Reflection', 'Break', 'Hobby']),
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
        const urgent    = t.priority === 'urgent' || (daysUntil != null && daysUntil <= 2);
        const due       = t.dueDate ? TasksTracker._dueMeta(t.dueDate) : null;
        // t.matrixQ (1-4) overrides auto-classification when manually pinned.
        const quadrant  = t.matrixQ ?? this._quadrantFor(important, urgent);
        return {
          id: `task-${t.id}`,
          title: t.title,
          source: 'task',
          meta: due ? due.label : '',
          quadrant,
          pinned: t.matrixQ != null,
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
          nav: 'today',
          scrollTo: 'scheduleContainer'
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
          nav: 'today',
          scrollTo: 'phaseHero'
        };
      })
      .filter(Boolean);
  },

  SOURCE_ICONS: { task: '📋', routine: '🗓️', milestone: '🏁' },

  categorize() {
    const all = [...this._fromTasks()];
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
        ? items.map((it, idx) => `
          <div class="matrix-item" style="--i:${idx}" data-source="${it.source}" data-nav="${it.nav}" data-scroll-to="${it.scrollTo || ''}">
            <input type="checkbox" class="matrix-item-cb" data-action='${esc(JSON.stringify(it.action))}' title="Mark done">
            ${it.pinned ? `<span class="matrix-item-pin" title="Pinned to this quadrant">📌</span>` : ''}
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
        const { nav, scrollTo } = el.dataset;
        // Matrix lives on the Today tab — if the target is the current
        // tab, just smooth-scroll to it instead of re-rendering in place.
        if (nav === AppState.currentTab && scrollTo) {
          document.getElementById(scrollTo)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          UI._navigateToTab(nav, scrollTo);
        }
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
