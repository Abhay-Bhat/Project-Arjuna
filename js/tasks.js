// ============================================================
// ATHENA — Tasks (Microsoft Planner-style board)
// Buckets as columns, tasks with priority + due date + checkbox.
// ============================================================

const TasksTracker = {

  // ── Priority config ──────────────────────────────────────
  PRIORITIES: [
    { value: 'urgent', label: 'Urgent', color: 'var(--accent-rose)',   icon: '🔴' },
    { value: 'high',   label: 'High',   color: 'var(--accent-amber)',  icon: '🟠' },
    { value: 'medium', label: 'Medium', color: 'var(--accent-blue)',   icon: '🔵' },
    { value: 'low',    label: 'Low',    color: 'var(--accent-green)',  icon: '🟢' },
  ],

  BUCKET_COLORS: [
    '#5b7fff', '#00d4c8', '#ff9933', '#ff5c80',
    '#a56eff', '#00d47c', '#ffc107', '#ff6b6b',
  ],

  // ── Entry point called by UI ─────────────────────────────
  render() {
    this._renderBoard();
    this._renderStats();
    this._bindFilters();
  },

  // ── Helpers ──────────────────────────────────────────────
  _buckets()  { return AppState.taskBuckets || []; },
  _tasks()    { return AppState.tasks       || []; },

  _priorityMeta(value) {
    return this.PRIORITIES.find(p => p.value === value) || this.PRIORITIES[2];
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

  _activeFilter() {
    return {
      priority: document.getElementById('taskFilterPriority')?.value || 'all',
      due:      document.getElementById('taskFilterDue')?.value      || 'all',
    };
  },

  _filterTasks(tasks) {
    const { priority, due } = this._activeFilter();
    const now = new Date();
    return tasks.filter(t => {
      if (priority !== 'all' && t.priority !== priority) return false;
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

  // ── Stats strip ──────────────────────────────────────────
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

  // ── Board (buckets + tasks) ───────────────────────────────
  _renderBoard() {
    const board = document.getElementById('tasksBoard');
    if (!board) return;

    const buckets  = this._buckets();
    const allTasks = this._tasks();

    if (!buckets.length) {
      board.innerHTML = `
        <div class="tasks-empty">
          <div style="font-size:48px;margin-bottom:12px;">📋</div>
          <div style="font-size:16px;font-weight:600;color:var(--text);margin-bottom:6px;">No buckets yet</div>
          <div style="font-size:13px;color:var(--text-muted);">Type a name below and click <strong>+ Create Bucket</strong> to get started.</div>
        </div>`;
    } else {
      board.innerHTML = buckets.map(bucket => {
        const bucketTasks  = allTasks.filter(t => t.bucketId === bucket.id);
        const activeTasks  = bucketTasks.filter(t => !t.done);
        const doneTasks    = bucketTasks.filter(t => t.done);
        const filtered     = this._filterTasks(activeTasks);
        const col          = bucket.color || this.BUCKET_COLORS[0];
        const completedHtml = doneTasks.length ? `
          <details class="task-completed-section" id="taskCompleted-${bucket.id}">
            <summary class="task-completed-header">
              <span class="task-completed-label">✓ Completed</span>
              <span class="task-count-badge">${doneTasks.length}</span>
            </summary>
            <div class="task-completed-list">
              ${doneTasks.map(t => this._taskHTML(t)).join('')}
            </div>
          </details>` : '';
        return `
          <div class="task-bucket" data-bucket-id="${bucket.id}">
            <div class="task-bucket-header" style="border-top:3px solid ${col};">
              <div class="task-bucket-title-row">
                <span class="task-bucket-drag-handle" draggable="true" data-bid="${bucket.id}" title="Drag to reorder bucket">⠿</span>
                <input class="task-bucket-title-input" value="${this._esc(bucket.title)}"
                       data-bid="${bucket.id}" placeholder="Bucket name" title="Click to rename">
                <div style="display:flex;align-items:center;gap:4px;">
                  <span class="task-count-badge">${activeTasks.length} / ${bucketTasks.length}</span>
                  <button class="task-bucket-del btn btn-xs" data-bid="${bucket.id}" title="Delete bucket">✕</button>
                </div>
              </div>
            </div>
            <div class="task-list" id="taskList-${bucket.id}">
              ${filtered.length ? filtered.map(t => this._taskHTML(t)).join('') : '<div class="task-list-empty">No active tasks</div>'}
            </div>
            ${completedHtml}
            <div class="task-add-area" id="taskAddArea-${bucket.id}" style="display:none;">
              <input class="task-add-input" id="taskAddInput-${bucket.id}" placeholder="Task title…" maxlength="200">
              <div class="task-add-fields">
                <input type="date" class="task-add-date" id="taskAddDate-${bucket.id}" title="Due date">
                <select class="task-add-pri" id="taskAddPri-${bucket.id}" title="Priority">
                  ${this.PRIORITIES.map(p => `<option value="${p.value}">${p.icon} ${p.label}</option>`).join('')}
                </select>
              </div>
              <div class="task-add-actions">
                <button class="btn btn-xs btn-primary task-add-save" data-bid="${bucket.id}">Add Task</button>
                <button class="btn btn-xs task-add-cancel" data-bid="${bucket.id}">Cancel</button>
              </div>
            </div>
            <button class="task-add-btn" data-bid="${bucket.id}">+ Add task</button>
          </div>`;
      }).join('');
    }

    // Always add "new bucket" card at the end
    board.innerHTML += `
      <div class="task-bucket task-bucket-new" id="taskNewBucketCard">
        <div class="task-new-bucket-inner">
          <input class="task-new-bucket-input" id="taskNewBucketInput" placeholder="Bucket name…" maxlength="80">
          <div class="task-new-bucket-colors">
            ${this.BUCKET_COLORS.map(c => `<button class="task-color-dot" data-color="${c}" style="background:${c};" title="${c}"></button>`).join('')}
          </div>
          <button class="btn btn-primary btn-xs" id="taskNewBucketSave" style="margin-top:8px;width:100%;">+ Create Bucket</button>
        </div>
      </div>`;

    this._bindBoardEvents();
    this._bindDragDrop(board);
  },

  _taskHTML(t) {
    const pri = this._priorityMeta(t.priority);
    const due = this._dueMeta(t.dueDate);
    return `
      <div class="task-item${t.done ? ' task-done' : ''}" data-tid="${t.id}" draggable="true">
        <label class="task-checkbox-wrap" title="${t.done ? 'Mark incomplete' : 'Mark complete'}">
          <input type="checkbox" class="task-cb" data-tid="${t.id}" ${t.done ? 'checked' : ''}>
          <span class="task-cb-visual"></span>
        </label>
        <div class="task-body">
          <div class="task-title">${this._esc(t.title)}</div>
          <div class="task-meta">
            <span class="task-pri-dot" style="background:${pri.color};" title="Priority: ${pri.label}"></span>
            <span class="task-pri-label" style="color:${pri.color};">${pri.label}</span>
            ${due ? `<span class="task-due-badge ${due.cls}" title="Due: ${t.dueDate}">${due.label}</span>` : ''}
          </div>
        </div>
        <button class="task-edit-btn" data-edit-tid="${t.id}" title="Edit task">✏️</button>
        <button class="task-del-btn" data-tid="${t.id}" title="Delete task">🗑</button>
      </div>`;
  },

  _esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },

  // ── Inline task editor ────────────────────────────────────
  _openEditTask(tid) {
    // Close any other open edit areas
    document.querySelectorAll('.task-edit-area').forEach(a => a.remove());
    document.querySelectorAll('.task-item-editing').forEach(el => el.classList.remove('task-item-editing'));

    const t = (AppState.tasks || []).find(x => x.id === tid);
    if (!t) return;
    const el = document.querySelector(`.task-item[data-tid="${tid}"]`);
    if (!el) return;

    el.classList.add('task-item-editing');

    const editDiv = document.createElement('div');
    editDiv.className = 'task-edit-area';
    editDiv.innerHTML = `
      <input class="task-edit-title" value="${this._esc(t.title)}" placeholder="Task title" maxlength="200">
      <div class="task-edit-fields">
        <input type="date" class="task-edit-date" value="${this._esc(t.dueDate || '')}" title="Due date">
        <select class="task-edit-pri" title="Priority">
          ${this.PRIORITIES.map(p => `<option value="${p.value}" ${t.priority === p.value ? 'selected' : ''}>${p.icon} ${p.label}</option>`).join('')}
        </select>
        <select class="task-edit-bucket" title="Move to bucket">
          ${(AppState.taskBuckets || []).map(b => `<option value="${b.id}" ${t.bucketId === b.id ? 'selected' : ''}>${this._esc(b.title)}</option>`).join('')}
        </select>
      </div>
      <div class="task-edit-actions">
        <button class="btn btn-xs btn-primary task-edit-save">Save</button>
        <button class="btn btn-xs task-edit-cancel">Cancel</button>
      </div>`;

    el.after(editDiv);
    const titleInput = editDiv.querySelector('.task-edit-title');
    titleInput.focus();
    titleInput.select();

    const save = () => {
      const newTitle = editDiv.querySelector('.task-edit-title').value.trim();
      if (!newTitle) { editDiv.querySelector('.task-edit-title').focus(); return; }
      t.title    = newTitle;
      t.dueDate  = editDiv.querySelector('.task-edit-date').value   || '';
      t.priority = editDiv.querySelector('.task-edit-pri').value;
      t.bucketId = parseInt(editDiv.querySelector('.task-edit-bucket').value);
      AppState.save();
      this.render();
      UI.showToast('✅ Task updated');
    };

    const cancel = () => {
      editDiv.remove();
      el.classList.remove('task-item-editing');
    };

    editDiv.querySelector('.task-edit-save').addEventListener('click', save);
    editDiv.querySelector('.task-edit-cancel').addEventListener('click', cancel);
    titleInput.addEventListener('keydown', e => {
      if (e.key === 'Enter')  save();
      if (e.key === 'Escape') cancel();
    });
  },

  // ── Event binding ─────────────────────────────────────────
  _bindBoardEvents() {
    const board = document.getElementById('tasksBoard');
    if (!board) return;

    // Checkbox toggle
    board.querySelectorAll('.task-cb').forEach(cb => {
      cb.addEventListener('change', () => {
        const id = parseInt(cb.dataset.tid);
        const t  = (AppState.tasks || []).find(x => x.id === id);
        if (t) { t.done = cb.checked; AppState.save(); this.render(); }
      });
    });

    // Edit task
    board.querySelectorAll('.task-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => this._openEditTask(parseInt(btn.dataset.editTid)));
    });

    // Delete task
    board.querySelectorAll('.task-del-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('Delete this task?')) return;
        AppState.tasks = (AppState.tasks || []).filter(t => t.id !== parseInt(btn.dataset.tid));
        AppState.save();
        this.render();
      });
    });

    // Show add-task area
    board.querySelectorAll('.task-add-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const bid   = btn.dataset.bid;
        const area  = document.getElementById(`taskAddArea-${bid}`);
        const input = document.getElementById(`taskAddInput-${bid}`);
        if (area) { area.style.display = 'block'; btn.style.display = 'none'; }
        if (input) { input.focus(); }
      });
    });

    // Cancel add-task
    board.querySelectorAll('.task-add-cancel').forEach(btn => {
      btn.addEventListener('click', () => {
        const bid    = btn.dataset.bid;
        const area   = document.getElementById(`taskAddArea-${bid}`);
        const addBtn = board.querySelector(`.task-add-btn[data-bid="${bid}"]`);
        if (area)   { area.style.display = 'none'; }
        if (addBtn) addBtn.style.display = '';
      });
    });

    // Save new task
    board.querySelectorAll('.task-add-save').forEach(btn => {
      btn.addEventListener('click', () => this._saveNewTask(btn.dataset.bid));
    });

    // Enter / Escape in add input
    board.querySelectorAll('.task-add-input').forEach(inp => {
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') this._saveNewTask(inp.id.replace('taskAddInput-', ''));
        if (e.key === 'Escape') {
          const bid    = inp.id.replace('taskAddInput-', '');
          const area   = document.getElementById(`taskAddArea-${bid}`);
          const addBtn = board.querySelector(`.task-add-btn[data-bid="${bid}"]`);
          if (area)   area.style.display = 'none';
          if (addBtn) addBtn.style.display = '';
        }
      });
    });

    // Rename bucket
    board.querySelectorAll('.task-bucket-title-input').forEach(inp => {
      inp.addEventListener('blur', () => {
        const bid    = parseInt(inp.dataset.bid);
        const bucket = (AppState.taskBuckets || []).find(b => b.id === bid);
        if (bucket && inp.value.trim()) {
          bucket.title = inp.value.trim();
          AppState.save();
        }
      });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') inp.blur(); });
    });

    // Delete bucket
    board.querySelectorAll('.task-bucket-del').forEach(btn => {
      btn.addEventListener('click', () => {
        const bid = parseInt(btn.dataset.bid);
        const bkt = (AppState.taskBuckets || []).find(b => b.id === bid);
        const cnt = (AppState.tasks || []).filter(t => t.bucketId === bid).length;
        const msg = cnt
          ? `Delete bucket "${bkt?.title}"? This will also delete ${cnt} task${cnt > 1 ? 's' : ''}.`
          : `Delete bucket "${bkt?.title}"?`;
        if (!confirm(msg)) return;
        AppState.taskBuckets = (AppState.taskBuckets || []).filter(b => b.id !== bid);
        AppState.tasks       = (AppState.tasks       || []).filter(t => t.bucketId !== bid);
        AppState.save();
        this.render();
      });
    });

    // Color dot selector for new bucket
    let selectedColor = this.BUCKET_COLORS[0];
    board.querySelectorAll('.task-color-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        board.querySelectorAll('.task-color-dot').forEach(d => d.classList.remove('selected'));
        dot.classList.add('selected');
        selectedColor = dot.dataset.color;
      });
    });
    const firstDot = board.querySelector('.task-color-dot');
    if (firstDot) firstDot.classList.add('selected');

    // Create new bucket
    const saveNewBucket = () => {
      const inp   = document.getElementById('taskNewBucketInput');
      const title = inp?.value.trim();
      if (!title) { inp?.focus(); return; }
      AppState.taskBuckets = AppState.taskBuckets || [];
      AppState.taskBuckets.push({ id: Date.now(), title, color: selectedColor });
      AppState.save();
      this.render();
    };

    document.getElementById('taskNewBucketSave')?.addEventListener('click', saveNewBucket);
    document.getElementById('taskNewBucketInput')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') saveNewBucket();
    });
  },

  // ── Drag and drop (tasks between buckets, bucket reorder) ─
  _bindDragDrop(board) {
    let dragTaskId   = null;
    let dragBucketId = null;

    const clearTaskDragStyles = () => {
      board.querySelectorAll('.task-dragging').forEach(el => el.classList.remove('task-dragging'));
      board.querySelectorAll('.task-list-dragover').forEach(el => el.classList.remove('task-list-dragover'));
      board.querySelectorAll('.task-drop-before').forEach(el => el.classList.remove('task-drop-before'));
    };

    const clearBucketDragStyles = () => {
      board.querySelectorAll('.bucket-dragging').forEach(el => el.classList.remove('bucket-dragging'));
      board.querySelectorAll('.bucket-dragover-left,.bucket-dragover-right').forEach(el => {
        el.classList.remove('bucket-dragover-left', 'bucket-dragover-right');
      });
    };

    // ── Task item drag ──────────────────────────────────────
    board.querySelectorAll('.task-item').forEach(el => {
      el.addEventListener('dragstart', e => {
        // Don't drag if interaction started from a button/checkbox/input
        if (e.target.closest('button, input, label')) { e.preventDefault(); return; }
        dragTaskId   = parseInt(el.dataset.tid);
        dragBucketId = null;
        setTimeout(() => el.classList.add('task-dragging'), 0);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(dragTaskId));
      });

      el.addEventListener('dragend', () => {
        clearTaskDragStyles();
        dragTaskId = null;
      });

      // Show "insert before" indicator when hovering over another task
      el.addEventListener('dragover', e => {
        if (dragTaskId == null) return;
        e.preventDefault();
        e.stopPropagation(); // prevent task-list handler from also running
        e.dataTransfer.dropEffect = 'move';
        board.querySelectorAll('.task-drop-before').forEach(i => i.classList.remove('task-drop-before'));
        const rect = el.getBoundingClientRect();
        if (e.clientY < rect.top + rect.height / 2) {
          el.classList.add('task-drop-before');
        }
        // Mark the containing task-list as dragover for styling
        const list = el.closest('.task-list');
        if (list) list.classList.add('task-list-dragover');
      });

      el.addEventListener('dragleave', () => {
        el.classList.remove('task-drop-before');
      });

      // Drop: insert before or after the target task
      el.addEventListener('drop', e => {
        e.preventDefault();
        e.stopPropagation();
        if (dragTaskId == null) return;
        const targetTid = parseInt(el.dataset.tid);
        if (dragTaskId === targetTid) { clearTaskDragStyles(); return; }

        const tasks    = AppState.tasks || [];
        const fromIdx  = tasks.findIndex(t => t.id === dragTaskId);
        if (fromIdx === -1) return;

        const [dragged] = tasks.splice(fromIdx, 1);
        // Update bucket if dropped in a different column
        const targetBid = parseInt(el.closest('.task-bucket')?.dataset.bucketId);
        if (targetBid) dragged.bucketId = targetBid;

        const rect        = el.getBoundingClientRect();
        const insertBefore = e.clientY < rect.top + rect.height / 2;
        const newToIdx    = tasks.findIndex(t => t.id === targetTid);
        tasks.splice(insertBefore ? newToIdx : newToIdx + 1, 0, dragged);

        AppState.tasks = tasks;
        AppState.save();
        this.render();
        dragTaskId = null;
      });
    });

    // ── Task-list drop zone (drop at end of a bucket) ───────
    board.querySelectorAll('.task-list').forEach(list => {
      const bid = parseInt(list.id.replace('taskList-', ''));

      list.addEventListener('dragover', e => {
        if (dragTaskId == null) return;
        if (e.target.closest('.task-item')) return; // handled by item
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        list.classList.add('task-list-dragover');
      });

      list.addEventListener('dragleave', e => {
        if (!list.contains(e.relatedTarget)) list.classList.remove('task-list-dragover');
      });

      list.addEventListener('drop', e => {
        e.preventDefault();
        list.classList.remove('task-list-dragover');
        if (dragTaskId == null) return;
        if (e.target.closest('.task-item')) return; // handled by item drop

        const t = (AppState.tasks || []).find(x => x.id === dragTaskId);
        if (t) {
          t.bucketId = bid;
          // Move to end of this bucket's tasks
          AppState.tasks = [...(AppState.tasks || []).filter(x => x.id !== t.id), t];
          AppState.save();
          this.render();
        }
        dragTaskId = null;
      });
    });

    // ── Bucket drag handle ──────────────────────────────────
    board.querySelectorAll('.task-bucket-drag-handle').forEach(handle => {
      const bid = parseInt(handle.dataset.bid);
      const col = handle.closest('.task-bucket');
      if (!col) return;

      handle.addEventListener('dragstart', e => {
        dragBucketId = bid;
        dragTaskId   = null;
        // Use the whole bucket column as the drag image
        e.dataTransfer.setDragImage(col, 30, 20);
        setTimeout(() => col.classList.add('bucket-dragging'), 0);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', 'bucket:' + bid);
        e.stopPropagation();
      });

      handle.addEventListener('dragend', () => {
        clearBucketDragStyles();
        dragBucketId = null;
      });
    });

    // ── Bucket drop targets ─────────────────────────────────
    board.querySelectorAll('.task-bucket[data-bucket-id]').forEach(col => {
      const bid = parseInt(col.dataset.bucketId);

      col.addEventListener('dragover', e => {
        if (dragBucketId == null || dragBucketId === bid) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        clearBucketDragStyles();
        col.querySelector('.bucket-dragging')?.classList.remove('bucket-dragging'); // keep source dim
        const rect = col.getBoundingClientRect();
        col.classList.add(e.clientX < rect.left + rect.width / 2 ? 'bucket-dragover-left' : 'bucket-dragover-right');
      });

      col.addEventListener('dragleave', e => {
        if (!col.contains(e.relatedTarget)) {
          col.classList.remove('bucket-dragover-left', 'bucket-dragover-right');
        }
      });

      col.addEventListener('drop', e => {
        e.preventDefault();
        col.classList.remove('bucket-dragover-left', 'bucket-dragover-right');
        if (dragBucketId == null || dragBucketId === bid) return;

        const buckets = AppState.taskBuckets || [];
        const fromIdx = buckets.findIndex(b => b.id === dragBucketId);
        if (fromIdx === -1) return;
        const [moved]  = buckets.splice(fromIdx, 1);
        const rect     = col.getBoundingClientRect();
        const toIdx    = buckets.findIndex(b => b.id === bid);
        const insertBefore = e.clientX < rect.left + rect.width / 2;
        buckets.splice(insertBefore ? toIdx : toIdx + 1, 0, moved);

        AppState.taskBuckets = buckets;
        AppState.save();
        this.render();
        dragBucketId = null;
      });
    });
  },

  _saveNewTask(bid) {
    const titleEl = document.getElementById(`taskAddInput-${bid}`);
    const dateEl  = document.getElementById(`taskAddDate-${bid}`);
    const priEl   = document.getElementById(`taskAddPri-${bid}`);
    const title   = titleEl?.value.trim();
    if (!title) { titleEl?.focus(); return; }
    AppState.tasks = AppState.tasks || [];
    AppState.tasks.push({
      id:        Date.now(),
      bucketId:  parseInt(bid),
      title,
      dueDate:   dateEl?.value  || '',
      priority:  priEl?.value   || 'medium',
      done:      false,
      createdAt: new Date().toISOString(),
    });
    AppState.save();
    this.render();
    UI.showToast('✅ Task added');
  },

  // ── Filter bar bindings ───────────────────────────────────
  _bindFilters() {
    const rerender = () => this._renderBoard();
    document.getElementById('taskFilterPriority')?.addEventListener('change', rerender);
    document.getElementById('taskFilterDue')?.addEventListener('change',      rerender);
  },
};
