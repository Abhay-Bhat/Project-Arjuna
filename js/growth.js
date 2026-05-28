// ============================================================
// Skadi — Growth Tracker
// Career · Books · Reviews · Life Partner
// ============================================================

// ── Dubai Tech Upskilling Plan (Jul 2026 – Jun 2027) ─────────
const TECH_PHASES = [
  {
    id: 'foundation', label: 'Phase 1 — Foundation', period: 'Jul – Sep 2026',
    color: '#00d47c', hoursWeek: '2–3 hrs/week',
    tasks: [
      { id: 'github_repo',   label: 'Create GitHub repo: helm-charts (public + MIT license)' },
      { id: 'helm_basics',   label: 'Learn Helm basics — chart structure, values.yaml, templates' },
      { id: 'chart1_webapp', label: 'Chart 1: web-app (Deployment + Service + Route + ConfigMap)' },
      { id: 'chart2_db',     label: 'Chart 2: database (PostgreSQL + PVC + Service)' },
      { id: 'platform_arch', label: 'Understand OpenShift platform architecture & deploy 1 app' },
    ]
  },
  {
    id: 'cert_start', label: 'Phase 2 — RHCOA Cert Start', period: 'Oct – Dec 2026',
    color: '#5b7fff', hoursWeek: '6–8 hrs/week',
    tasks: [
      { id: 'rhcoa_enroll', label: 'Enroll: RedHat Learning Subscription (USD 500)' },
      { id: 'modules_1_6',  label: 'RHCOA Modules 1–6: architecture, RBAC, networking, storage' },
      { id: 'chart3_cache', label: 'Chart 3: cache (Redis + ConfigMap + Service)' },
      { id: 'modules_7_9',  label: 'RHCOA Modules 7–9: advanced + troubleshooting' },
      { id: 'helm_docs',    label: 'Full chart documentation & README written' },
    ]
  },
  {
    id: 'cert_push', label: 'Phase 3 — Certification Push', period: 'Jan – Mar 2027',
    color: '#ff9933', hoursWeek: '3–5 hrs/week',
    tasks: [
      { id: 'mock_exam_1',    label: 'Mock Exam 1 — target score 65%+ (mid-Jan)' },
      { id: 'mock_exam_2',    label: 'Mock Exam 2 — target score 70%+ (mid-Feb)' },
      { id: 'mock_exam_3',    label: 'Mock Exam 3 — target score 75%+ (mid-Mar)' },
      { id: 'chart4_monitor', label: 'Chart 4: monitoring (Prometheus sidecar, optional)' },
    ]
  },
  {
    id: 'exam_wrap', label: 'Phase 4 — Exam & Wrap-Up', period: 'Apr – Jun 2027',
    color: '#a56eff', hoursWeek: '1–3 hrs/week',
    tasks: [
      { id: 'final_review',   label: 'Final weak-area review & confidence building' },
      { id: 'rhcoa_exam',     label: '🎯 RHCOA Exam (EX280) — May 31, 2027' },
      { id: 'portfolio_done', label: 'GitHub portfolio polished — 3–4 charts, complete docs' },
      { id: 'blog_post',      label: 'Technical blog post published (500–1000 words)' },
    ]
  }
];

// ── Books queue (from the plan) ────────────────────────────
const BOOKS_PLAN = [
  { month: '2026-05', title: 'Atomic Habits',                  author: 'James Clear',         pages: 320, why: 'The habit system behind everything in this plan.' },
  { month: '2026-06', title: 'Deep Work',                      author: 'Cal Newport',          pages: 304, why: 'Study 1.5 hrs with the depth of 4 hrs.' },
  { month: '2026-07', title: "Man's Search for Meaning",       author: 'Viktor Frankl',        pages: 200, why: 'Purpose clarity during isolation abroad.' },
  { month: '2026-08', title: 'The Psychology of Money',        author: 'Morgan Housel',        pages: 256, why: 'Savings discipline and financial peace of mind.' },
  { month: '2026-09', title: 'Why Has Nobody Told Me This Before', author: 'Dr Julie Smith',   pages: 272, why: 'Handles fatigue, low mood, procrastination.' },
  { month: '2026-10', title: 'Ikigai',                         author: 'Hector Garcia',        pages: 208, why: 'Reconcile IAS + DevOps + Dubai + her.' },
  { month: '2026-11', title: 'The Art of Living',              author: 'Epictetus',            pages: 248, why: 'Stoicism for exam pressure and uncertainty.' }
];

