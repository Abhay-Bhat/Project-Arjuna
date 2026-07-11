// ============================================================
// Skadi — UI Orchestrator
// ============================================================

const UI = {

  init() {
    this._bindTabNav();
    this._bindThemeToggle();
    this._bindCalendar();
    this._bindHolidayToggle();
    this._initOnboarding();
    this._bindGlossary();
    this._bindHeaderMenu();
    this._bindKeyboardShortcuts();
    this._bindSidebarToggle();
    this._initScrollReveal();
    this._fetchQuote(); // Fetch once per session — not on every updateAll()
    this.updateAll();
  },

  // ── Toast Notifications ─────────────────────────────────
  showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // ── Keyboard Shortcuts ──────────────────────────────────
  _bindKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        const tabMap = {
          't': 'today',
          'u': 'upsc',
          'f': 'finance',
          'h': 'health',
          'g': 'growth',
          'k': 'tasks'
        };
        const tab = tabMap[e.key.toLowerCase()];
        if (tab) {
          e.preventDefault();
          const btn = document.querySelector(`[data-tab="${tab}"]`);
          if (btn) btn.click();
          this.showToast(`📍 Jumped to ${tab.charAt(0).toUpperCase() + tab.slice(1)} tab`);
        }
      }
      if (e.key === 'Escape') {
        document.getElementById('calendarModal')?.classList.remove('active');
        document.getElementById('onboardingModal')?.classList.remove('show');
        document.getElementById('glossaryModal')?.classList.remove('show');
        document.getElementById('headerDropdown')?.classList.remove('open');
      }
    });
  },

  // ── Onboarding ──────────────────────────────────────────
  _initOnboarding() {
    const modal = document.getElementById('onboardingModal');
    if (!modal) return;

    const isDone = localStorage.getItem('skadi_onboarding_done') || localStorage.getItem('athena_onboarding_done');
    if (!isDone) {
      modal.classList.add('show');
      this._bindOnboarding();
    }
  },

  _bindOnboarding() {
    const modal = document.getElementById('onboardingModal');
    const closeBtn = document.getElementById('onboardingClose');
    let currentScreen = 1;

    const showScreen = (n) => {
      document.querySelectorAll('.onboarding-screen').forEach(s => s.classList.remove('active'));
      const screen = document.querySelector(`[data-screen="${n}"]`);
      if (screen) screen.classList.add('active');
      currentScreen = n;
    };

    const closeOnboarding = () => {
      modal.classList.remove('show');
      localStorage.setItem('skadi_onboarding_done', 'true');
    };

    closeBtn.addEventListener('click', closeOnboarding);
    document.getElementById('obs-skip').addEventListener('click', closeOnboarding);
    document.getElementById('obs-finish').addEventListener('click', closeOnboarding);

    document.getElementById('obs-next-1').addEventListener('click', () => showScreen(2));
    document.getElementById('obs-next-2').addEventListener('click', () => showScreen(3));
    document.getElementById('obs-next-3').addEventListener('click', () => showScreen(4));
    document.getElementById('obs-back-2').addEventListener('click', () => showScreen(1));
    document.getElementById('obs-back-3').addEventListener('click', () => showScreen(2));
    document.getElementById('obs-back-4').addEventListener('click', () => showScreen(3));
  },

  // ── Header dropdown menu ─────────────────────────────────
  _bindHeaderMenu() {
    const menuBtn  = document.getElementById('headerMenuBtn');
    const dropdown = document.getElementById('headerDropdown');
    const menuIcon = document.getElementById('hdrMenuIcon');
    const avatar   = document.getElementById('userAvatar');
    if (!menuBtn || !dropdown) return;

    const close = () => {
      dropdown.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    };

    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(isOpen));
    });

    // Clicks inside dropdown don't bubble to document (prevent instant re-close)
    // but still close after clicking a menu item
    dropdown.addEventListener('click', (e) => {
      e.stopPropagation();
      if (e.target.closest('.hdr-dd-item')) close();
    });

    document.addEventListener('click', close);

    // Watch avatar display so ☰ hides when avatar is shown
    if (avatar && menuIcon) {
      const syncIcon = () => {
        const visible = avatar.style.display && avatar.style.display !== 'none';
        menuIcon.style.display = visible ? 'none' : 'flex';
      };
      new MutationObserver(syncIcon).observe(avatar, { attributes: true, attributeFilter: ['style'] });
      syncIcon();
    }
  },

  // ── Sidebar toggle ───────────────────────────────────────
  _bindSidebarToggle() {
    const btn   = document.getElementById('sidebarToggle');
    const shell = document.getElementById('app-shell');
    if (!btn || !shell) return;

    const collapsed = localStorage.getItem('skadi_sidebar_collapsed') === '1';
    if (collapsed) shell.classList.add('sidebar-collapsed');

    btn.addEventListener('click', () => {
      const isCollapsed = shell.classList.toggle('sidebar-collapsed');
      localStorage.setItem('skadi_sidebar_collapsed', isCollapsed ? '1' : '0');
    });
  },

  // ── Scroll reveal (IntersectionObserver) ────────────────
  _initScrollReveal() {
    if (!('IntersectionObserver' in window)) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('sr-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });

    // Observe pane-main direct children and stat-cards + section-titles
    const observe = () => {
      document.querySelectorAll(
        '.pane-main > *, .pane-main .stat-card, .pane-main .chart-wrap, ' +
        '.pane-main .data-table-wrap, .pane-main .book-card, ' +
        '.pane-main .tech-phase, .pane-main .upsc-card, .pane-main .cd-tip'
      ).forEach(el => {
        if (!el.classList.contains('sr') && !el.classList.contains('sr-visible')) {
          el.classList.add('sr');
          io.observe(el);
        }
      });
    };

    observe();
    // Re-run after dynamic renders
    document.addEventListener('skadi:rendered', observe);
  },

  // ── Glossary ────────────────────────────────────────────
  _bindGlossary() {
    const modal = document.getElementById('glossaryModal');
    const closeBtn = document.getElementById('glossaryClose');
    if (!modal || !closeBtn) return;

    closeBtn.addEventListener('click', () => {
      modal.classList.remove('show');
    });

    // Add glossary button to footer or header (will add in next phase)
    window.openGlossary = () => {
      modal.classList.add('show');
    };
  },

  // ── Full refresh ─────────────────────────────────────────
  // ── Pending activity state ───────────────────────────────
  _pendingActivity: null, // { key, scheduleKey, activityName, navTab, cb }

  // Called by scheduler when a navTab activity checkbox is clicked
  setPendingActivity(info) {
    this._pendingActivity = info;
    this._showPendingBanner();
  },

  // Render the "Complete this, then mark done" sticky banner
  _showPendingBanner() {
    let banner = document.getElementById('pendingActivityBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'pendingActivityBanner';
      banner.style.cssText = `
        position:sticky; top:0; z-index:150;
        background:linear-gradient(135deg, rgba(0,212,124,0.15), rgba(77,121,255,0.12));
        border-bottom:2px solid var(--accent-green);
        padding:12px 20px; display:flex; align-items:center; gap:12px;
        font-size:13px; backdrop-filter:blur(8px);`;
      document.querySelector('main')?.prepend(banner);
    }
    const p = this._pendingActivity;
    banner.innerHTML = `
      <span style="font-size:18px;">📋</span>
      <span style="flex:1;color:var(--text);">
        <strong style="color:var(--accent-green);">Completing: ${p.activityName}</strong>
        — ${p.meta?.expect || 'Log your data here, then mark complete.'}
      </span>
      <button id="pendingMarkDoneBtn" class="btn btn-sm btn-primary" style="flex-shrink:0;">✓ Mark Complete</button>
      <button id="pendingCancelBtn" class="btn btn-sm" style="flex-shrink:0;">✕ Cancel</button>`;

    document.getElementById('pendingMarkDoneBtn')?.addEventListener('click', () => {
      this._completePendingActivity();
    });
    document.getElementById('pendingCancelBtn')?.addEventListener('click', () => {
      this._clearPendingActivity();
    });
  },

  _completePendingActivity() {
    if (!this._pendingActivity) return;
    const { key, scheduleKey, cb } = this._pendingActivity;
    AppState.toggleActivity(key, true);
    if (cb) { cb.checked = true; cb.closest('.time-slot')?.classList.add('completed'); }
    Scheduler.updateProgress(scheduleKey);
    this._clearPendingActivity();
    // Navigate back to Today tab
    this._setActiveTab('today');
    this._renderTab('today');
    this.showToast('✅ Activity marked complete!');
  },

  _clearPendingActivity() {
    this._pendingActivity = null;
    document.getElementById('pendingActivityBanner')?.remove();
  },

  // Called by Health/UPSC/Mind/Growth save handlers after data is saved
  tryCompletePendingActivity(tab) {
    if (this._pendingActivity && this._pendingActivity.navTab === tab) {
      this._showPendingBanner(); // Refresh banner so "Mark Complete" is prominent
      this.showToast(`✅ Data saved! Click "Mark Complete" to finish the activity.`, 5000);
    }
  },

  updateAll() {
    this._renderHeader();
    this._renderMilestoneBanner();
    this._renderTab(AppState.currentTab);
    this._setActiveTab(AppState.currentTab);
  },

  // ── Header ───────────────────────────────────────────────
  _renderHeader() {
    const dateEl  = document.getElementById('dateDisplay');
    const typeEl  = document.getElementById('dayType');
    const phaseEl = document.getElementById('phaseBadge');

    if (dateEl) {
      dateEl.textContent = AppState.selectedDate.toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    }

    const phase = PhaseManager.getPhase(AppState.selectedDate);
    if (typeEl)  typeEl.textContent = phase ? phase.name : '';
    if (phaseEl && phase) {
      phaseEl.textContent  = `${phase.emoji} ${phase.name}`;
      phaseEl.style.borderColor = phase.color;
      phaseEl.style.color       = phase.color;
    }
  },

  // ── Milestone countdown banner ───────────────────────────
  _renderMilestoneBanner() {
    const banner = document.getElementById('milestoneBanner');
    if (!banner) return;
    const milestones = PhaseManager.getUpcomingMilestones(3);
    if (!milestones.length) { banner.innerHTML = ''; return; }
    banner.innerHTML = milestones.map(m => {
      const cls = m.days === 0 ? 'ms-days ms-today'
                : m.days <= 7  ? 'ms-days ms-urgent'
                : m.days <= 30 ? 'ms-days ms-soon'
                               : 'ms-days';
      const label = m.days === 0 ? 'TODAY' : m.days + 'd';
      return `<div class="milestone-item">
        <span class="${cls}">${label}</span>
        <span class="ms-label">${m.label}</span>
      </div>`;
    }).join('<span class="ms-sep">·</span>');
  },

  // ── Tab rendering ────────────────────────────────────────
  _renderTab(tab) {
    AppState.currentTab = tab;
    switch (tab) {
      case 'today':    this._renderToday();   break;
      case 'upsc':     this._renderUPSC();    break;
      case 'finance':  this._renderFinance(); break;
      case 'health':   this._renderHealth();  break;
      case 'growth':   this._renderGrowth();  break;
      case 'tasks':    this._renderTasks();   break;
    }
  },

  // ── TODAY tab ────────────────────────────────────────────
  _renderToday() {
    this._renderDashboard();
    this._renderProTip();
    this._bindQCCards();
    this.syncQuickCheckins();
    this._syncTodayHabits();
    this._renderTodayUPSC();
    this._renderRoutine();
    this._renderCalendarNav();
    this._renderHolidayToggle();
    this._renderTasksDueBanner();
    if (typeof TimeMatrix !== 'undefined') TimeMatrix.render();
    if (typeof StudyTracker !== 'undefined') StudyTracker.render();
    if (typeof TechStudyTracker !== 'undefined') TechStudyTracker.render();
  },

  _syncTodayHabits() {
    if (!window.ArjunaHealth) return;
    const log   = ArjunaHealth.getTodayNutritionLog();
    const done  = log.filter(i => i.checked).length;
    const total = log.length;
    const bar   = document.getElementById('todayHabitsBar');
    const score = document.getElementById('todayHabitsScore');
    if (bar)   bar.style.width   = Math.round((done / total) * 100) + '%';
    if (score) score.textContent = `${done} / ${total} habits`;
    log.forEach(item => {
      const el = document.getElementById(`th-${item.id}`);
      if (!el) return;
      el.classList.toggle('th-done', item.checked);
      el.title = item.label + (item.checked ? ' ✓' : '');
    });
    // Also refresh Health tab checklist if it's already rendered
    if (typeof updateNutritionScore === 'function') updateNutritionScore();
  },

  _renderTasksDueBanner() {
    const banner = document.getElementById('tasksDueBanner');
    if (!banner) return;

    const today = AppState.getTodayKey();
    const tasks = (AppState.tasks || []).filter(t => !t.deleted && !t.done && t.dueDate && t.dueDate <= today);
    if (!tasks.length) { banner.style.display = 'none'; return; }

    tasks.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    const priColor = { high: '#ff5c80', medium: '#ffb230', low: '#5b7fff' };
    const itemsHtml = tasks.map(t => {
      const overdue = t.dueDate < today;
      const badgeClass = overdue ? 'due-overdue' : 'due-today';
      const badgeText  = overdue ? 'Overdue' : 'Today';
      const dotColor   = priColor[t.priority] || '#697098';
      return `<div class="tasks-due-item">
        <span class="tasks-due-dot" style="background:${dotColor};"></span>
        <span class="tasks-due-title-text">${esc(t.title)}</span>
        <span class="tasks-due-badge-sm ${badgeClass}">${badgeText}</span>
      </div>`;
    }).join('');

    banner.style.display = '';
    banner.innerHTML = `
      <div class="tasks-due-banner-title">⚠️ Tasks due</div>
      <div class="tasks-due-list">${itemsHtml}</div>`;
  },

  _renderDashboard() {
    this._renderPhaseHero();
    this._renderDomainCards();
    this._bindDashboardToggle();
  },

  _renderPhaseHero() {
    const hero = document.getElementById('phaseHero');
    if (!hero) return;
    const phase = PhaseManager.getPhase();
    const milestones = PhaseManager.getUpcomingMilestones(2);

    // Calculate phase progress
    const start = new Date(phase.start);
    const end = new Date(phase.end);
    const now = new Date();
    const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    const percentDone = PhaseManager.getPhaseProgress(phase);

    let milestonesHtml = '';
    if (milestones.length) {
      milestonesHtml = `<div class="phase-hero-milestones">
        <strong>Next:</strong> ${milestones[0].label} (${milestones[0].days}d)
      </div>`;
    }

    hero.innerHTML = `
      <div class="phase-hero-content">
        <div class="phase-hero-label">Current Phase</div>
        <div class="phase-hero-title">${phase?.emoji} ${phase?.name}</div>
        <div class="phase-hero-countdown">
          ${Math.max(0, daysLeft)} days left • ${percentDone}% complete
        </div>
        ${milestonesHtml}
      </div>
    `;
  },

  _renderDomainCards() {
    const grid = document.getElementById('domainsGrid');
    if (!grid) return;

    const upscDone = Object.values(AppState.upscSubjectProgress || {}).reduce((s, n) => s + n, 0);
    const upscTotal = 586;
    const upscPct = Math.round((upscDone / upscTotal) * 100);

    const financeAED = AppState.getTotalSavedAED();
    const financePct = Math.round((financeAED / 199800) * 100);

    const todayHealth = AppState.getSelectedHealth();
    const healthScore = (
      (todayHealth.sleep_h ? Math.min(todayHealth.sleep_h / 8 * 100, 100) : 0) * 0.4 +
      (todayHealth.gym ? 100 : 0) * 0.3 +
      (todayHealth.phone_h ? Math.max(0, (2 - todayHealth.phone_h) / 2 * 100) : 50) * 0.3
    );
    const healthPct = Math.round(healthScore);

    const careerDone = Object.values(AppState.careerLog || {}).filter(c => c.done).length;
    const careerPct = Math.round((careerDone / 5) * 100);

    const selectedKey = AppState.getDateKey();
    const routine = AppState.dailyHistory[selectedKey];
    const routinePct = routine ? Math.round((routine.completed / routine.total) * 100) : 0;

    const goalsPct = typeof GoalsTracker !== 'undefined' ? GoalsTracker._avgProgress() : 0;

    const domains = [
      { id: 'upsc',    emoji: '📚', name: 'UPSC',    metric: `${upscDone}/${upscTotal}`, label: 'classes done',  pct: upscPct,    status: 'On Track',  tip: 'Click to open UPSC tab — track study classes and CA reading' },
      { id: 'finance', emoji: '💰', name: 'Finance', metric: `${financeAED.toLocaleString('en-IN')}`, label: 'AED saved', pct: financePct, status: financePct >= 80 ? 'On Track' : 'Behind',  tip: 'Click to open Finance tab — savings, investments, currency converter' },
      { id: 'health',  emoji: '❤️', name: 'Health',  metric: `${healthPct}%`,            label: 'today\'s score', pct: healthPct,  status: healthPct >= 70 ? '✓ Good' : 'Need Work', tip: 'Click to open Health tab — sleep, gym, phone usage, cholesterol' },
      { id: 'growth',  emoji: '🌱', name: 'Growth',  metric: `${careerDone}/5`,           label: 'milestones',    pct: careerPct,  status: careerDone >= 2 ? 'On Track' : 'Begin',    tip: 'Click to open Growth tab — career milestones, books, weekly reviews' },
      { id: 'routine', emoji: '⏱️', name: 'Routine', metric: `${routinePct}%`,            label: 'today done',   pct: routinePct, status: routinePct >= 70 ? 'Great Day' : 'Keep Going', tip: 'Click to scroll to Daily Routine — check off today\'s activities' },
      { id: 'goals',   emoji: '🎯', name: 'Goals',   metric: `${goalsPct}%`,             label: 'avg progress', pct: goalsPct,   status: goalsPct >= 50 ? 'On Track' : 'Early Days', tip: 'Click to open Growth tab — SMART Goals progress' }
    ];

    grid.innerHTML = domains.map(d => `
      <div class="domain-card ${d.id}" data-tab="${d.id === 'routine' ? 'today' : d.id === 'goals' ? 'growth' : d.id}">
        <div class="domain-header">
          <span class="domain-emoji">${d.emoji}</span>
          <span class="domain-name">${d.name}</span>
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="domain-status">${d.status}</span>
            <span class="info-icon" data-tip="${d.tip}" style="position:relative;">i</span>
          </div>
        </div>
        <div class="domain-metric">${d.metric}</div>
        <div class="domain-label">${d.label}</div>
        <div class="domain-bar">
          <div class="domain-bar-fill" style="width: ${d.pct}%"></div>
        </div>
        <div class="domain-pct">${d.pct}%</div>
      </div>
    `).join('');

    // Add click handlers to jump to tabs
    grid.querySelectorAll('.domain-card').forEach(card => {
      card.addEventListener('click', () => {
        const tab = card.dataset.tab;
        if (tab) {
          document.querySelector(`[data-tab="${tab}"]`).click();
        }
      });
    });
  },

  _bindDashboardToggle() {
    const btn = document.getElementById('dashboardToggle');
    const container = document.getElementById('dashboardContainer');
    if (!btn || !container) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      container.classList.toggle('collapsed');
      btn.style.opacity = container.classList.contains('collapsed') ? '0.4' : '0.6';
      AppState.dashboardCollapsed = container.classList.contains('collapsed');
      AppState.save();
    });

    // Restore collapsed state if it was saved
    if (AppState.dashboardCollapsed) {
      container.classList.add('collapsed');
      btn.style.opacity = '0.4';
    }
  },

  _fetchQuote() {
    const textEl   = document.getElementById('quoteText');
    const authorEl = document.getElementById('quoteAuthor');
    if (!textEl || !authorEl) return;

    const fallbacks = [
      { q: 'Discipline beats motivation when motivation fades.',                       a: 'Anonymous' },
      { q: 'The man who moves a mountain begins by carrying away small stones.',       a: 'Confucius' },
      { q: 'It is not that I am smart, it is just that I stay with problems longer.',  a: 'Einstein' },
      { q: 'A small daily task, if it be really daily, will beat the labours of a spasmodic Hercules.', a: 'Anthony Trollope' },
      { q: 'Every expert was once a beginner.',                                        a: 'Helen Hayes' },
      { q: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', a: 'Winston Churchill' },
      { q: 'The secret of getting ahead is getting started.',                          a: 'Mark Twain' },
      { q: 'It always seems impossible until it is done.',                             a: 'Nelson Mandela' },
      { q: 'Hard work beats talent when talent does not work hard.',                   a: 'Tim Notke' },
      { q: 'The future belongs to those who believe in the beauty of their dreams.',   a: 'Eleanor Roosevelt' },
      { q: 'Do not watch the clock. Do what it does — keep going.',                    a: 'Sam Levenson' },
      { q: 'Opportunities are usually disguised as hard work, so most people do not recognise them.', a: 'Ann Landers' },
      { q: 'Act as if what you do makes a difference. It does.',                       a: 'William James' },
      { q: 'Excellence is not a destination; it is a continuous journey that never ends.', a: 'Brian Tracy' },
      { q: 'Strength does not come from physical capacity. It comes from an indomitable will.', a: 'Mahatma Gandhi' },
      { q: 'The only way to do great work is to love what you do.',                    a: 'Steve Jobs' },
      { q: 'You miss 100% of the shots you don\'t take.',                              a: 'Wayne Gretzky' },
      { q: 'Start where you are. Use what you have. Do what you can.',                 a: 'Arthur Ashe' },
      { q: 'Believe you can and you\'re halfway there.',                               a: 'Theodore Roosevelt' },
      { q: 'No one saves us but ourselves. No one can and no one may. We ourselves must walk the path.', a: 'Buddha' },
    ];

    const apply = (q, a) => {
      textEl.textContent   = '"' + q + '"';
      authorEl.textContent = '— ' + a;
    };

    // Pick a fresh random fallback every refresh — avoid repeating the previous one
    const lastQ = sessionStorage.getItem('skadi_last_quote') || '';
    let pool = fallbacks.filter(f => f.q !== lastQ);
    if (!pool.length) pool = fallbacks;
    const immediate = pool[Math.floor(Math.random() * pool.length)];
    apply(immediate.q, immediate.a);
    sessionStorage.setItem('skadi_last_quote', immediate.q);

    // Try public quote APIs for variety; if they succeed, swap in the fresh quote
    const tryZen = () =>
      fetch('https://zenquotes.io/api/random', { signal: AbortSignal.timeout(4000) })
        .then(r => { if (!r.ok) throw new Error(); return r.json(); })
        .then(d => { const x = Array.isArray(d) ? d[0] : null; if (!x?.q) throw new Error();
          return { q: x.q, a: x.a || 'Unknown' }; });

    const tryQuotable = () =>
      fetch('https://api.quotable.io/random?maxLength=150', { signal: AbortSignal.timeout(4000) })
        .then(r => { if (!r.ok) throw new Error(); return r.json(); })
        .then(d => { if (!d?.content) throw new Error(); return { q: d.content, a: d.author }; });

    const tryForismatic = () =>
      fetch('https://api.forismatic.com/api/1.0/?method=getQuote&format=json&lang=en', { signal: AbortSignal.timeout(4000) })
        .then(r => { if (!r.ok) throw new Error(); return r.json(); })
        .then(d => { if (!d?.quoteText) throw new Error(); return { q: d.quoteText.trim(), a: d.quoteAuthor?.trim() || 'Unknown' }; });

    tryZen()
      .catch(() => tryQuotable())
      .catch(() => tryForismatic())
      .then(({ q, a }) => {
        apply(q, a);
        sessionStorage.setItem('skadi_last_quote', q);
      })
      .catch(() => { /* keep the fresh fallback already shown */ });
  },

  _renderProTip() {
    const el = document.getElementById('proTipText');
    if (!el) return;
    if (typeof CoachEngine !== 'undefined') {
      const tip = CoachEngine.getBestTip();
      el.textContent = tip.text;
      const iconEl = document.querySelector('.pro-tip-card .pro-tip-icon');
      if (iconEl) iconEl.textContent = tip.icon || '💡';
      return;
    }
    const phase = PhaseManager.getPhase();
    const tips = {
      ramp1:     'Weeks 1–2: Build the anchor habit. Same wake time, same study block. Nothing else matters yet.',
      ramp2:     'Weeks 3–4: You extended the evening block. Protect the 7:15 PM start — it\'s your UPSC gate.',
      ramp3:     'Weeks 5–6: 2 hours UPSC/day reached. Consistency > intensity. Don\'t chase lost days.',
      ramp4:     'Weeks 7–8: Full capacity. NCERT is closing out. CKA prep parallel. You\'re building something real.',
      sustained: 'Week 9+: Cruise altitude. 27.5h UPSC + 4.5h Tech/week. Trust the system — it\'s designed to last 76 weeks.'
    };
    el.textContent = tips[phase?.id] || tips.sustained;
  },

  // Quick check-in row on Today tab
  syncQuickCheckins() {
    const sel = AppState.getSelectedHealth();
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    const cls = (id, c, on) => { const el = document.getElementById(id); if (el) el.classList.toggle(c, on); };

    const ca = AppState.getSelectedCA();

    set('qcSleep',    sel.sleep_h != null ? sel.sleep_h + 'h' : '—');
    set('qcGymValue', sel.gym     ? '✓' : '—');
    set('qcPhone',    sel.phone_h != null ? sel.phone_h + 'h' : '—');
    set('qcCAValue',  ca.done ? (ca.articles?.length || '✓') + (ca.articles?.length > 0 ? ' read' : '') : '—');

    cls('qcGymCard', 'active', !!sel.gym);
    cls('qcCACard',  'active', !!ca.done);
  },

  _bindQCCards() {
    const isToday = () => AppState.selectedDate.toDateString() === new Date().toDateString();

    // Gym — toggle directly (primary entry point on Today tab)
    const gymCard = document.getElementById('qcGymCard');
    if (gymCard && !gymCard.dataset.bound) {
      gymCard.dataset.bound = '1';
      gymCard.addEventListener('click', () => {
        const cur = AppState.getSelectedHealth().gym;
        AppState.setSelectedHealth({ gym: !cur });
        this.syncQuickCheckins();
        this.showToast(!cur ? '🏋️ Gym marked done' : '🏋️ Gym unmarked');
      });
    }

    // Sleep — navigate to Health tab for entry
    const sleepCard = document.getElementById('qcSleepCard');
    if (sleepCard && !sleepCard.dataset.bound) {
      sleepCard.dataset.bound = '1';
      sleepCard.addEventListener('click', () => {
        this._navigateToTab('health', 'hSleep');
        this.showToast('😴 Enter sleep hours in Health tab');
      });
    }

    // Phone — navigate to Health tab for entry
    const phoneCard = document.getElementById('qcPhoneCard');
    if (phoneCard && !phoneCard.dataset.bound) {
      phoneCard.dataset.bound = '1';
      phoneCard.addEventListener('click', () => {
        this._navigateToTab('health', 'hPhone');
        this.showToast('📱 Enter screen time in Health tab');
      });
    }

    // CA — navigate to UPSC tab
    const caCard = document.getElementById('qcCACard');
    if (caCard && !caCard.dataset.bound) {
      caCard.dataset.bound = '1';
      caCard.addEventListener('click', () => {
        this._navigateToTab('upsc', 'caTitle');
        this.showToast('📰 Log your CA reading in UPSC → Current Affairs');
      });
    }

    // card-tab-link buttons (Today's Log → Health, Today's Classes → UPSC, etc.)
    document.querySelectorAll('.card-tab-link').forEach(btn => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const tab = btn.dataset.goto;
        if (tab) {
          this._navigateToTab(tab);
        }
      });
    });
  },

  // Navigate to a tab, optionally scroll to an element by ID
  _navigateToTab(tab, scrollToId) {
    this._setActiveTab(tab);
    AppState.currentTab = tab;
    AppState.save();
    this._renderTab(tab);
    if (scrollToId) {
      setTimeout(() => {
        const el = document.getElementById(scrollToId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  },

  _renderTodayUPSC() {
    // Reuse the UPSC tracker's own render so there's one source of truth.
    // upscTodayClasses is in the UPSC tab; todayUpscClasses is in Today tab.
    // Both containers get the same markup via UPSCTracker.renderTodayClasses.
    if (typeof UPSCTracker !== 'undefined' && UPSCTracker.renderTodayClasses) {
      UPSCTracker.renderTodayClasses('todayUpscClasses');
    }
  },

  _renderRoutine() {
    const scheduleKey = AppState.getScheduleKey();
    Scheduler.renderSchedule(scheduleKey, 'scheduleContainer');

    const indicator = document.getElementById('dayIndicator');
    const labels = {
      ramp1_weekday:       '🏁 Stage 1 — Settling In (Weekday)',
      ramp1_saturday:      '🏁 Stage 1 — Settling In (Saturday)',
      ramp1_sunday:        '🏁 Stage 1 — Settling In (Sunday)',
      ramp2_weekday:       '🔧 Stage 2 — Building Momentum (Weekday)',
      ramp2_saturday:      '🔧 Stage 2 — Building Momentum (Saturday)',
      ramp2_sunday:        '🔧 Stage 2 — Building Momentum (Sunday)',
      ramp3_weekday:       '📈 Stage 3 — Deepening (Weekday)',
      ramp3_saturday:      '📈 Stage 3 — Deepening (Saturday)',
      ramp3_sunday:        '📈 Stage 3 — Deepening (Sunday)',
      ramp4_weekday:       '🔥 Stage 4 — Full Capacity (Weekday)',
      ramp4_saturday:      '🔥 Stage 4 — Full Capacity (Saturday)',
      ramp4_sunday:        '🔥 Stage 4 — Full Capacity (Sunday)',
      sustained_weekday:   '⚡ Sustained Cruise (Weekday)',
      sustained_saturday:  '⚡ Sustained Cruise (Saturday)',
      sustained_sunday:    '⚡ Sustained Cruise (Sunday)'
    };
    if (indicator) indicator.textContent = labels[scheduleKey] || scheduleKey;
  },

  _renderCalendarNav() {
    const nav = document.getElementById('calendarNav');
    if (!nav) return;

    // Row 1: nav controls (only build once)
    if (!nav.dataset.initialized) {
      nav.dataset.initialized = '1';

      // Controls row
      const ctrlRow = document.createElement('div');
      ctrlRow.id = 'calNavCtrlRow';
      ctrlRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:8px;';

      const prevBtn = document.createElement('button');
      prevBtn.className = 'btn btn-sm';
      prevBtn.textContent = '‹';
      prevBtn.title = 'Previous week';
      prevBtn.addEventListener('click', () => {
        const d = new Date(AppState.selectedDate);
        d.setDate(d.getDate() - 7);
        AppState.selectedDate = d;
        AppState.calendarMonth = new Date(d);
        AppState.save();
        this.updateAll();
      });

      const weekLabel = document.createElement('span');
      weekLabel.id = 'calNavWeekLabel';
      weekLabel.style.cssText = 'flex:1;text-align:center;font-size:12px;color:var(--text-muted);font-weight:500;';

      const nextBtn = document.createElement('button');
      nextBtn.className = 'btn btn-sm';
      nextBtn.textContent = '›';
      nextBtn.title = 'Next week';
      nextBtn.addEventListener('click', () => {
        const d = new Date(AppState.selectedDate);
        d.setDate(d.getDate() + 7);
        AppState.selectedDate = d;
        AppState.calendarMonth = new Date(d);
        AppState.save();
        this.updateAll();
      });

      const todayBtn = document.createElement('button');
      todayBtn.className = 'btn btn-sm';
      todayBtn.textContent = '📅 Today';
      todayBtn.title = 'Jump to today\'s date';
      todayBtn.addEventListener('click', () => {
        AppState.selectedDate = new Date();
        AppState.calendarMonth = new Date();
        AppState.save();
        this.updateAll();
      });

      ctrlRow.appendChild(prevBtn);
      ctrlRow.appendChild(weekLabel);
      ctrlRow.appendChild(nextBtn);
      ctrlRow.appendChild(todayBtn);
      nav.appendChild(ctrlRow);

      // Day strip row
      const strip = document.createElement('div');
      strip.id = 'calNavDayStrip';
      strip.style.cssText = 'display:flex;gap:6px;overflow-x:auto;padding-bottom:10px;scrollbar-width:none;';
      nav.appendChild(strip);
    }

    // Always update day buttons and week label
    const today = new Date();
    const selected = new Date(AppState.selectedDate || today);

    // Get Monday of the week
    const dow = selected.getDay();
    const diff = selected.getDate() - dow + (dow === 0 ? -6 : 1);
    const monday = new Date(selected);
    monday.setDate(diff);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    // Update week label — compact single-line format
    const lbl = document.getElementById('calNavWeekLabel');
    if (lbl) {
      const sameMonth = monday.getMonth() === sunday.getMonth();
      const mo = monday.toLocaleDateString('en-US', { month: 'short' });
      lbl.textContent = sameMonth
        ? `${mo} ${monday.getDate()}–${sunday.getDate()}`
        : `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }

    // Rebuild day buttons
    const strip = document.getElementById('calNavDayStrip');
    if (!strip) return;
    strip.innerHTML = '';

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);

      const btn = document.createElement('button');
      btn.className = 'cal-day-btn';
      btn.innerHTML = `<span>${d.toLocaleDateString('en-US',{weekday:'short'})}</span><span>${d.getDate()}</span>`;

      if (d.toDateString() === today.toDateString()) btn.classList.add('today');
      if (d.toDateString() === AppState.selectedDate.toDateString()) btn.classList.add('selected');

      const hist = AppState.dailyHistory[AppState.getDateKey(d)];
      if (hist && hist.total > 0) {
        const pct = hist.completed / hist.total;
        if (pct === 1) btn.classList.add('full');
        else if (pct > 0.5) btn.classList.add('partial');
      }

      btn.addEventListener('click', () => {
        AppState.selectedDate = new Date(d);
        AppState.calendarMonth = new Date(d);
        AppState.save();
        this.updateAll();
      });

      strip.appendChild(btn);
    }
  },

  _renderHolidayToggle() {
    const toggle  = document.getElementById('holidayToggle');
    const switchEl = document.getElementById('holidaySwitch');
    if (!toggle || !switchEl) return;

    const today   = new Date();
    const isToday = AppState.selectedDate.toDateString() === today.toDateString();
    const day     = AppState.selectedDate.getDay();
    const isWd    = day >= 1 && day <= 5;

    toggle.style.display = (isToday && isWd) ? 'flex' : 'none';
    if (isToday && isWd) {
      const over = AppState.holidayOverrides[AppState.getDateKey()] === 'weekend';
      switchEl.classList.toggle('on', over);
    }
  },

  // ── UPSC tab ─────────────────────────────────────────────
  _renderUPSC() {
    UPSCTracker.updateMetrics();
    this._renderExamPhases();
    UPSCTracker.renderCASection();
  },

  _renderExamPhases() {
    const container = document.getElementById('upscExamPhases');
    if (!container) return;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const DAY_MS = 864e5;

    const PHASES = [
      {
        key: 'prelims', icon: '📝', name: 'Prelims Preparation',
        start: '2028-01-01', end: '2028-05-25', color: 'var(--accent-amber)',
        target: 'Prelims Exam: May 26, 2028',
        items: ['Full syllabus revision (GS I–IV + CSAT)', 'Weekly mock tests & analysis', 'Current affairs consolidation (12 months)', 'Previous year question papers practice']
      },
      {
        key: 'mains', icon: '✍️', name: 'Mains Preparation',
        start: '2028-05-27', end: '2028-09-19', color: 'var(--accent-blue)',
        target: 'Mains Exam: Sep 20, 2028',
        items: ['Answer writing practice (daily 3–4 answers)', 'Sociology optional deep revision', 'Essay writing practice (weekly)', 'Sectional & full-length Mains mock tests']
      },
      {
        key: 'interview', icon: '🎤', name: 'Interview / Personality Test',
        start: '2028-10-01', end: '2029-02-28', color: 'var(--accent-teal)',
        target: 'Personality Test: ~Feb/Mar 2029',
        items: ['DAF (Detailed Application Form) preparation', 'Mock interview panels', 'Current affairs & opinion formation', 'Personality development & health focus']
      }
    ];

    container.innerHTML = PHASES.map(p => {
      const startD = new Date(p.start + 'T00:00:00');
      const endD = new Date(p.end + 'T00:00:00');
      const totalDays = Math.max(1, Math.round((endD - startD) / DAY_MS));
      const elapsed = Math.max(0, Math.round((today - startD) / DAY_MS));
      const isDone = todayStr > p.end;
      const isActive = todayStr >= p.start && todayStr <= p.end;
      const pct = isDone ? 100 : isActive ? Math.min(100, Math.round((elapsed / totalDays) * 100)) : 0;

      let countdown = '';
      if (!isActive && !isDone) {
        const daysUntil = Math.max(0, Math.ceil((startD - today) / DAY_MS));
        countdown = `<span class="ep-countdown">Starts in ${daysUntil} days</span>`;
      } else if (isActive) {
        const daysLeft = Math.max(0, Math.ceil((endD - today) / DAY_MS));
        countdown = `<span class="ep-countdown ep-active">${daysLeft} days remaining</span>`;
      }

      const statusCls = isDone ? 'ep-done' : isActive ? 'ep-active-card' : '';

      return `<div class="upsc-phase-card phase-${p.key} ${statusCls}">
        <div class="ep-top">
          <span class="upsc-phase-icon">${p.icon}</span>
          <div class="ep-title-wrap">
            <div class="upsc-phase-name">${p.name}</div>
            ${countdown}
          </div>
        </div>
        <div class="ep-target"><span class="ep-target-label">${p.target}</span></div>
        <div class="ep-dates-row">
          <span class="ep-date-chip">${p.start.replace(/-/g, '/')}</span>
          <span class="ep-date-arrow">→</span>
          <span class="ep-date-chip">${p.end.replace(/-/g, '/')}</span>
        </div>
        <div class="ep-progress">
          <div class="prog-bar-track" style="height:6px;">
            <div class="prog-bar-fill${isDone ? ' green' : ''}" style="width:${pct}%;${isActive ? 'background:' + p.color + ';box-shadow:0 0 8px ' + p.color + ';' : ''}"></div>
          </div>
          <span class="ep-pct">${pct}%</span>
        </div>
        <ul class="upsc-phase-activities">
          ${p.items.map(i => `<li>${i}</li>`).join('')}
        </ul>
      </div>`;
    }).join('');
  },

  _renderPhaseTimeline() {
    const container = document.getElementById('phaseTimeline');
    if (!container) return;

    const currentPhase = PhaseManager.getPhase();
    const now          = new Date();
    const todayStr     = AppState.getTodayKey();

    // Group milestones by phase date range for relevant display
    const milestonesForPhase = (phase) =>
      (MILESTONES || []).filter(m => m.date >= phase.start && m.date <= phase.end);

    container.innerHTML = PHASES.map(p => {
      const isCurrent = p.id === currentPhase?.id;
      const isPast    = todayStr > p.end;
      const pct       = PhaseManager.getPhaseProgress(p);

      // Days left or days ago
      const endDate   = new Date(p.end);
      const diffDays  = Math.ceil((endDate - now) / 86400000);
      const daysLabel = isPast
        ? `Ended ${Math.abs(diffDays)}d ago`
        : isCurrent
          ? `${Math.max(0, diffDays)}d remaining`
          : `Starts in ${Math.ceil((new Date(p.start) - now) / 86400000)}d`;

      const phaseMilestones = milestonesForPhase(p);
      const milestonesHtml  = phaseMilestones.length
        ? `<div class="phase-milestones">
            <div style="font-size:11px;color:var(--text-muted);font-weight:600;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:6px;">🎯 Key Targets</div>
            ${phaseMilestones.map(m => {
              const mPast = m.date <= todayStr;
              return `<div class="phase-milestone-item ${mPast ? 'done' : ''}">
                <span class="pm-dot" style="background:${mPast ? p.color : 'var(--border-bright)'}"></span>
                <span class="pm-label">${m.label}</span>
                <span class="pm-date">${m.date}</span>
              </div>`;
            }).join('')}
          </div>`
        : '';

      return `
        <div class="phase-card ${isCurrent ? 'current' : ''} ${isPast ? 'past' : ''}"
             style="${isCurrent ? `border-color:${p.color};box-shadow:0 0 0 1px ${p.color}33` : ''}">
          <div class="phase-header">
            <span class="phase-emoji">${p.emoji}</span>
            <div style="flex:1;min-width:0;">
              <div class="phase-name">${p.name}</div>
              <div class="phase-dates" style="color:${p.color}">${p.start} → ${p.end}</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;">
              ${isCurrent ? `<span class="phase-now-badge" style="background:${p.color}">● NOW</span>` : ''}
              ${isPast ? '<span style="font-size:10px;color:var(--text-faint);">✓ Complete</span>' : ''}
              <span style="font-size:11px;color:var(--text-muted);">${daysLabel}</span>
            </div>
          </div>
          <div class="phase-desc" style="font-size:13px;margin:8px 0;">${p.description}</div>
          <div class="phase-prog-bar" style="margin:8px 0;">
            <div class="phase-prog-fill" style="width:${pct}%;background:${p.color}"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-bottom:${phaseMilestones.length ? '12px' : '0'};">
            <span>${pct}% complete</span>
            <span>${p.start} → ${p.end}</span>
          </div>
          ${milestonesHtml}
        </div>`;
    }).join('');
  },

  // ── Finance tab ──────────────────────────────────────────
  _renderFinance() {
    FinanceTracker.render();
  },

  // ── Health tab ───────────────────────────────────────────
  _renderHealth() {
    HealthTracker.render();
  },

  // ── Growth tab ───────────────────────────────────────────
  _renderGrowth() {
    if (typeof GoalsTracker !== 'undefined') GoalsTracker.render();
    GrowthTracker.render();
  },

  // ── Tasks tab ────────────────────────────────────────────
  _renderTasks() {
    TasksTracker.render();
  },

  // ── Tab navigation ───────────────────────────────────────
  _bindTabNav() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const tab = btn.dataset.tab;
        this._setActiveTab(tab);
        AppState.currentTab = tab;
        AppState.save();
        this._renderTab(tab);
      });
    });
  },

  _setActiveTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${tab}`));
    // Let scroll-reveal observe newly visible panel content
    setTimeout(() => document.dispatchEvent(new Event('skadi:rendered')), 80);
  },

  // ── Theme toggle ─────────────────────────────────────────
  _bindThemeToggle() {
    const btn = document.getElementById('themeToggle');
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = '1';

    btn.addEventListener('click', () => {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      const next    = isLight ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      AppState.theme = next;
      AppState.save();
      btn.textContent = next === 'dark' ? '☀️ Theme' : '🌙 Theme';

      // Mark all chart caches as dirty so next render forces recreation
      if (typeof HealthTracker !== 'undefined') HealthTracker._themeChanged = true;
      if (typeof FinanceTracker !== 'undefined') FinanceTracker._themeChanged = true;

      // Re-render all charts on the currently visible tab immediately
      const tab = AppState.currentTab;
      if (tab === 'health') {
        HealthTracker.renderSleepChart();
        HealthTracker.renderPhoneChart();
        HealthTracker.renderCholesterolChart();
      }
      if (tab === 'finance')  FinanceTracker.renderCharts();
      if (tab === 'growth')   GrowthTracker.renderWeeklyReviewChart();
      if (tab === 'today') {
        if (typeof StudyTracker !== 'undefined') StudyTracker._renderForestContent?.();
        if (typeof TechStudyTracker !== 'undefined') TechStudyTracker._renderForestContent?.();
      }
    });
    btn.textContent = AppState.theme === 'dark' ? '☀️ Theme' : '🌙 Theme';
  },

  // ── Calendar modal ───────────────────────────────────────
  _bindCalendar() {
    const modal    = document.getElementById('calendarModal');
    const openBtn  = document.getElementById('calendarBtn');
    const closeBtn = document.getElementById('calendarClose');
    const prev     = document.getElementById('prevMonth');
    const next     = document.getElementById('nextMonth');

    // Bind only once to prevent event listener accumulation
    if (modal && !modal.dataset.bound) {
      modal.dataset.bound = '1';

      openBtn?.addEventListener('click', () => {
        modal?.classList.add('active');
        AppState.calendarMonth = new Date(AppState.selectedDate);
        this._renderCalendarGrid();
      });
      closeBtn?.addEventListener('click', () => modal?.classList.remove('active'));
      modal?.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });

      prev?.addEventListener('click', () => {
        AppState.calendarMonth = new Date(AppState.calendarMonth.getFullYear(), AppState.calendarMonth.getMonth() - 1, 1);
        this._renderCalendarGrid();
      });
      next?.addEventListener('click', () => {
        AppState.calendarMonth = new Date(AppState.calendarMonth.getFullYear(), AppState.calendarMonth.getMonth() + 1, 1);
        this._renderCalendarGrid();
      });
    }
  },

  _renderCalendarGrid() {
    const grid  = document.getElementById('calendarGrid');
    const title = document.getElementById('calendarMonthYear');
    if (!grid)  return;

    const { calendarMonth } = AppState;
    const year  = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    if (title) title.textContent = calendarMonth.toLocaleDateString('en-US', { month:'long', year:'numeric' });

    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev  = new Date(year, month, 0).getDate();
    const today       = new Date();

    // Clear grid — build entirely with createElement to preserve all event listeners
    grid.innerHTML = '';

    // Weekday headers
    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(day => {
      const hd = document.createElement('div');
      hd.className = 'calendar-weekday';
      hd.textContent = day;
      grid.appendChild(hd);
    });

    // Leading other-month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const cell = document.createElement('div');
      cell.className = 'calendar-date other-month';
      cell.textContent = daysInPrev - i;
      grid.appendChild(cell);
    }

    // Current month days — click listeners survive because we never touch innerHTML after this
    for (let day = 1; day <= daysInMonth; day++) {
      const d    = new Date(year, month, day);
      const key  = AppState.getDateKey(d);
      const hist = AppState.dailyHistory[key];
      let classes = 'calendar-date';
      if (d.toDateString() === today.toDateString()) classes += ' today';
      if (d.toDateString() === AppState.selectedDate.toDateString()) classes += ' selected';
      if (hist && hist.total > 0) {
        const pct = hist.completed / hist.total;
        classes += pct === 1 ? ' full' : pct > 0.5 ? ' partial' : ' started';
      }
      const cell = document.createElement('div');
      cell.className = classes;
      cell.textContent = day;
      cell.addEventListener('click', () => {
        AppState.selectedDate = new Date(d);
        AppState.calendarMonth = new Date(d);
        AppState.save();
        document.getElementById('calendarModal')?.classList.remove('active');
        this.updateAll();
      });
      grid.appendChild(cell);
    }

    // Trailing other-month days (use appendChild — never innerHTML after listeners are bound)
    const total     = firstDay + daysInMonth;
    const remaining = total <= 35 ? 35 - total : 42 - total;
    for (let i = 1; i <= remaining; i++) {
      const cell = document.createElement('div');
      cell.className = 'calendar-date other-month';
      cell.textContent = i;
      grid.appendChild(cell);
    }
  },

  // ── Holiday toggle ───────────────────────────────────────
  _bindHolidayToggle() {
    const el = document.getElementById('holidaySwitch');
    if (!el || el.dataset.bound) return;
    el.dataset.bound = '1';

    el.addEventListener('click', () => {
      const key = AppState.getDateKey();
      const isWE = AppState.holidayOverrides[key] === 'weekend';
      if (isWE) delete AppState.holidayOverrides[key];
      else AppState.holidayOverrides[key] = 'weekend';
      AppState.save();
      this.updateAll();
    });
  }
};
