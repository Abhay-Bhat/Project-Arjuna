// ============================================================
// ATHENA — Health Tracker
// ============================================================

const HealthTracker = {

  render() {
    this.renderTodayForm();
    this.renderWeekSummary();
    this.renderSleepChart();
    this.renderPhoneChart();
    this.renderCholesterolLog();
    this.renderGymHeatmap();
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
        plugins: { legend: { labels: { color: textColor, font: { family: 'Outfit', size: 12 } } } },
        scales: {
          x: { ticks: { color: textColor, font: { family: 'Outfit', size: 11 } }, grid: { color: gridColor } },
          y: { min: 0, max: 10, ticks: { color: textColor, stepSize: 1, font: { family: 'Outfit', size: 11 } }, grid: { color: gridColor } }
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
        plugins: { legend: { labels: { color: textColor, font: { family: 'Outfit', size: 12 } } } },
        scales: {
          x: { ticks: { color: textColor, font: { family: 'Outfit', size: 11 } }, grid: { color: gridColor } },
          y: { min: 0, max: 4, ticks: { color: textColor, stepSize: 1, font: { family: 'Outfit', size: 11 } }, grid: { color: gridColor } }
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
        <td>${r.date}</td>
        <td class="num ${r.ldl && r.ldl > 130 ? 'warn' : 'good'}">${r.ldl ?? '—'}</td>
        <td class="num ${r.hdl && r.hdl < 40  ? 'warn' : 'good'}">${r.hdl ?? '—'}</td>
        <td class="num">${r.total ?? '—'}</td>
        <td class="notes-td">${esc(r.notes) || '—'}</td>
        <td><button class="btn-xs btn-danger" data-del-chol="${r.date}">✕</button></td>
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
        plugins: { legend: { labels: { color: textColor, font: { family: 'Outfit' } } } },
        scales: {
          x: { ticks: { color: textColor }, grid: { color: gridColor } },
          y: { ticks: { color: textColor }, grid: { color: gridColor } }
        }
      }
    });
  }
};
