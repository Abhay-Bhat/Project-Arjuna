// ============================================================
// Skadi — Inline Subject/Activity Creation
// A "+" affordance next to any subject/activity <select> that
// opens a popover with a name field + curated icon grid.
// ============================================================

const SubjectActivityPicker = {

  ICONS_SUBJECT: ['🏛️','🌍','⚖️','📈','🔬','🌿','🧭','🌐','🛡️','🤝','🎨','⛑️','🧮','📰','✍️','🎯','📚','💻','☁️','🐳','🔐','📊','🖥️','🧠'],
  ICONS_ACTIVITY: ['🌳','🌲','🌿','🍀','🌵','🎋','🌸','📖','📝','🎧','💻','🧪','🗂️','🔁','📌','🌱'],

  _esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },

  // opts: { kind: 'subject'|'activity', getList(), addItem(label,emoji,color) -> newId, afterAdd(newId) }
  attach(selectEl, opts) {
    if (!selectEl) return;
    selectEl._sacOpts = opts;
    if (selectEl.dataset.sacAttached) return;
    selectEl.dataset.sacAttached = '1';

    const wrap = document.createElement('div');
    wrap.className = 'sac-select-wrap';
    selectEl.parentNode.insertBefore(wrap, selectEl);
    wrap.appendChild(selectEl);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sac-add-btn';
    btn.title = `Add new ${opts.kind}`;
    btn.textContent = '+';
    wrap.appendChild(btn);

    btn.addEventListener('click', e => {
      e.stopPropagation();
      this._openPopover(selectEl, btn);
    });
  },

  _openPopover(selectEl, btn) {
    document.querySelectorAll('.sac-popover').forEach(p => p.remove());
    const opts = selectEl._sacOpts;
    if (!opts) return;

    const icons = opts.kind === 'subject' ? this.ICONS_SUBJECT : this.ICONS_ACTIVITY;
    const pop = document.createElement('div');
    pop.className = 'sac-popover';
    pop.innerHTML = `
      <input class="sac-name-input" placeholder="${opts.kind === 'subject' ? 'Subject name' : 'Activity name'}" maxlength="60">
      <div class="sac-icon-grid">
        ${icons.map(ic => `<button type="button" class="sac-icon-btn" data-icon="${ic}">${ic}</button>`).join('')}
      </div>
      ${opts.kind === 'subject' ? '<input type="color" class="sac-color-input" value="#5b7fff">' : ''}
      <div class="sac-popover-actions">
        <button type="button" class="btn btn-xs btn-primary sac-save-btn">+ Add</button>
        <button type="button" class="btn btn-xs sac-cancel-btn">Cancel</button>
      </div>`;
    btn.after(pop);

    // The CSS anchor (right:0) overflows past the left edge when the
    // trigger button sits near a narrow phone's left side — clamp it
    // back on-screen.
    const margin = 8;
    const rect = pop.getBoundingClientRect();
    if (rect.left < margin) {
      pop.style.right = 'auto';
      pop.style.left = '0';
      const reRect = pop.getBoundingClientRect();
      if (reRect.right > window.innerWidth - margin) {
        pop.style.width = Math.max(200, window.innerWidth - reRect.left - margin) + 'px';
      }
    }

    let selectedIcon = icons[0];
    pop.querySelectorAll('.sac-icon-btn').forEach(ib => {
      ib.addEventListener('click', () => {
        pop.querySelectorAll('.sac-icon-btn').forEach(x => x.classList.remove('selected'));
        ib.classList.add('selected');
        selectedIcon = ib.dataset.icon;
      });
    });
    pop.querySelector('.sac-icon-btn')?.classList.add('selected');

    const nameInput = pop.querySelector('.sac-name-input');
    nameInput.focus();

    const close = () => {
      pop.remove();
      document.removeEventListener('mousedown', outsideClick);
    };

    const save = () => {
      const label = nameInput.value.trim();
      if (!label) { nameInput.focus(); return; }
      const color = opts.kind === 'subject' ? (pop.querySelector('.sac-color-input')?.value || '#5b7fff') : undefined;
      const newId = opts.addItem(label, selectedIcon, color);
      close();
      opts.afterAdd(newId);
    };

    pop.querySelector('.sac-save-btn').addEventListener('click', save);
    pop.querySelector('.sac-cancel-btn').addEventListener('click', close);
    nameInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') save();
      if (e.key === 'Escape') close();
    });

    const outsideClick = e => {
      if (!pop.contains(e.target) && e.target !== btn) close();
    };
    setTimeout(() => document.addEventListener('mousedown', outsideClick), 0);
  },
};
