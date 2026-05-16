// ============================================================
// ATHENA — Growth Tracker
// Career · Books · Reviews · Life Partner
// ============================================================

// ── Career milestones ────────────────────────────────────────
const CAREER_MILESTONES = [
  { id: 'ai_pipelines',  quarter: 'Oct–Dec 2026', label: 'GitHub Copilot + AI-assisted pipelines',   why: 'AI in DevOps is the immediate trend.' },
  { id: 'cka_cert',      quarter: 'Jan–Mar 2027', label: 'CKA / OpenShift certification exam',        why: 'Validates existing hands-on skill.' },
  { id: 'platform_eng',  quarter: 'Apr–Jun 2027', label: 'Platform Engineering concepts',             why: 'The next evolution of DevOps.' },
  { id: 'india_role',    quarter: 'Post-return',   label: 'India DevOps role ₹18–22 LPA (if needed)', why: 'Backup if UPSC 2028 needs a year off.' },
  { id: 'exec_mba_eval', quarter: 'Post 2028',     label: 'IIM/ISB Exec MBA evaluation',              why: 'Live, funded backup. Not a dusty footnote.' }
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
  'NoFap: any relapses this week? (1=multiple, 5=clean)',
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
  { id: 'nofap',      label: 'NoFap',       q: 'Total relapses? Pattern identified? Environment adjusted?' },
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
    this.renderCareer();
    this.renderBooks();
    this.renderWeeklyReview();
    this.renderMonthlyReview();
    this.renderPartnerLog();
    this.renderWeeklyReviewChart();
    this.renderMonthlySummary();
  },

  // ── Career ───────────────────────────────────────────────
  renderCareer() {
    const grid = document.getElementById('careerGrid');
    if (!grid) return;

    grid.innerHTML = CAREER_MILESTONES.map(m => {
      const saved = AppState.careerLog?.[m.id] || {};
      return `
        <div class="career-card ${saved.done ? 'done' : ''}">
          <div class="cc-header">
            <div class="cc-quarter">${m.quarter}</div>
            ${saved.done ? '<span class="cc-tick">✓</span>' : ''}
          </div>
          <div class="cc-label">${m.label}</div>
          <div class="cc-why">${m.why}</div>
          ${saved.done
            ? `<div class="cc-done-date">Completed ${esc(saved.date || '')}</div>`
            : `<div class="cc-actions">
                <input type="text" class="cc-note-input" placeholder="Add note..." value="${esc(saved.note || '')}">
                <button class="btn-xs btn-primary cc-done-btn" data-id="${esc(m.id)}">Mark Done</button>
               </div>`
          }
        </div>`;
    }).join('');

    grid.querySelectorAll('.cc-done-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id   = btn.dataset.id;
        const note = btn.closest('.career-card').querySelector('.cc-note-input')?.value || '';
        AppState.careerLog = AppState.careerLog || {};
        AppState.careerLog[id] = { done: true, date: AppState.getTodayKey(), note };
        AppState.save();
        this.renderCareer();
      });
    });
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

  // ── Weekly Review ────────────────────────────────────────
  renderWeeklyReview() {
    const container = document.getElementById('weeklyReviewForm');
    if (!container || container.dataset.init) return;
    container.dataset.init = '1';

    const weekKey = this._weekKey();
    const saved   = AppState.weeklyReviews?.[weekKey] || {};

    container.innerHTML = `
      <div class="review-header">
        Week of ${this._weekLabel()} — Sun 20-min check-in
        ${saved.submitted_at ? `<span class="submitted-badge">Submitted ✓</span>` : ''}
      </div>
      ${WEEKLY_Qs.map((q, i) => `
        <div class="review-q">
          <label class="review-qlabel">Q${i+1}. ${q}</label>
          <div class="star-row" data-q="${i}">
            ${[1,2,3,4,5].map(v => `
              <button type="button" class="star-btn ${(saved.answers?.[i] || 0) >= v ? 'active' : ''}"
                data-val="${v}">★</button>`).join('')}
            <span class="star-score">${saved.answers?.[i] || 0}/5</span>
          </div>
        </div>`).join('')}
      <div class="review-actions">
        <button class="btn btn-primary" id="weeklySubmitBtn">Submit Review</button>
        ${saved.submitted_at ? `<span class="review-ts">Last submitted: ${saved.submitted_at}</span>` : ''}
      </div>`;

    // Star interactions
    container.querySelectorAll('.star-row').forEach(row => {
      row.querySelectorAll('.star-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const val = parseInt(btn.dataset.val);
          const qi  = parseInt(row.dataset.q);
          row.querySelectorAll('.star-btn').forEach((b, idx) => b.classList.toggle('active', idx < val));
          row.querySelector('.star-score').textContent = val + '/5';
          // Store temp
          if (!row.dataset.val) row.setAttribute('data-current', val);
          else row.setAttribute('data-current', val);
        });
      });
    });

    document.getElementById('weeklySubmitBtn')?.addEventListener('click', () => {
      const answers = [];
      container.querySelectorAll('.star-row').forEach(row => {
        const active = row.querySelectorAll('.star-btn.active').length;
        answers.push(active);
      });
      AppState.weeklyReviews = AppState.weeklyReviews || {};
      AppState.weeklyReviews[weekKey] = {
        answers,
        submitted_at: new Date().toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })
      };
      AppState.save();
      container.dataset.init = '';
      this.renderWeeklyReview();
    });
  },

  // ── Monthly Review ───────────────────────────────────────
  renderMonthlyReview() {
    const container = document.getElementById('monthlyReviewForm');
    if (!container || container.dataset.init) return;
    container.dataset.init = '1';

    const monthKey = AppState.getTodayKey().slice(0, 7);
    const saved    = AppState.monthlyReviews?.[monthKey] || {};

    container.innerHTML = `
      <div class="review-header">
        ${this._fmtMonth(monthKey)} Monthly Review — 45 min
        ${saved.submitted_at ? `<span class="submitted-badge">Submitted ✓</span>` : ''}
      </div>
      ${MONTHLY_DOMAINS.map(d => {
        const prev = saved.domains?.[d.id];
        const savedScore = prev?.score || 0;
        const savedNote  = prev?.note  || '';
        return `
          <div class="review-domain">
            <div class="rd-label">${d.label}</div>
            <div class="rd-q">${d.q}</div>
            <div class="star-row" data-domain="${d.id}" style="margin-bottom:8px;">
              ${[1,2,3,4,5].map(v => `
                <button type="button" class="star-btn ${savedScore >= v ? 'active' : ''}"
                  data-val="${v}">★</button>`).join('')}
              <span class="star-score">${savedScore || 0}/5</span>
            </div>
            <textarea class="rd-textarea" data-domain-note="${d.id}"
              placeholder="Your reflection (optional)..." rows="2">${savedNote}</textarea>
          </div>`;
      }).join('')}
      <div class="review-actions">
        <button class="btn btn-primary" id="monthlySubmitBtn">Submit Monthly Review</button>
        ${saved.submitted_at ? `<span class="review-ts">Last submitted: ${saved.submitted_at}</span>` : ''}
      </div>`;

    // Star interactions for monthly review
    container.querySelectorAll('.star-row').forEach(row => {
      row.querySelectorAll('.star-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const val = parseInt(btn.dataset.val);
          row.querySelectorAll('.star-btn').forEach((b, idx) => b.classList.toggle('active', idx < val));
          row.querySelector('.star-score').textContent = val + '/5';
        });
      });
    });

    document.getElementById('monthlySubmitBtn')?.addEventListener('click', () => {
      const domains = {};
      container.querySelectorAll('.star-row[data-domain]').forEach(row => {
        const id    = row.dataset.domain;
        const score = row.querySelectorAll('.star-btn.active').length;
        const note  = container.querySelector(`[data-domain-note="${id}"]`)?.value || '';
        domains[id] = { score, note };
      });
      AppState.monthlyReviews = AppState.monthlyReviews || {};
      AppState.monthlyReviews[monthKey] = {
        domains,
        submitted_at: new Date().toLocaleString('en-IN', { day:'numeric', month:'short', year:'numeric' })
      };
      AppState.save();
      container.dataset.init = '';
      this.renderMonthlyReview();
      if (typeof UI !== 'undefined') UI.tryCompletePendingActivity('growth');
    });
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

  // ── Weekly Review Scores Chart ────────────────────────────
  renderWeeklyReviewChart() {
    const canvas = document.getElementById('weeklyReviewChart');
    if (!canvas) return;

    const reviews = AppState.weeklyReviews || {};
    const keys = Object.keys(reviews).sort().slice(-8); // last 8 weeks

    if (!keys.length) {
      canvas.parentElement.innerHTML = '<div class="empty-state" style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;">No weekly reviews yet. Complete a Sunday review to see trends.</div>';
      return;
    }

    const labels = keys.map(k => k.replace(/^\d{4}-/, ''));
    const avgData = keys.map(k => {
      const r = reviews[k];
      const vals = (r.answers || [r.q1,r.q2,r.q3,r.q4,r.q5,r.q6,r.q7,r.q8,r.q9,r.q10]).filter(v => v != null && v > 0);
      return vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1) : null;
    });

    if (window.weeklyReviewChartInstance) { window.weeklyReviewChartInstance.destroy(); }

    const isDark    = document.documentElement.getAttribute('data-theme') !== 'light';
    const textColor = isDark ? '#697098' : '#5a6380';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

    window.weeklyReviewChartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Avg Weekly Score (1–5)',
          data: avgData,
          borderColor: '#a56eff',
          backgroundColor: 'rgba(165,110,255,0.12)',
          tension: 0.4,
          pointRadius: 5,
          fill: true,
          spanGaps: true
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: textColor, font: { family: 'Aptos, Segoe UI, system-ui, sans-serif', size: 12 } } } },
        scales: {
          x: { ticks: { color: textColor, font: { family: 'Aptos, Segoe UI, system-ui, sans-serif', size: 11 } }, grid: { color: gridColor } },
          y: { min: 1, max: 5, ticks: { color: textColor, stepSize: 1 }, grid: { color: gridColor } }
        }
      }
    });
  },

  // ── Monthly Growth Summary ────────────────────────────────
  renderMonthlySummary() {
    const container = document.getElementById('monthlyGrowthSummary');
    if (!container) return;

    const reviews = AppState.monthlyReviews || {};
    const keys = Object.keys(reviews).sort().slice(-3);

    if (!keys.length) {
      container.innerHTML = '<div class="empty-state" style="padding:16px;text-align:center;color:var(--text-muted);font-size:13px;">No monthly reviews yet. Complete your first review above.</div>';
      return;
    }

    container.innerHTML = keys.reverse().map(k => {
      const r = reviews[k];
      const domains = r.domains || {};
      const filled = Object.values(domains).filter(v => v?.score != null);
      const avg = filled.length ? (filled.reduce((s,d) => s + (d.score||0), 0) / filled.length).toFixed(1) : '—';

      const domainBars = MONTHLY_DOMAINS.map(d => {
        const entry = domains[d.id];
        const score = entry?.score;
        const pct = score ? (score / 5) * 100 : 0;
        const color = score >= 4 ? 'var(--accent-green)' : score >= 3 ? 'var(--accent-amber)' : 'var(--accent-rose)';
        return `<div style="margin-bottom:6px;">
          <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px;">
            <span style="color:var(--text-muted)">${d.label}</span>
            <span style="color:var(--text);font-weight:600">${score ?? '—'}/5</span>
          </div>
          <div style="background:var(--border);border-radius:3px;height:4px;overflow:hidden;">
            <div style="width:${pct}%;height:100%;background:${color};transition:width 0.4s ease;"></div>
          </div>
          ${entry?.note ? `<div style="font-size:10px;color:var(--text-faint);margin-top:2px;">${esc(entry.note)}</div>` : ''}
        </div>`;
      }).join('');

      return `<div class="stat-card" style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div style="font-size:14px;font-weight:600;color:var(--text);">${this._fmtMonth(k)}</div>
          <div style="font-family:'Space Mono',monospace;font-size:18px;font-weight:700;color:var(--accent-violet);">${avg}/5</div>
        </div>
        ${domainBars}
      </div>`;
    }).join('');
  }
};