// ── Weekly review questions ───────────────────────────────
const WEEKLY_Qs = [
  'Average sleep hours this week? (1=<5h, 5=7h+)',
  'UPSC study sessions completed vs planned? (1=missed all, 5=all done)',
  'Gym / walk sessions completed? (1=0 days, 5=4+ days)',
  'Pastime: any relapses this week? (1=multiple, 5=clean week)',
  'Phone / reels under 1 hr/day on average? (1=far over, 5=under 1hr)',
  'Work: any deliverable missed? (1=missed, 5=ahead)',
  'Emotional state: calm to burnt out? (1=burnt out, 5=calm)',
  'Did you contact parents this week? (1=no, 5=yes+quality)',
  'Loneliness level: managed or spiralling? (1=spiralling, 5=managed well)',
  'Overall week score: honest self-assessment (1–5)'
];

// ── Monthly review domains ────────────────────────────────
const MONTHLY_DOMAINS = [
  { id: 'upsc',       label: 'UPSC',        q: 'Topics completed vs planned? Weakest area? On timeline?' },
  { id: 'career',     label: 'Career',      q: 'Any performance concern? New skill added? Manager relationship?' },
  { id: 'finance',    label: 'Finance',     q: 'Money sent home on 25th? SIP running? Savings vs ₹46L target?' },
  { id: 'health',     label: 'Health',      q: 'Sleep average? Gym sessions? Cholesterol-safe diet maintained?' },
  { id: 'pastime',    label: 'Pastime',     q: 'Total relapses? Trigger pattern identified? Environment changed?' },
  { id: 'loneliness', label: 'Loneliness',  q: 'Isolation moments? What helped? What needs changing?' },
  { id: 'personal',   label: 'Personal',    q: 'Natural contact with her? Called parents consistently?' },
  { id: 'mental',     label: 'Mental',      q: 'Burning out? Need rest day? What am I grateful for?' },
  { id: 'exit_clock', label: 'Exit Clock',  q: 'Months to Jun 1, 2027 notice date? On track for clean exit?' }
];

// ── Book cover images (keyed by month) — separate from content ─
const BOOK_COVERS = {
  '2026-05': 'assets/img/books/atomic-habits.jpg',
  '2026-06': 'assets/img/books/deep-work.jpg',
  '2026-07': 'assets/img/books/mans-search.jpg',
  '2026-08': 'assets/img/books/psychology-money.jpg',
  '2026-09': 'assets/img/books/nobody-told-me.svg',   // SVG placeholder
  '2026-10': 'assets/img/books/ikigai.jpg',
  '2026-11': 'assets/img/books/art-of-living.jpg',
};
// Fallback covers used when a book-specific cover is unavailable
const BOOK_COVER_FALLBACKS = [
  'assets/img/books/fallback-1.jpg',
  'assets/img/books/fallback-2.jpg',
  'assets/img/books/fallback-3.jpg',
];

// ─────────────────────────────────────────────────────────────

