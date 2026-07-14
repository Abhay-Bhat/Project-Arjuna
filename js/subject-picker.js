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

    // Appended to <body> (not next to btn) so position:fixed placement
    // is always relative to the true viewport — a descendant of btn's
    // card could otherwise be clipped by an ancestor's overflow:hidden,
    // or have its containing block hijacked by an ancestor's CSS
    // transform (e.g. the .tab-panel entrance animation), which would
    // make position:fixed coordinates resolve against the wrong box.
    pop.style.visibility = 'hidden';
    document.body.appendChild(pop);
    this._positionPopover(pop, btn);
    pop.style.visibility = 'visible';

    const reposition = () => this._positionPopover(pop, btn);
    window.addEventListener('resize', reposition);
    window.visualViewport?.addEventListener('resize', reposition);

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
      window.removeEventListener('resize', reposition);
      window.visualViewport?.removeEventListener('resize', reposition);
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

  // Positions a body-appended, position:fixed popover against the real
  // visible viewport — using window.visualViewport when available so an
  // on-screen keyboard (which shrinks the visible area without changing
  // window.innerHeight) is accounted for, since this popover's own name
  // input is focused immediately after opening.
  _positionPopover(pop, btn) {
    const margin = 8;
    const vv = window.visualViewport;
    const viewportWidth  = vv ? vv.width  : window.innerWidth;
    const viewportHeight = vv ? vv.height : window.innerHeight;
    const vpTop  = vv ? vv.offsetTop  : 0;
    const vpLeft = vv ? vv.offsetLeft : 0;

    const btnRect = btn.getBoundingClientRect();
    const popRect = pop.getBoundingClientRect();

    let left = btnRect.right - popRect.width;
    left = Math.max(vpLeft + margin, Math.min(left, vpLeft + viewportWidth - popRect.width - margin));
    const width = Math.min(popRect.width, viewportWidth - margin * 2);

    const spaceBelow = (vpTop + viewportHeight) - btnRect.bottom - margin;
    const spaceAbove = btnRect.top - vpTop - margin;
    // maxHeight is bounded to whichever direction is actually chosen — not
    // just the full viewport height — so top + maxHeight can never exceed
    // the visible area regardless of how far down (or up) the trigger sits.
    // The CSS overflow-y:auto then keeps Save/Cancel reachable by scrolling
    // within the popover if its natural content is taller than that.
    let top, maxHeight;
    if (popRect.height <= spaceBelow || spaceBelow >= spaceAbove) {
      top = btnRect.bottom + 6;
      maxHeight = Math.max(60, spaceBelow - 6);
    } else {
      maxHeight = Math.max(60, spaceAbove - 6);
      top = Math.max(vpTop + margin, btnRect.top - Math.min(popRect.height, maxHeight) - 6);
    }

    pop.style.maxHeight = maxHeight + 'px';
    pop.style.width = width + 'px';
    pop.style.top = top + 'px';
    pop.style.left = left + 'px';
  },
};
