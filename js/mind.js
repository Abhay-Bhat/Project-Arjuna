// ============================================================
// Skadi — Mind Tracker
// Pastime · Loneliness · Meditation · Parents Contact
// ============================================================

const PASTIME_REASONS = [
  'Loneliness (post-work evening)',
  'Boredom (weekend)',
  'Stress (exam/work)',
  'Phone scrolling',
  'Isolation (night)',
  'Other'
];

const LONELINESS_LABELS = [
  '', 'Thriving 😌', 'Managed 🙂', 'Neutral 😐', 'Difficult 😔', 'Spiralling 😰'
];

const MindTracker = {

  render() {
    this.renderPastime();
    this.renderTodayForm();
    this.renderLonelinessChart();
    this.renderMeditationChart();
    this.renderParentsCallChart();
    this.renderResetLog();
    this.renderProtocol();
  },

  // ── Pastime streak card ──────────────────────────────────
  renderPastime() {
    const streak = AppState.getPastimeStreak();
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

    set('pastimeStreak', streak);
    set('pastimeDays',   streak === 1 ? 'day' : 'days');
    set('pastimeStart',  AppState.pastimeStart
      ? new Date(AppState.pastimeStart).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
      : 'Not started');

    // Milestone badges
    const milestones = [7, 21, 30, 60, 90];
    const badgesEl = document.getElementById('pastimeBadges');
    if (badgesEl) {
      badgesEl.innerHTML = milestones.map(m => `
        <div class="pastime-badge ${streak >= m ? 'earned' : ''}">
          <span class="badge-num">${m}</span>
          <span class="badge-label">day${m > 1 ? 's' : ''}</span>
        </div>`).join('');
    }

    // Button states
    const startBtn   = document.getElementById('pastimeStartBtn');
    const resetBtn   = document.getElementById('pastimeResetBtn');
    if (startBtn) startBtn.style.display = AppState.pastimeStart ? 'none' : 'inline-flex';
    if (resetBtn) resetBtn.style.display = AppState.pastimeStart ? 'inline-flex' : 'none';
  },

  // ── Today's check-ins ────────────────────────────────────
  renderTodayForm() {
    const form = document.getElementById('mindTodayForm');
    if (!form) return;

    const slider    = document.getElementById('mLoneliness');
    const sliderLbl = document.getElementById('mLonelinessLbl');
    const medEl     = document.getElementById('mMeditation');
    const parentsEl = document.getElementById('mParents');

    // Always update values for the selected date
    const rec = AppState.getSelectedMind();
    if (slider) {
      slider.value = rec.loneliness || 3;
      if (sliderLbl) sliderLbl.textContent = LONELINESS_LABELS[slider.value];
    }
    if (medEl)     medEl.value      = rec.meditation_min || '';
    if (parentsEl) parentsEl.checked = rec.parents || false;

    // Bind events only once
    if (!form.dataset.init) {
      form.dataset.init = '1';

      if (slider) {
        slider.addEventListener('input', () => {
          if (sliderLbl) sliderLbl.textContent = LONELINESS_LABELS[slider.value];
        });
      }

      const save = () => {
        AppState.setSelectedMind({
          loneliness:     slider    ? parseInt(slider.value)    : null,
          meditation_min: medEl     ? parseInt(medEl.value)     || 0 : 0,
          parents:        parentsEl ? parentsEl.checked          : false
        });
        this.renderLonelinessChart();
        if (typeof UI !== 'undefined') {
          UI.syncQuickCheckins();
          UI.tryCompletePendingActivity('mind');
        }
      };

      [slider, medEl].forEach(el => el?.addEventListener('change', save));
      parentsEl?.addEventListener('change', save);
    }
  },

  // ── Loneliness trend chart ───────────────────────────────
  renderLonelinessChart() {
    const canvas = document.getElementById('lonelinessChart');
    if (!canvas) return;

    const labels = [], data = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }));
      const v = AppState.mindLog[AppState.getDateKey(d)]?.loneliness;
      data.push(v != null ? v : null);
    }

    if (window._lonelinessChart) { window._lonelinessChart.destroy(); }

    const isDark    = document.documentElement.getAttribute('data-theme') !== 'light';
    const textColor = isDark ? '#697098' : '#5a6380';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

    window._lonelinessChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Loneliness (1=Thriving, 5=Spiralling)',
          data,
          borderColor: '#a56eff',
          backgroundColor: 'rgba(165,110,255,0.12)',
          tension: 0.4,
          pointRadius: 4,
          fill: true,
          spanGaps: true
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: textColor, font: { family: 'Aptos, Segoe UI, system-ui, sans-serif' } } } },
        scales: {
          x: { ticks: { color: textColor }, grid: { color: gridColor } },
          y: { min: 1, max: 5, ticks: { color: textColor, stepSize: 1 }, grid: { color: gridColor } }
        }
      }
    });
  },

  // ── Meditation trend chart ───────────────────────────────
  renderMeditationChart() {
    const canvas = document.getElementById('meditationChart');
    if (!canvas) return;

    const labels = [], data = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }));
      const v = AppState.mindLog[AppState.getDateKey(d)]?.meditation_min;
      data.push(v != null ? v : null);
    }

    if (window._meditationChart) { window._meditationChart.destroy(); }

    const isDark    = document.documentElement.getAttribute('data-theme') !== 'light';
    const textColor = isDark ? '#697098' : '#5a6380';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

    window._meditationChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Meditation (min)',
          data,
          backgroundColor: 'rgba(0,212,200,0.55)',
          borderColor: 'rgba(0,212,200,0.9)',
          borderWidth: 1,
          borderRadius: 4,
          spanGaps: true
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: textColor, font: { family: 'Aptos, Segoe UI, system-ui, sans-serif', size: 12 } } } },
        scales: {
          x: { ticks: { color: textColor, font: { family: 'Aptos, Segoe UI, system-ui, sans-serif', size: 11 } }, grid: { color: gridColor } },
          y: { min: 0, ticks: { color: textColor, stepSize: 10, font: { family: 'Aptos, Segoe UI, system-ui, sans-serif', size: 11 } }, grid: { color: gridColor } }
        }
      }
    });
  },

  // ── Parents call frequency chart ─────────────────────────
  renderParentsCallChart() {
    const canvas = document.getElementById('parentsCallChart');
    if (!canvas) return;

    // Show last 8 weeks of parents call frequency
    const labels = [], data = [];
    for (let w = 7; w >= 0; w--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - w * 7 - weekStart.getDay() + 1);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      let count = 0;
      for (let d2 = new Date(weekStart); d2 <= weekEnd; d2.setDate(d2.getDate() + 1)) {
        if (AppState.mindLog[AppState.getDateKey(d2)]?.parents) count++;
      }
      labels.push(weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      data.push(count);
    }

    if (window._parentsChart) { window._parentsChart.destroy(); }

    const isDark    = document.documentElement.getAttribute('data-theme') !== 'light';
    const textColor = isDark ? '#697098' : '#5a6380';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

    window._parentsChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Days called parents',
          data,
          backgroundColor: data.map(v => v >= 1 ? 'rgba(0,212,124,0.6)' : 'rgba(105,112,152,0.2)'),
          borderRadius: 4
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: textColor, font: { family: 'Aptos, Segoe UI, system-ui, sans-serif', size: 12 } } } },
        scales: {
          x: { ticks: { color: textColor, font: { family: 'Aptos, Segoe UI, system-ui, sans-serif', size: 11 } }, grid: { color: gridColor } },
          y: { min: 0, max: 7, ticks: { color: textColor, stepSize: 1 }, grid: { color: gridColor } }
        }
      }
    });
  },

  // ── Reset log & Pastime actions ──────────────────────────
  renderResetLog() {
    const container = document.getElementById('pastimeResetLog');
    if (!container) return;

    const log = [...(AppState.pastimeLog || [])].reverse().slice(0, 10);
    if (!log.length) {
      container.innerHTML = '<div class="empty-state">No entries logged. Clean slate. 💪</div>';
      return;
    }

    container.innerHTML = log.map(e => `
      <div class="pastime-reset-item ${esc(e.type)}">
        <span class="ri-date">${esc(e.date)}</span>
        <span class="ri-type ${esc(e.type)}">${e.type === 'reset' ? '❌ Reset' : '✅ Check-in'}</span>
        <span class="ri-trigger">${esc(e.reason) || '—'}</span>
        <span class="ri-note">${esc(e.note)}</span>
        <button class="btn-xs btn-danger" data-del-pastime-reset="${esc(e.date)}">✕</button>
      </div>`).join('');

    container.querySelectorAll('[data-del-pastime-reset]').forEach(btn => {
      btn.addEventListener('click', () => {
        AppState.pastimeLog = (AppState.pastimeLog || []).filter(e => e.date !== btn.dataset.delPastimeReset);
        AppState.save();
        this.render();
      });
    });
  },

  // ── Loneliness protocol (read-only reference) ────────────
  renderProtocol() {
    // Static render — already in HTML, just need to compute next parents call
    const log = Object.entries(AppState.mindLog)
      .filter(([, v]) => v.parents)
      .map(([k]) => k)
      .sort();
    const lastCall = log.length ? log[log.length - 1] : null;
    const el = document.getElementById('lastParentsCall');
    if (el) el.textContent = lastCall
      ? new Date(lastCall).toLocaleDateString('en-IN', { day:'numeric', month:'short' })
      : 'Not logged yet';
  },

  // ── Event bindings (called once) ────────────────────────
  bindEvents() {
    // Start streak
    document.getElementById('pastimeStartBtn')?.addEventListener('click', () => {
      AppState.startStreak();
      this.renderPastime();
    });

    // Log Reset button — scroll to the reset form in the main pane
    document.getElementById('pastimeResetBtn')?.addEventListener('click', () => {
      const panel = document.getElementById('pastimeResetPanel');
      if (panel) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const reason = document.getElementById('pastimeResetReason');
        if (reason) setTimeout(() => reason.focus(), 300);
      }
    });

    // Reset submit
    document.getElementById('pastimeResetSubmitBtn')?.addEventListener('click', () => {
      const reason = document.getElementById('pastimeResetReason')?.value || 'Other';
      const note   = document.getElementById('pastimeResetNote')?.value || '';
      AppState.logReset(reason, note);
      this.renderPastime();
      this.renderResetLog();
      document.getElementById('pastimeResetPanel')?.classList.remove('open');
      document.getElementById('pastimeResetReason').value = '';
      document.getElementById('pastimeResetNote').value   = '';
    });
  }
};
