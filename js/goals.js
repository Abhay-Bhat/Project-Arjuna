// ============================================================
// Skadi — SMART Goals Tracker (Planning tab)
// Specific / Measurable / Achievable / Relevant / Time-bound
// goals, with optional milestone checklists driving progress.
// ============================================================

const GoalsTracker = {

  DOMAINS: [
    { value: 'upsc',     label: 'UPSC',     icon: '📚', cls: 'upsc'    },
    { value: 'career',   label: 'Career',   icon: '💻', cls: 'growth'  },
    { value: 'finance',  label: 'Finance',  icon: '💰', cls: 'finance' },
    { value: 'health',   label: 'Health',   icon: '❤️', cls: 'health'  },
    { value: 'personal', label: 'Personal', icon: '🧠', cls: 'mind'    }
  ],

  SMART_FIELDS: [
    { key: 'specific',   label: 'S — Specific'   },
    { key: 'measurable', label: 'M — Measurable' },
    { key: 'achievable', label: 'A — Achievable' },
    { key: 'relevant',   label: 'R — Relevant'   },
    { key: 'timebound',  label: 'T — Time-bound' }
  ],

  // UPSC syllabus total used for the domain card + linked-goal progress.
  UPSC_SYLLABUS_TOTAL: 586,

  _workingMilestones: [],

  // ── Entry point called by UI ─────────────────────────────
  render() {
    this._bindModal();
    const grid = document.getElementById('goalsGrid');
    if (!grid) return;

    const goals = this._goals();
    grid.innerHTML = goals.length
      ? goals.map(g => this._goalCardHTML(g)).join('')
      : `<div class="goals-empty">No goals yet — click "+ New Goal" to set your first SMART goal.</div>`;

    this._bindCardEvents();
  },

  // ── Helpers ──────────────────────────────────────────────
  _goals() {
    return (AppState.goals || [])
      .filter(g => !g.deleted)
      .sort((a, b) => {
        if (a.targetDate && b.targetDate) return a.targetDate.localeCompare(b.targetDate);
        if (a.targetDate) return -1;
        if (b.targetDate) return 1;
        return (a.createdAt || '').localeCompare(b.createdAt || '');
      });
  },

  _domainMeta(domain) {
    return this.DOMAINS.find(d => d.value === domain) || this.DOMAINS[this.DOMAINS.length - 1];
  },

  _upscSyllabusPct() {
    const done = Object.values(AppState.upscSubjectProgress || {}).reduce((s, n) => s + n, 0);
    return Math.round((done / this.UPSC_SYLLABUS_TOTAL) * 100);
  },

  // Milestones (if any) drive progress. UPSC goals with no milestones stay
  // synced to live UPSC syllabus progress. Everything else falls back to
  // the manually-set progress value.
  _progress(goal) {
    if (goal.milestones && goal.milestones.length) {
      const done = goal.milestones.filter(m => m.done).length;
      return Math.round((done / goal.milestones.length) * 100);
    }
    if (goal.domain === 'upsc') return this._upscSyllabusPct();
    return goal.progress || 0;
  },

  // Average progress across non-completed goals — feeds the Today domain card.
  _avgProgress() {
    const goals = this._goals().filter(g => this._progress(g) < 100);
    if (!goals.length) return 0;
    return Math.round(goals.reduce((s, g) => s + this._progress(g), 0) / goals.length);
  },

  // ── Card rendering ────────────────────────────────────────
  _goalCardHTML(g) {
    const dm  = this._domainMeta(g.domain);
    const pct = this._progress(g);
    const linked = g.domain === 'upsc' && !(g.milestones && g.milestones.length);

    const daysLeft = g.targetDate ? Math.ceil((new Date(g.targetDate) - new Date()) / 86400000) : null;
    const dueLabel = daysLeft == null ? ''
      : daysLeft < 0  ? `⚠️ Overdue ${Math.abs(daysLeft)}d`
      : daysLeft === 0 ? 'Due today'
      : `${daysLeft}d left`;

    const smartRows = this.SMART_FIELDS
      .filter(f => g[f.key])
      .map(f => `<div class="goal-smart-row"><span class="goal-smart-label">${f.label}</span><span class="goal-smart-value">${esc(g[f.key])}</span></div>`)
      .join('');

    const milestonesHtml = (g.milestones && g.milestones.length) ? `
      <div class="goal-milestones">
        ${g.milestones.map(m => `
          <label class="goal-milestone-row">
            <input type="checkbox" class="goal-milestone-cb" data-gid="${g.id}" data-mid="${esc(String(m.id))}" ${m.done ? 'checked' : ''}>
            <span class="${m.done ? 'goal-milestone-done' : ''}">${esc(m.label)}</span>
          </label>`).join('')}
      </div>` : '';

    return `
      <div class="goal-card ${dm.cls}${pct >= 100 ? ' goal-complete' : ''}" data-gid="${g.id}">
        <div class="goal-card-header">
          <span class="goal-domain-badge">${dm.icon} ${dm.label}</span>
          <div class="goal-card-actions">
            <button class="goal-edit-btn" data-gid="${g.id}" title="Edit goal">✏️</button>
            <button class="goal-del-btn" data-gid="${g.id}" title="Delete goal">🗑</button>
          </div>
        </div>
        <div class="goal-title">${esc(g.title)}${pct >= 100 ? ' ✅' : ''}</div>
        <div class="goal-progress-bar"><div class="goal-progress-fill" style="width:${pct}%"></div></div>
        <div class="goal-progress-meta">
          <span>${pct}%${linked ? ' · synced with UPSC syllabus' : ''}</span>
          ${dueLabel ? `<span class="goal-due${daysLeft < 0 ? ' goal-overdue' : ''}">${dueLabel}</span>` : ''}
        </div>
        ${smartRows ? `<details class="goal-smart"><summary>SMART breakdown</summary>${smartRows}</details>` : ''}
        ${milestonesHtml}
      </div>`;
  },

  _bindCardEvents() {
    document.querySelectorAll('.goal-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => this._openEditor(parseInt(btn.dataset.gid)));
    });
    document.querySelectorAll('.goal-del-btn').forEach(btn => {
      btn.addEventListener('click', () => this._delete(parseInt(btn.dataset.gid)));
    });
    document.querySelectorAll('.goal-milestone-cb').forEach(cb => {
      cb.addEventListener('change', () => {
        const g = (AppState.goals || []).find(x => x.id === parseInt(cb.dataset.gid));
        const m = g && (g.milestones || []).find(x => String(x.id) === cb.dataset.mid);
        if (!m) return;
        m.done = cb.checked;
        g.modifiedAt = new Date().toISOString();
        AppState.save();
        UI.updateAll();
      });
    });
  },

  _delete(id) {
    const g = (AppState.goals || []).find(x => x.id === id);
    if (!g) return;
    if (!confirm(`Delete goal "${g.title}"?`)) return;
    g.deleted    = true;
    g.deletedAt  = new Date().toISOString();
    g.modifiedAt = new Date().toISOString();
    AppState.save();
    UI.updateAll();
  },

  // ── Editor modal ──────────────────────────────────────────
  _openEditor(goalId) {
    const modal = document.getElementById('goalModal');
    if (!modal) return;
    const g = goalId != null ? (AppState.goals || []).find(x => x.id === goalId) : null;

    document.getElementById('goalModalTitle').textContent = g ? '✏️ Edit Goal' : '🎯 New Goal';
    document.getElementById('goalId').value          = g ? g.id : '';
    document.getElementById('goalTitle').value       = g?.title || '';
    document.getElementById('goalDomain').value      = g?.domain || 'upsc';
    document.getElementById('goalTargetDate').value  = g?.targetDate || '';
    document.getElementById('goalSpecific').value    = g?.specific || '';
    document.getElementById('goalMeasurable').value  = g?.measurable || '';
    document.getElementById('goalAchievable').value  = g?.achievable || '';
    document.getElementById('goalRelevant').value    = g?.relevant || '';
    document.getElementById('goalTimebound').value   = g?.timebound || '';

    const progress = g?.progress || 0;
    document.getElementById('goalProgress').value = progress;
    document.getElementById('goalProgressVal').textContent = progress;

    this._workingMilestones = (g?.milestones || []).map(m => ({ ...m }));
    this._renderMilestoneList();
    this._syncProgressRowVisibility();

    modal.classList.add('open');
    document.getElementById('goalTitle').focus();
  },

  _closeModal() {
    document.getElementById('goalModal')?.classList.remove('open');
  },

  _renderMilestoneList() {
    const el = document.getElementById('goalMilestoneList');
    if (!el) return;
    el.innerHTML = this._workingMilestones.length
      ? this._workingMilestones.map((m, i) => `
          <div class="goal-milestone-edit-row">
            <label class="goal-milestone-row">
              <input type="checkbox" class="goal-edit-milestone-cb" data-idx="${i}" ${m.done ? 'checked' : ''}>
              <span class="${m.done ? 'goal-milestone-done' : ''}">${esc(m.label)}</span>
            </label>
            <button class="goal-edit-milestone-del" data-idx="${i}" title="Remove milestone">✕</button>
          </div>`).join('')
      : `<div class="goal-milestone-empty">No milestones — progress will be set manually below.</div>`;

    el.querySelectorAll('.goal-edit-milestone-cb').forEach(cb => {
      cb.addEventListener('change', () => {
        this._workingMilestones[parseInt(cb.dataset.idx)].done = cb.checked;
        this._renderMilestoneList();
      });
    });
    el.querySelectorAll('.goal-edit-milestone-del').forEach(btn => {
      btn.addEventListener('click', () => {
        this._workingMilestones.splice(parseInt(btn.dataset.idx), 1);
        this._renderMilestoneList();
        this._syncProgressRowVisibility();
      });
    });
  },

  // Manual progress slider is irrelevant once milestones exist, or for
  // UPSC goals (auto-synced to syllabus progress) — hide it in those cases.
  _syncProgressRowVisibility() {
    const row = document.getElementById('goalProgressRow');
    if (!row) return;
    const domain = document.getElementById('goalDomain')?.value;
    const hasMilestones = this._workingMilestones.length > 0;
    const linked = domain === 'upsc' && !hasMilestones;
    row.style.display = (hasMilestones || linked) ? 'none' : '';
  },

  _save() {
    const title = document.getElementById('goalTitle').value.trim();
    if (!title) { UI.showToast('⚠️ Goal title is required'); return; }

    const id     = document.getElementById('goalId').value;
    const now    = new Date().toISOString();
    const fields = {
      title,
      domain:      document.getElementById('goalDomain').value,
      targetDate:  document.getElementById('goalTargetDate').value || '',
      specific:    document.getElementById('goalSpecific').value.trim(),
      measurable:  document.getElementById('goalMeasurable').value.trim(),
      achievable:  document.getElementById('goalAchievable').value.trim(),
      relevant:    document.getElementById('goalRelevant').value.trim(),
      timebound:   document.getElementById('goalTimebound').value.trim(),
      progress:    parseInt(document.getElementById('goalProgress').value) || 0,
      milestones:  this._workingMilestones,
      modifiedAt:  now
    };

    if (!AppState.goals) AppState.goals = [];

    if (id) {
      const g = AppState.goals.find(x => x.id === parseInt(id));
      if (g) Object.assign(g, fields);
    } else {
      AppState.goals.push({ id: Date.now(), ...fields, createdAt: now, deleted: false });
    }

    AppState.save();
    this._closeModal();
    UI.updateAll();
    UI.showToast('✅ Goal saved');
  },

  _bindModal() {
    const modal = document.getElementById('goalModal');
    if (!modal || modal.dataset.bound) return;
    modal.dataset.bound = '1';

    document.getElementById('goalSaveBtn')?.addEventListener('click', () => this._save());
    document.getElementById('goalCancelBtn')?.addEventListener('click', () => this._closeModal());
    modal.addEventListener('click', e => { if (e.target === modal) this._closeModal(); });

    document.getElementById('goalProgress')?.addEventListener('input', e => {
      document.getElementById('goalProgressVal').textContent = e.target.value;
    });
    document.getElementById('goalDomain')?.addEventListener('change', () => this._syncProgressRowVisibility());

    document.getElementById('goalMilestoneAddBtn')?.addEventListener('click', () => {
      const input = document.getElementById('goalMilestoneInput');
      const label = input.value.trim();
      if (!label) return;
      this._workingMilestones.push({ id: `m-${Date.now()}`, label, done: false });
      input.value = '';
      this._renderMilestoneList();
      this._syncProgressRowVisibility();
    });

    document.getElementById('goalAddBtn')?.addEventListener('click', () => this._openEditor(null));
  }
};