const GrowthTracker = {

  render() {
    this.renderTechPlan();
    this.renderTechSummary();
    this.renderBooks();
    this.renderAutoReview();
    this.renderPartnerLog();
    this.renderWeeklyReviewChart();
  },

  // ── Tech Upskilling Plan ─────────────────────────────────
  renderTechPlan() {
    const container = document.getElementById('techPlanContainer');
    if (!container) return;
    const log = AppState.careerLog || {};

    container.innerHTML = TECH_PHASES.map(phase => {
      const total = phase.tasks.length;
      const done  = phase.tasks.filter(t => log[t.id]?.done).length;
      const pct   = total ? Math.round((done / total) * 100) : 0;
      const isComplete = done === total;
      const isActive   = done > 0 && !isComplete;

      return `
        <div class="tech-phase${isComplete ? ' tp-complete' : isActive ? ' tp-active' : ''}"
             style="--phase-color:${phase.color}">
          <div class="tp-head">
            <div>
              <div class="tp-label">${phase.label}</div>
              <div class="tp-meta">${phase.period} &nbsp;·&nbsp; ${phase.hoursWeek}</div>
            </div>
            <div class="tp-score">${isComplete ? '<span class="tp-tick">✓</span>' : `${done}/${total}`}</div>
          </div>
          <div class="tp-bar"><div class="tp-fill" style="width:${pct}%;background:${phase.color}"></div></div>
          <div class="tp-tasks">
            ${phase.tasks.map(t => {
              const s = log[t.id] || {};
              return `<div class="tp-task${s.done ? ' tp-done' : ''}">
                <button class="tp-chk${s.done ? ' on' : ''}" data-phase-task="${esc(t.id)}">${s.done ? '✓' : ''}</button>
                <span class="tp-tlabel">${t.label}</span>
                ${s.done && s.date ? `<span class="tp-tdate">${s.date}</span>` : ''}
              </div>`;
            }).join('')}
          </div>
        </div>`;
    }).join('');

    container.querySelectorAll('[data-phase-task]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.phaseTask;
        AppState.careerLog = AppState.careerLog || {};
        if (AppState.careerLog[id]?.done) {
          delete AppState.careerLog[id];
        } else {
          AppState.careerLog[id] = { done: true, date: AppState.getTodayKey() };
        }
        AppState.save();
        this.renderTechPlan();
        if (typeof UI !== 'undefined') UI.tryCompletePendingActivity('growth');
      });
    });
  },

  renderTechSummary() {
    const el = document.getElementById('techSummary');
    if (!el) return;
    const log = AppState.careerLog || {};
    el.innerHTML = TECH_PHASES.map(p => {
      const total = p.tasks.length;
      const done  = p.tasks.filter(t => log[t.id]?.done).length;
      const pct   = total ? Math.round((done / total) * 100) : 0;
      return `<div class="ts-row">
        <div class="ts-name" style="color:${p.color}">${p.label.split('—')[1]?.trim() || p.label}</div>
        <div class="ts-bar"><div class="ts-fill" style="width:${pct}%;background:${p.color}"></div></div>
        <div class="ts-pct">${done}/${total}</div>
      </div>`;
    }).join('');
  },

  // ── Books ────────────────────────────────────────────────
  renderBooks() {
    const container = document.getElementById('booksContainer');
    if (!container) return;

    container.innerHTML = BOOKS_PLAN.map((b, idx) => {
      const saved       = AppState.booksLog?.[b.month] || {};
      const pages       = saved.pages_read || 0;
      const pct         = b.pages > 0 ? Math.min(Math.round((pages / b.pages) * 100), 100) : 0;
      const isThisMonth = AppState.getTodayKey().startsWith(b.month);
      const isDone      = saved.done || pct === 100;
      // Use specific cover if available, else a deterministic fallback
      const coverSrc    = BOOK_COVERS[b.month] || BOOK_COVER_FALLBACKS[idx % BOOK_COVER_FALLBACKS.length];

      // Status strip color
      const statusColor = isDone ? 'var(--accent-green)' : isThisMonth ? 'var(--accent-blue)' : 'var(--border)';

      return `
        <div class="book-card ${isDone ? 'done' : ''} ${isThisMonth ? 'current' : ''}"
             style="border-top: 3px solid ${statusColor}; display:flex; gap:0; padding:0; overflow:hidden;">

          <!-- Book Cover -->
          <div class="book-cover-wrap" style="
            flex: 0 0 110px; width: 110px;
            background: var(--border);
            position: relative; overflow: hidden;">
            ${coverSrc
              ? `<img src="${esc(coverSrc)}" alt="${esc(b.title)} cover"
                   data-title="${esc(b.title)}"
                   style="width:100%; height:100%; object-fit:cover; display:block;"
                   onerror="GrowthTracker._bookImgFallback(this)">`
              : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;
                             background:linear-gradient(160deg,var(--card),var(--surface));padding:8px;text-align:center;">
                   <span style="font-size:11px;color:var(--text-muted);"></span>
                 </div>`}
            ${isDone ? '<div style="position:absolute;top:6px;right:6px;background:var(--accent-green);color:#fff;font-size:11px;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;">✓</div>' : ''}
            ${isThisMonth && !isDone ? '<div style="position:absolute;bottom:0;left:0;right:0;background:rgba(77,121,255,0.9);color:#fff;font-size:10px;text-align:center;padding:3px 0;font-weight:700;">READING</div>' : ''}
          </div>

          <!-- Book Info -->
          <div style="flex:1;min-width:0;padding:14px 16px;display:flex;flex-direction:column;gap:6px;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <span class="book-month">${this._fmtMonth(b.month)}</span>
            </div>
            <div class="book-title" style="font-size:15px;line-height:1.3;">${esc(b.title)}</div>
            <div class="book-author">— ${b.author}</div>
            <div class="book-why">${b.why}</div>
            <div class="book-progress" style="margin-top:auto;">
              <div class="book-prog-bar">
                <div class="book-prog-fill" style="width:${pct}%"></div>
              </div>
              <span style="font-size:12px;color:var(--text-muted);">${pages} / ${b.pages} pages${pct > 0 ? ` · ${pct}%` : ''}</span>
            </div>
            <div class="book-input-row">
              <input type="number" class="book-pages-input" min="0" max="${b.pages}"
                value="${pages}" placeholder="Pages read" data-month="${b.month}">
              <button class="btn-xs btn-secondary book-save-btn" data-month="${b.month}">Save</button>
              ${isDone ? '<span style="font-size:12px;color:var(--accent-green);font-weight:600;">✓ Complete</span>'
                       : `<button class="btn-xs btn-primary book-done-btn" data-month="${b.month}">Done ✓</button>`}
            </div>
          </div>
        </div>`;
    }).join('');

    container.querySelectorAll('.book-save-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const month = btn.dataset.month;
        const inp   = container.querySelector(`.book-pages-input[data-month="${month}"]`);
        const pages = parseInt(inp?.value) || 0;
        AppState.booksLog = AppState.booksLog || {};
        AppState.booksLog[month] = { ...(AppState.booksLog[month] || {}), pages_read: pages };
        AppState.save();
        this.renderBooks();
        if (typeof UI !== 'undefined') UI.tryCompletePendingActivity('growth');
      });
    });

    container.querySelectorAll('.book-done-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const month = btn.dataset.month;
        AppState.booksLog = AppState.booksLog || {};
        AppState.booksLog[month] = { ...(AppState.booksLog[month] || {}), done: true };
        AppState.save();
        this.renderBooks();
      });
    });
  },

  // ── Auto Coach Review (replaces manual weekly/monthly forms) ─
  renderAutoReview() {
    if (typeof CoachEngine === 'undefined') return;
    const data = CoachEngine.getAutoReview();

    const cdEl = document.getElementById('coachDashboard');
    if (cdEl) {
      cdEl.innerHTML = data.tips.length
        ? `<div class="cd-tips-list">
             ${data.tips.map(t => `
               <div class="cd-tip">
                 <span class="cd-tip-icon">${t.icon}</span>
                 <div class="cd-tip-text">${t.text}</div>
                 ${t.tab ? `<button class="card-tab-link" data-goto="${t.tab}" style="margin-left:auto;flex-shrink:0;">View →</button>` : ''}
               </div>`).join('')}
           </div>
           <div class="cd-updated">Last computed: ${data.lastUpdated}</div>`
        : '<div class="empty-state">No tips right now — all systems look good.</div>';

      cdEl.querySelectorAll('.card-tab-link[data-goto]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (typeof UI !== 'undefined') UI._navigateToTab(btn.dataset.goto);
        });
      });
    }

    const mgsEl = document.getElementById('monthlyGrowthSummary');
    if (mgsEl) {
      mgsEl.innerHTML = data.domains.map(d => `
        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="font-size:13px;font-weight:600;color:var(--text);">${d.label}</span>
              ${d.tab ? `<button class="card-tab-link cd-nav" data-goto="${d.tab}" style="font-size:10px;">→</button>` : ''}
            </div>
            <span style="font-size:14px;font-weight:700;color:${d.color};">${d.score}</span>
          </div>
          <div style="background:var(--border);border-radius:4px;height:6px;overflow:hidden;">
            <div style="width:${d.score}%;height:100%;background:${d.color};border-radius:4px;transition:width 0.4s ease;"></div>
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:3px;">${d.note}</div>
        </div>`).join('');

      mgsEl.querySelectorAll('.cd-nav[data-goto]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (typeof UI !== 'undefined') UI._navigateToTab(btn.dataset.goto);
        });
      });
    }
  },

  // ── Life Partner Log ─────────────────────────────────────
  renderPartnerLog() {
    const form      = document.getElementById('partnerForm');
    const container = document.getElementById('partnerLogContainer');

    if (form && !form.dataset.init) {
      form.dataset.init = '1';
      form.addEventListener('submit', e => {
        e.preventDefault();
        const type = document.getElementById('pType')?.value || 'msg';
        const note = document.getElementById('pNote')?.value || '';
        AppState.partnerLog = AppState.partnerLog || [];
        AppState.partnerLog.push({ id: Date.now(), date: AppState.getTodayKey(), type, note });
        AppState.save();
        form.reset();
        this.renderPartnerLog();
      });
    }

    if (!container) return;
    const log = [...(AppState.partnerLog || [])].reverse().slice(0, 10);
    if (!log.length) {
      container.innerHTML = '<div class="empty-state">No entries yet. Log naturally when contact happens.</div>';
      return;
    }
    const icons = { msg: '💬', call: '📞', meet: '🤝' };
    container.innerHTML = log.map(e => `
      <div class="partner-entry">
        <span class="pe-icon">${icons[esc(e.type)] || '·'}</span>
        <span class="pe-date">${esc(e.date)}</span>
        <span class="pe-type">${esc(e.type)}</span>
        <span class="pe-note">${esc(e.note) || '—'}</span>
        <button class="btn-xs btn-danger" data-del-partner="${esc(e.id)}">✕</button>
      </div>`).join('');

    container.querySelectorAll('[data-del-partner]').forEach(btn => {
      btn.addEventListener('click', () => {
        AppState.partnerLog = (AppState.partnerLog || []).filter(e => e.id !== parseInt(btn.dataset.delPartner));
        AppState.save();
        this.render();
      });
    });
  },

  _bookImgFallback(img) {
    const parent = img.parentElement;
    const div = document.createElement('div');
    div.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(160deg,var(--card),var(--surface));padding:8px;text-align:center;';
    const span = document.createElement('span');
    span.style.cssText = 'font-size:11px;color:var(--text-muted);';
    span.textContent = img.dataset.title || '';
    div.appendChild(span);
    parent.innerHTML = '';
    parent.appendChild(div);
  },

  // ── Helpers ──────────────────────────────────────────────
  _weekKey() {
    const d   = new Date();
    const jan = new Date(d.getFullYear(), 0, 1);
    const wk  = Math.ceil(((d - jan) / 864e5 + jan.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${String(wk).padStart(2,'0')}`;
  },

  _weekLabel() {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay()); // Sunday
    return d.toLocaleDateString('en-IN', { day:'numeric', month:'short' });
  },

  _fmtMonth(ym) {
    const [y, m] = ym.split('-');
    const names = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${names[parseInt(m)]} ${y}`;
  },

  // ── Study Hours — Last 7 Days bar chart ──────────────────
  renderWeeklyReviewChart() {
    const canvas = document.getElementById('weeklyReviewChart');
    if (!canvas || typeof CoachEngine === 'undefined') return;

    const hours   = CoachEngine._studyHours(7).reverse(); // oldest first
    const today   = new Date();
    const labels  = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString('en-IN', { weekday: 'short' }));
    }

    if (window.weeklyReviewChartInstance) { window.weeklyReviewChartInstance.destroy(); }

    const isDark    = document.documentElement.getAttribute('data-theme') !== 'light';
    const textColor = isDark ? '#697098' : '#5a6380';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const goalH     = parseFloat(localStorage.getItem('skadi_study_goal') || '4');

    window.weeklyReviewChartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Hours studied',
          data: hours,
          backgroundColor: hours.map(h =>
            h >= goalH ? 'rgba(0,212,124,0.75)'
            : h >= goalH * 0.5 ? 'rgba(255,165,0,0.65)'
            : 'rgba(255,80,80,0.55)'),
          borderRadius: 4,
        }, {
          label: `Goal (${goalH}h)`,
          data: Array(7).fill(goalH),
          type: 'line',
          borderColor: 'rgba(92,128,255,0.55)',
          borderWidth: 1.5,
          borderDash: [4, 4],
          pointRadius: 0,
          fill: false,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: textColor, font: { family: 'Inter, Segoe UI, system-ui, sans-serif', size: 12 } } } },
        scales: {
          x: { ticks: { color: textColor, font: { size: 11 } }, grid: { color: gridColor } },
          y: { min: 0, suggestedMax: Math.max(goalH + 1, ...hours) + 0.5,
               ticks: { color: textColor, stepSize: 1 }, grid: { color: gridColor } }
        }
      }
    });
  },
};
