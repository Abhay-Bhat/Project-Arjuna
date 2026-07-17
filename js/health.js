// ============================================================
// Skadi — Health Tracker
// ============================================================

const HealthTracker = {

  render() {
    this.renderTodayForm();
    this.renderWeekSummary();
    this.renderHealthScoreHero();
    this.renderSleepChart();
    this.renderPhoneChart();
    this.renderCholesterolLog();
    this.renderGymHeatmap();
    this._initHealthModules();
  },

  renderHealthScoreHero() {
    const el = document.getElementById('healthScoreHero');
    if (!el) return;

    const h = AppState.getSelectedHealth();
    const sleepScore = h.sleep_h ? Math.min(h.sleep_h / 7 * 25, 25) : 0;
    const gymScore = h.gym ? 25 : 0;
    const phoneScore = h.phone_h != null ? Math.max(0, (2 - h.phone_h) / 2 * 25) : 0;

    let nutritionDone = 0;
    if (window.ArjunaHealth) {
      const log = ArjunaHealth.getTodayNutritionLog();
      nutritionDone = log ? Object.values(log).filter(Boolean).length : 0;
    }
    const nutritionScore = (nutritionDone / 7) * 25;
    const total = Math.round(sleepScore + gymScore + phoneScore + nutritionScore);

    const chip = (label, val, threshold) => {
      const cls = val >= threshold ? 'good' : val > 0 ? 'warn' : 'bad';
      return `<span class="health-chip ${cls}">${label}</span>`;
    };

    el.innerHTML = `
      <div class="health-score-label">TODAY'S HEALTH SCORE</div>
      <div class="health-score-big">${total}</div>
      <div class="health-score-label" style="margin-top:4px;">out of 100</div>
      <div class="health-status-chips">
        ${chip(h.sleep_h ? '😴 ' + h.sleep_h + 'h sleep' : '😴 No sleep data', sleepScore, 20)}
        ${chip(h.gym ? '🏋️ Gym done' : '🏋️ No gym', gymScore, 25)}
        ${chip(h.phone_h != null ? '📱 ' + h.phone_h + 'h phone' : '📱 No phone data', phoneScore, 15)}
        ${chip('🥗 ' + nutritionDone + '/7 nutrition', nutritionScore, 18)}
      </div>
    `;
  },

  // ── Health Modules init (blood markers, nutrition, meal plan, supplements) ──
  _initHealthModules() {
    if (!window.ArjunaHealth) return;
    this._seedBloodTestOnce();
    const retestEl = document.getElementById('retest-countdown');
    if (retestEl) retestEl.textContent = `Retest in ${ArjunaHealth.getDaysToRetest()} days`;
    renderTodayMealPlan();
    updateNutritionScore();
    renderSupplementTracker();
  },

  _seedBloodTestOnce() {
    const FLAG = 'arjuna_cholesterol_seeded_v1';
    if (localStorage.getItem(FLAG)) return;
    const already = (AppState.cholesterol || []).some(r => r.id === 'seed_20260510');
    if (!already) {
      AppState.cholesterol = AppState.cholesterol || [];
      AppState.cholesterol.unshift({
        id: 'seed_20260510', date: '2026-05-10',
        ldl: 155.6, hdl: 36, total: 221,
        notes: 'Redcliffe Labs full body checkup. LDL high, HDL low, Vit D/B12 critical.',
      });
      AppState.save();
    }
    localStorage.setItem(FLAG, 'true');
  },

  renderTodayForm() {
    const form = document.getElementById('healthTodayForm');
    if (!form) return;

    const sleepEl = document.getElementById('hSleep');
    const gymEl   = document.getElementById('hGym');
    const phoneEl = document.getElementById('hPhone');

    // Always update values for the selected date
    const rec = AppState.getSelectedHealth();
    if (sleepEl) sleepEl.value = rec.sleep_h != null ? rec.sleep_h : '';
    if (gymEl)   gymEl.checked   = rec.gym    || false;
    if (phoneEl) phoneEl.value = rec.phone_h != null ? rec.phone_h : '';

    // Bind save events only once
    if (!form.dataset.init) {
      form.dataset.init = '1';

      const save = () => {
        AppState.setSelectedHealth({
          sleep_h: sleepEl ? parseFloat(sleepEl.value) || null : null,
          gym:     gymEl   ? gymEl.checked              : false,
          phone_h: phoneEl ? parseFloat(phoneEl.value) || null : null
        });
        this.renderWeekSummary();
        this.renderSleepChart();
        // Check if sleep/gym was saved to complete pending activity
        if (typeof UI !== 'undefined') {
          UI.syncQuickCheckins();
          UI.tryCompletePendingActivity('health');
        }
      };

      [sleepEl, phoneEl].forEach(el => el?.addEventListener('change', save));
      gymEl?.addEventListener('change', save);
    }
  },

  renderWeekSummary() {
    const avgSleep = AppState.getLast7SleepAvg();
    const gymCount = AppState.getWeekGymCount();

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

    set('hAvgSleep', avgSleep != null ? avgSleep + 'h' : '—');
    set('hGymCount', gymCount + ' / 4');

    const sleepStatus = avgSleep == null ? 'neutral'
      : parseFloat(avgSleep) >= 7 ? 'good' : 'warn';
    const gymStatus   = gymCount >= 4 ? 'good' : gymCount >= 2 ? 'warn' : 'bad';

    const setStat = (id, cls) => {
      const el = document.getElementById(id);
      if (el) { el.className = 'stat-indicator'; el.classList.add(cls); }
    };
    setStat('hSleepStat', sleepStatus);
    setStat('hGymStat',   gymStatus);

    // Phone average
    let phoneVals = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const v = AppState.healthLog[AppState.getDateKey(d)]?.phone_h;
      if (v != null) phoneVals.push(v);
    }
    const avgPhone = phoneVals.length
      ? (phoneVals.reduce((a,b)=>a+b,0) / phoneVals.length).toFixed(1)
      : null;
    set('hAvgPhone', avgPhone != null ? avgPhone + 'h' : '—');
    setStat('hPhoneStat', avgPhone == null ? 'neutral' : parseFloat(avgPhone) <= 1 ? 'good' : 'warn');
  },

  renderSleepChart() {
    const canvas = document.getElementById('sleepChart');
    if (!canvas) return;

    const labels = [], data = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }));
      const v = AppState.healthLog[AppState.getDateKey(d)]?.sleep_h;
      data.push(v != null ? v : null);
    }

    // Create simple data hash to check if update needed
    const dataHash = JSON.stringify(data);
    if (this._sleepChartHash === dataHash && window._sleepChart && !this._themeChanged) {
      return; // Data unchanged, don't recreate
    }
    this._sleepChartHash = dataHash;
    this._themeChanged = false;

    if (window._sleepChart) { window._sleepChart.destroy(); }

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const textColor = isDark ? '#697098' : '#5a6380';

    window._sleepChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Sleep (hours)',
          data,
          backgroundColor: data.map(v =>
            v == null ? 'rgba(105,112,152,0.2)'
            : v >= 7   ? 'rgba(0,212,124,0.7)'
                       : 'rgba(255,178,48,0.7)'),
          borderRadius: 6,
          borderSkipped: false
        }, {
          label: '7h Target',
          data: labels.map(() => 7),
          type: 'line',
          borderColor: 'rgba(0,212,124,0.4)',
          borderDash: [4,4],
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: textColor, font: { family: 'Aptos, Segoe UI, system-ui, sans-serif', size: 12 } } } },
        scales: {
          x: { ticks: { color: textColor, font: { family: 'Aptos, Segoe UI, system-ui, sans-serif', size: 11 } }, grid: { color: gridColor } },
          y: { min: 0, max: 10, ticks: { color: textColor, stepSize: 1, font: { family: 'Aptos, Segoe UI, system-ui, sans-serif', size: 11 } }, grid: { color: gridColor } }
        }
      }
    });
  },

  renderPhoneChart() {
    const canvas = document.getElementById('phoneChart');
    if (!canvas) return;

    const labels = [], data = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }));
      const v = AppState.healthLog[AppState.getDateKey(d)]?.phone_h;
      data.push(v != null ? v : null);
    }

    const dataHash = JSON.stringify(data);
    if (this._phoneChartHash === dataHash && window._phoneChart && !this._themeChanged) {
      return;
    }
    this._phoneChartHash = dataHash;
    this._themeChanged = false;

    if (window._phoneChart) { window._phoneChart.destroy(); }

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const textColor = isDark ? '#697098' : '#5a6380';

    window._phoneChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Phone Usage (hours)',
          data,
          borderColor: 'rgba(255, 92, 128, 0.8)',
          backgroundColor: 'rgba(255, 92, 128, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgba(255, 92, 128, 0.8)',
          pointRadius: 4,
          pointHoverRadius: 6
        }, {
          label: '1h Ideal Target',
          data: labels.map(() => 1),
          type: 'line',
          borderColor: 'rgba(0, 212, 124, 0.4)',
          borderDash: [4, 4],
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: textColor, font: { family: 'Aptos, Segoe UI, system-ui, sans-serif', size: 12 } } } },
        scales: {
          x: { ticks: { color: textColor, font: { family: 'Aptos, Segoe UI, system-ui, sans-serif', size: 11 } }, grid: { color: gridColor } },
          y: { min: 0, max: 4, ticks: { color: textColor, stepSize: 1, font: { family: 'Aptos, Segoe UI, system-ui, sans-serif', size: 11 } }, grid: { color: gridColor } }
        }
      }
    });
  },

  renderCholesterolLog() {
    const form = document.getElementById('cholForm');
    if (form && !form.dataset.init) {
      form.dataset.init = '1';
      form.addEventListener('submit', e => {
        e.preventDefault();
        const entry = {
          id:    Date.now(),
          date:  document.getElementById('cholDate')?.value || AppState.getTodayKey(),
          ldl:   parseFloat(document.getElementById('cholLDL')?.value)   || null,
          hdl:   parseFloat(document.getElementById('cholHDL')?.value)   || null,
          total: parseFloat(document.getElementById('cholTotal')?.value) || null,
          notes: document.getElementById('cholNotes')?.value || ''
        };
        AppState.cholesterol.push(entry);
        AppState.cholesterol.sort((a,b)=>a.date.localeCompare(b.date));
        AppState.save();
        form.reset();
        this.renderCholesterolTable();
        this.renderCholesterolChart();
      });
    }
    this.renderCholesterolTable();
    this.renderCholesterolChart();
  },

  renderCholesterolTable() {
    const tbody = document.getElementById('cholBody');
    if (!tbody) return;
    const rows = [...(AppState.cholesterol || [])].reverse();
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-td">No tests logged yet. Add your first reading.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td>${esc(r.date)}</td>
        <td class="num ${r.ldl && r.ldl > 130 ? 'warn' : 'good'}">${r.ldl ?? '—'}</td>
        <td class="num ${r.hdl && r.hdl < 40  ? 'warn' : 'good'}">${r.hdl ?? '—'}</td>
        <td class="num">${r.total ?? '—'}</td>
        <td class="notes-td">${esc(r.notes) || '—'}</td>
        <td><button class="btn-xs btn-danger" data-del-chol="${esc(r.date)}">✕</button></td>
      </tr>`).join('');

    tbody.querySelectorAll('[data-del-chol]').forEach(btn => {
      btn.addEventListener('click', () => {
        AppState.cholesterol = AppState.cholesterol.filter(r => r.date !== btn.dataset.delChol);
        AppState.save();
        this.render();
      });
    });
  },

  renderGymHeatmap() {
    const container = document.getElementById('gymHeatmap');
    if (!container) return;

    const today = new Date();
    const weeks = 12; // show last 12 weeks
    const cells = [];

    // Build array of days from oldest to newest
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (weeks * 7 - 1));

    // Align start to Monday
    const startDow = startDate.getDay();
    const daysBack = startDow === 0 ? 6 : startDow - 1;
    startDate.setDate(startDate.getDate() - daysBack);

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const emptyColor = isDark ? '#1e254a' : '#dde3f5';
    const doneColor  = '#00d47c';
    const todayBorder = '#5b7fff';

    let html = '<div style="display:flex;gap:4px;flex-wrap:nowrap;">';
    const cols = weeks + 2; // a few extra
    for (let col = 0; col < cols; col++) {
      html += '<div style="display:flex;flex-direction:column;gap:4px;">';
      for (let row = 0; row < 7; row++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + col * 7 + row);
        if (d > today) {
          html += '<div style="width:14px;height:14px;"></div>';
          continue;
        }
        const key = AppState.getDateKey(d);
        const done = AppState.healthLog[key]?.gym;
        const isToday = d.toDateString() === today.toDateString();
        const border = isToday ? `border:1.5px solid ${todayBorder};` : '';
        const bg = done ? doneColor : emptyColor;
        const dateStr = d.toLocaleDateString('en-IN', { day:'numeric', month:'short' });
        html += `<div title="${dateStr}${done ? ' — Gym ✓' : ''}" style="width:14px;height:14px;border-radius:3px;background:${bg};${border}cursor:default;flex-shrink:0;"></div>`;
      }
      html += '</div>';
    }
    html += '</div>';
    html += `<div style="margin-top:8px;font-size:11px;color:var(--text-muted);display:flex;align-items:center;gap:8px;">
               <span style="width:12px;height:12px;background:${emptyColor};border-radius:2px;display:inline-block;"></span> No gym
               <span style="width:12px;height:12px;background:${doneColor};border-radius:2px;display:inline-block;"></span> Gym done
             </div>`;

    container.innerHTML = html;
  },

  renderCholesterolChart() {
    const canvas = document.getElementById('cholChart');
    if (!canvas || !AppState.cholesterol?.length) return;

    const sorted = [...AppState.cholesterol].sort((a,b)=>a.date.localeCompare(b.date));
    const labels = sorted.map(r => r.date);
    const ldl    = sorted.map(r => r.ldl);
    const hdl    = sorted.map(r => r.hdl);
    const total  = sorted.map(r => r.total);

    if (window._cholChart) { window._cholChart.destroy(); }

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const textColor = isDark ? '#697098' : '#5a6380';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

    window._cholChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'LDL',   data: ldl,   borderColor: '#ff5c80', tension: 0.3, pointRadius: 5 },
          { label: 'HDL',   data: hdl,   borderColor: '#00d47c', tension: 0.3, pointRadius: 5 },
          { label: 'Total', data: total, borderColor: '#ffb230', tension: 0.3, pointRadius: 5, borderDash: [4,4] }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: textColor, font: { family: 'Aptos, Segoe UI, system-ui, sans-serif' } } } },
        scales: {
          x: { ticks: { color: textColor }, grid: { color: gridColor } },
          y: { ticks: { color: textColor }, grid: { color: gridColor } }
        }
      }
    });
  }
};

// ── Global functions required by onclick= attributes in health-modules.html ──

function renderTodayMealPlan() {
  if (!window.ArjunaHealth) return;
  const plan = ArjunaHealth.getTodayMealPlan();
  const dayEl   = document.getElementById('meal-day-label');
  const themeEl = document.getElementById('meal-theme-label');
  const fishEl  = document.getElementById('fish-day-banner');
  const listEl  = document.getElementById('meal-plan-list');
  if (!listEl) return;
  if (dayEl)   dayEl.textContent   = plan.day;
  if (themeEl) themeEl.textContent = plan.theme;
  if (fishEl)  fishEl.style.display = plan.fish ? 'block' : 'none';

  const slotEmojis = { wake:'🌅', breakfast:'🍳', midMorning:'🥤', lunch:'🍽️', evening:'🫖', dinner:'🌙' };
  const mealKeys = ['wake','breakfast','midMorning','lunch','evening','dinner'];
  listEl.innerHTML = mealKeys.map(k => {
    const m = plan.meals.find ? plan.meals.find(x => x.slot === k) : plan.meals[k];
    if (!m) return '';
    const tagsHtml = (m.tags || []).map(t => `<span class="tag-${t.toLowerCase().replace(/[^a-z0-9]/g,'')}">${t}</span>`).join('');
    const swapHtml = m.swap ? `<div class="meal-swap">↔ ${m.swap}</div>` : '';
    return `<div class="meal-row" onclick="this.classList.toggle('open')">
      <div class="meal-row-inner">
        <span class="meal-time">${slotEmojis[k] || '●'} ${m.time || ''}</span>
        <div class="meal-body">
          <div class="meal-item">${m.item || ''}</div>
          ${m.where ? `<div class="meal-where">📍 ${m.where}</div>` : ''}
          <div class="meal-tags">${tagsHtml}</div>
          ${swapHtml}
        </div>
        ${m.swap ? '<span class="meal-caret">▼</span>' : ''}
      </div>
    </div>`;
  }).join('');
}

function handleNutritionToggle(itemId) {
  if (!window.ArjunaHealth) return;
  const newState = ArjunaHealth.toggleNutritionItem(itemId);
  // Update Health tab checklist
  const el    = document.querySelector(`[data-id="${itemId}"]`);
  const check = document.getElementById(`check-${itemId}`);
  if (el)    el.classList.toggle('done', newState);
  if (check) check.textContent = newState ? '✓' : '○';
  updateNutritionScore();
  // Update Today tab habits icons
  if (typeof UI !== 'undefined') UI._syncTodayHabits();
}

function updateNutritionScore() {
  if (!window.ArjunaHealth) return;
  const log   = ArjunaHealth.getTodayNutritionLog();
  const done  = log.filter(i => i.checked).length;
  const total = log.length;
  const scoreEl = document.getElementById('nutrition-score-label');
  const barEl   = document.getElementById('nutrition-score-bar');
  const streakEl= document.getElementById('nutrition-streak-val');
  if (scoreEl)  scoreEl.textContent = `${done} / ${total}`;
  if (barEl)    barEl.style.width   = Math.round((done / total) * 100) + '%';
  if (streakEl) streakEl.textContent = ArjunaHealth.getNutritionStreak();
  log.forEach(item => {
    const el    = document.querySelector(`[data-id="${item.id}"]`);
    const check = document.getElementById(`check-${item.id}`);
    if (el)    el.classList.toggle('done', item.checked);
    if (check) check.textContent = item.checked ? '✓' : '○';
  });
}

function startSupplement(suppId) {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(`arjuna_supp_${suppId}_start`, today);
  renderSupplementTracker();
}

function logSupplement(suppId) {
  const today = new Date().toISOString().split('T')[0];
  const key   = `arjuna_supp_${suppId}_log`;
  const log   = JSON.parse(localStorage.getItem(key) || '[]');
  if (!log.includes(today)) { log.push(today); localStorage.setItem(key, JSON.stringify(log)); }
  renderSupplementTracker();
}

function renderSupplementTracker() {
  const today = new Date().toISOString().split('T')[0];
  const supps = [
    { id: 'vitd3',  totalDays: 56,  prefix: 'vitd',   weekly: true  },
    { id: 'b12',    totalDays: 84,  prefix: 'b12',    weekly: false },
    { id: 'omega3', totalDays: null, prefix: 'omega3', weekly: false },
  ];
  supps.forEach(s => {
    const startDate = localStorage.getItem(`arjuna_supp_${s.id}_start`);
    const log       = JSON.parse(localStorage.getItem(`arjuna_supp_${s.id}_log`) || '[]');
    const startBtn  = document.getElementById(`btn-start-${s.prefix}`);
    const logBtn    = document.getElementById(`btn-log-${s.prefix}`);
    const daysEl    = document.getElementById(`${s.prefix}-days`) || document.getElementById(`${s.prefix}-weeks`);
    const progEl    = document.getElementById(`${s.prefix}-progress`);
    if (!startBtn) return;
    if (!startDate) {
      startBtn.style.display = 'inline-block';
      if (logBtn) logBtn.style.display = 'none';
      return;
    }
    startBtn.style.display = 'none';
    if (logBtn) { logBtn.style.display = 'inline-block'; }
    if (logBtn && log.includes(today)) { logBtn.textContent = '✓ Done'; logBtn.disabled = true; }
    const dayNum = Math.ceil((new Date(today) - new Date(startDate)) / 86400000) + 1;
    if (daysEl) {
      daysEl.textContent = s.totalDays
        ? (s.weekly ? `Week ${Math.ceil(dayNum/7)} of ${s.totalDays/7}` : `Day ${dayNum} of ${s.totalDays}`)
        : `Day ${dayNum} (ongoing)`;
    }
    if (progEl && s.totalDays) progEl.style.width = Math.min(100, Math.round(dayNum / s.totalDays * 100)) + '%';
  });
}

function saveBloodTestLog() {
  const date  = document.getElementById('new-test-date')?.value;
  const vitd  = parseFloat(document.getElementById('new-test-vitd')?.value);
  const b12   = parseFloat(document.getElementById('new-test-b12')?.value);
  const hba1c = parseFloat(document.getElementById('new-test-hba1c')?.value);
  if (!date) return;

  // Persist into AppState.cholesterol so it appears in the cholesterol log + chart
  AppState.cholesterol = AppState.cholesterol || [];
  AppState.cholesterol.push({
    id: Date.now(), date,
    ldl: null, hdl: null, total: null,
    notes: [vitd ? `Vit D: ${vitd}` : '', b12 ? `B12: ${b12}` : '', hba1c ? `HbA1c: ${hba1c}%` : '']
      .filter(Boolean).join(' | '),
  });
  AppState.cholesterol.sort((a,b) => (a.date||'').localeCompare(b.date||''));
  AppState.save();

  // Update displayed markers
  if (!isNaN(vitd))  { document.getElementById('marker-vitd-val').textContent  = `${vitd} ng/mL`; }
  if (!isNaN(b12))   { document.getElementById('marker-b12-val').textContent   = `${b12} pg/mL`; }
  if (!isNaN(hba1c)) { document.getElementById('marker-hba1c-val').textContent = `${hba1c}%`; }

  // Refresh cholesterol table & chart
  HealthTracker.renderCholesterolTable();
  HealthTracker.renderCholesterolChart();

  // Clear form
  ['new-test-date','new-test-vitd','new-test-b12','new-test-hba1c'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}
