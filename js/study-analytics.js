// ============================================================
// Skadi — Study Analytics
// Streak heatmap · trend chart · hour chart · distributions
// ============================================================

const StudyAnalytics = (() => {

  let _trendChart  = null;
  let _hourChart   = null;
  let _actChart    = null;
  let _subjChart   = null;
  let _tabHiddenAt = null;

  // ── Tiny helpers ─────────────────────────────────────────

  const _dk  = d => AppState.getDateKey(d);
  const _add = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
  const _fmtDur = min => {
    if (!min) return '0m';
    const h = Math.floor(min / 60), m = min % 60;
    return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`;
  };

  // ── Data helpers ─────────────────────────────────────────

  const _done    = s => (s || []).filter(x => x.completed !== false);
  const _total   = s => _done(s).reduce((a, x) => a + x.duration_min, 0);

  function _byDay(sessions) {
    const m = {};
    _done(sessions).forEach(s => { m[s.date] = (m[s.date] || 0) + s.duration_min; });
    return m;
  }

  function _byHour(sessions) {
    const a = new Array(24).fill(0);
    _done(sessions).forEach(s => {
      if (s.started_at) a[new Date(s.started_at).getHours()] += s.duration_min;
    });
    return a;
  }

  function _prevPeriod(range, all) {
    const now = new Date();
    if (range === 'today') {
      const yk = _dk(_add(now, -1));
      return (all || []).filter(s => s.date === yk);
    }
    const n = range === '7d' ? 7 : range === '30d' ? 30 : range === '3m' ? 90 : 0;
    if (!n) return [];
    const sk = _dk(_add(now, -n * 2)), ek = _dk(_add(now, -n));
    return (all || []).filter(s => s.date >= sk && s.date < ek);
  }

  // ── Contextual one-liner insight ─────────────────────────

  function _allSessionsTotal(all) {
    // Count ALL sessions (including withered) for all-time stats
    return (all || []).reduce((a, s) => a + (s.duration_min || 0), 0);
  }

  function _allSessionsByDay(all) {
    const m = {};
    (all || []).forEach(s => { if (s.duration_min > 0) m[s.date] = (m[s.date] || 0) + s.duration_min; });
    return m;
  }

  function _insightText(sessions, range, all) {
    const now  = new Date();
    const goal = AppState.studyDailyGoal || 240;

    // All-time stats using ALL sessions (including partial/withered) for accurate picture
    const allByDay   = _allSessionsByDay(all);
    const activeDays = Object.keys(allByDay).length;
    const allTotal   = _allSessionsTotal(all);
    const avgPerDay  = activeDays > 0 ? Math.round(allTotal / activeDays) : 0;
    const goalPct    = goal > 0 ? Math.round((avgPerDay / goal) * 100) : 0;

    const allTimeStr = activeDays > 0
      ? `All-time avg: ${_fmtDur(avgPerDay)}/day across ${activeDays} active day${activeDays === 1 ? '' : 's'} (${goalPct}% of 4h goal)`
      : 'No sessions logged yet — start your first study session! 📖';

    // Range-specific comparison
    const curMin  = (sessions || []).reduce((a, s) => a + (s.duration_min || 0), 0);
    const prevMin = _total(_prevPeriod(range, all));

    if (range === 'today') {
      const yk      = _dk(_add(now, -1));
      const nowHour = now.getHours() + now.getMinutes() / 60;
      const ystMin  = (all || []).filter(s => {
        if (s.date !== yk || !s.started_at) return false;
        const h = new Date(s.started_at).getHours() + new Date(s.started_at).getMinutes() / 60;
        return h <= nowHour;
      }).reduce((a, s) => a + (s.duration_min || 0), 0);

      const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      if (ystMin === 0 && curMin === 0) return allTimeStr;
      if (ystMin === 0) return `You've studied ${curMin > 0 ? _fmtDur(curMin) : 'nothing'} today — no yesterday data to compare  ·  ${allTimeStr}`;
      const diff  = curMin - ystMin;
      const emoji = diff >= 0 ? '🔥' : '📉';
      return `Yesterday by ${timeStr} you'd studied ${_fmtDur(ystMin)} — you're ${_fmtDur(Math.abs(diff))} ${diff >= 0 ? 'ahead' : 'behind'} ${emoji}  ·  ${allTimeStr}`;

    } else if (range === '7d') {
      if (prevMin === 0 && curMin === 0) return allTimeStr;
      if (prevMin === 0) return `First week tracked — ${_fmtDur(curMin)} total 🌱  ·  ${allTimeStr}`;
      const pct = Math.round(((curMin - prevMin) / prevMin) * 100);
      return `Last week: ${_fmtDur(prevMin)} — this week ${Math.abs(pct)}% ${pct >= 0 ? 'more 📈' : 'less 📉'}  ·  ${allTimeStr}`;

    } else if (range === '30d') {
      if (prevMin === 0 && curMin === 0) return allTimeStr;
      if (prevMin === 0) return `First month tracked — ${_fmtDur(curMin)} total 🧱  ·  ${allTimeStr}`;
      const pct = Math.round(((curMin - prevMin) / prevMin) * 100);
      return `Prev 30 days: ${_fmtDur(prevMin)} — you're ${Math.abs(pct)}% ${pct >= 0 ? 'ahead 📈' : 'behind 📉'}  ·  ${allTimeStr}`;

    } else if (range === '3m') {
      if (prevMin === 0 && curMin === 0) return allTimeStr;
      if (prevMin === 0) return `First quarter tracked — ${_fmtDur(curMin)} total 💪  ·  ${allTimeStr}`;
      const pct = Math.round(((curMin - prevMin) / prevMin) * 100);
      return `Prev quarter: ${_fmtDur(prevMin)} — this quarter ${Math.abs(pct)}% ${pct >= 0 ? 'higher 🏆' : 'lower 📉'}  ·  ${allTimeStr}`;

    } else { // all
      if (!activeDays) return 'No sessions logged yet — start your first study session! 📖';
      const goalDays = Object.values(allByDay).filter(m => m >= goal).length;
      return `${allTimeStr}  ·  Goal hit ${goalDays}/${activeDays} active day${activeDays === 1 ? '' : 's'}`;
    }
  }

  function _insight(sessions, range, all) {
    const el = document.getElementById('saInsight');
    if (!el) return;
    const text = _insightText(sessions, range, all);
    el.textContent = text;
  }

  // ── Chart.js theme ────────────────────────────────────────

  const T = () => ({
    color: getComputedStyle(document.documentElement)
      .getPropertyValue('--text-muted').trim() || '#6e7aaa',
    grid: 'rgba(255,255,255,0.07)',
  });

  // ── Streak heatmap ────────────────────────────────────────

  function _heatmap() {
    const el = document.getElementById('saHeatmap');
    if (!el) return;

    const all     = AppState.studyLog || [];
    const goal    = AppState.studyDailyGoal || 240;
    const byDate  = _byDay(all);
    const today   = new Date();
    const todayK  = _dk(today);

    // 91-day window, grid starts on the Monday of the first week
    const gridEnd   = new Date(today);
    const gridStart = _add(today, -89);
    const dow       = (gridStart.getDay() + 6) % 7; // Mon=0
    const base      = _add(gridStart, -dow);

    // Build cells
    const cells = [];
    for (let cur = new Date(base); cur <= gridEnd; cur = _add(cur, 1)) {
      const k     = _dk(cur);
      const min   = byDate[k] || 0;
      const past  = k < _dk(gridStart);
      const fut   = k > todayK;
      const lvl   = past || fut ? -1 : min === 0 ? 0
        : min < goal * 0.25 ? 1 : min < goal * 0.5 ? 2
        : min < goal * 0.75 ? 3 : min < goal ? 4 : 5;
      cells.push({ k, min, lvl, isToday: k === todayK, label: `${k}: ${_fmtDur(min)}` });
    }

    const weeks = Math.ceil(cells.length / 7);

    // Month labels across the top
    let moHtml = '';
    for (let w = 0; w < weeks; w++) {
      const c = cells[w * 7];
      const d = c ? new Date(c.k + 'T00:00:00') : null;
      const mo = d ? d.toLocaleDateString('en-US', { month: 'short' }) : '';
      const prevMo = w > 0 && cells[(w - 1) * 7]
        ? new Date(cells[(w - 1) * 7].k + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })
        : null;
      moHtml += `<div class="sa-hm-mo">${mo !== prevMo ? mo : ''}</div>`;
    }

    // Week columns
    let gridHtml = '';
    for (let w = 0; w < weeks; w++) {
      let col = '';
      for (let d = 0; d < 7; d++) {
        const c = cells[w * 7 + d];
        if (!c || c.lvl === -1) { col += `<div class="sa-hm-cell sa-hm-x"></div>`; continue; }
        col += `<div class="sa-hm-cell sa-hm-l${c.lvl}${c.isToday ? ' sa-hm-today' : ''}" title="${c.label}"></div>`;
      }
      gridHtml += `<div class="sa-hm-col">${col}</div>`;
    }

    const days = ['M','','W','','F','','S'];
    el.innerHTML = `
      <div class="sa-hm-outer">
        <div class="sa-hm-days">${days.map(x => `<div>${x}</div>`).join('')}</div>
        <div class="sa-hm-body">
          <div class="sa-hm-months">${moHtml}</div>
          <div class="sa-hm-grid">${gridHtml}</div>
        </div>
      </div>`;

    // Streak count
    const cnt = document.getElementById('saStreakCount');
    if (cnt) {
      let streak = 0;
      const d = new Date();
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if ((byDate[_dk(d)] || 0) > 0) { streak++; d.setDate(d.getDate() - 1); } else break;
      }
      cnt.textContent = streak > 0 ? `🔥 ${streak}-day streak` : '';
    }
  }

  // ── Comparison stats row ─────────────────────────────────

  function _comparison(sessions, range, all) {
    const el = document.getElementById('saComparisonRow');
    if (!el) return;

    const prev     = _prevPeriod(range, all);
    const curMin   = _total(sessions);
    const prevMin  = _total(prev);
    const curTrees = _done(sessions).length;
    const prevTrees= _done(prev).length;
    const daily    = _byDay(sessions);
    const bestMin  = Math.max(0, ...Object.values(daily));
    const goalMin  = AppState.studyDailyGoal || 240;
    const goalDays = Object.values(daily).filter(m => m >= goalMin).length;
    const totalDays= Object.keys(daily).length;
    const pLabel   = { today: 'vs yesterday', '7d': 'vs prev 7d', '30d': 'vs prev 30d', '3m': 'vs prev 3m', all: '' }[range] || '';

    const _card = (label, cur, prevVal, unit = '') => {
      const diff  = prevVal > 0 ? Math.round(((cur - prevVal) / prevVal) * 100) : null;
      const arrow = diff === null ? '' : diff > 0
        ? `<span class="sa-up">▲${diff}%</span>`
        : diff < 0 ? `<span class="sa-dn">▼${Math.abs(diff)}%</span>`
        : `<span style="color:var(--text-muted)">—</span>`;
      const prevStr = prevVal > 0 ? `<span class="sa-cmp-prev">${prevVal}${unit} ${pLabel}</span>` : '';
      return `<div class="sa-cmp-card">
        <div class="sa-cmp-lbl">${label}</div>
        <div class="sa-cmp-vals">
          <span class="sa-cmp-cur">${cur}${unit}</span>
          ${prevStr} ${arrow}
        </div>
      </div>`;
    };

    el.innerHTML =
      _card('Study Time', _fmtDur(curMin), prevMin ? _fmtDur(prevMin) : 0) +
      _card('Trees 🌳',   curTrees, prevTrees) +
      _card('Best Day',   _fmtDur(bestMin), 0) +
      `<div class="sa-cmp-card">
        <div class="sa-cmp-lbl">Goal Days</div>
        <div class="sa-cmp-vals">
          <span class="sa-cmp-cur">${goalDays}</span>
          ${totalDays ? `<span class="sa-cmp-prev">/ ${totalDays} days</span>` : ''}
        </div>
      </div>`;
  }

  // ── Trend chart ───────────────────────────────────────────

  function _trend(sessions, range, all) {
    const canvas = document.getElementById('saTrendChart');
    if (!canvas || typeof Chart === 'undefined') return;
    if (_trendChart) { _trendChart.destroy(); _trendChart = null; }

    const prev   = _prevPeriod(range, all);
    const theme  = T();
    const titleEl = document.getElementById('saTrendTitle');

    let labels = [], curData = [], prevData = [];

    if (range === 'today') {
      if (titleEl) titleEl.textContent = 'Today vs Yesterday (hourly)';
      curData  = _byHour(sessions);
      prevData = _byHour(prev);
      labels   = Array.from({ length: 24 }, (_, i) =>
        i === 0 ? '12a' : i < 12 ? `${i}a` : i === 12 ? '12p' : `${i - 12}p`);
    } else if (range === 'all') {
      if (titleEl) titleEl.textContent = 'Monthly Trend';
      const cm = {}, pm = {};
      _done(sessions).forEach(s => { const k = s.date.slice(0, 7); cm[k] = (cm[k] || 0) + s.duration_min; });
      _done(prev).forEach(s => { const k = s.date.slice(0, 7); pm[k] = (pm[k] || 0) + s.duration_min; });
      const months = [...new Set(Object.keys(cm).concat(Object.keys(pm)))].sort();
      labels   = months.map(m => new Date(m + '-02').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
      curData  = months.map(m => cm[m] || 0);
      prevData = months.map(m => pm[m] || 0);
    } else {
      const n = range === '7d' ? 7 : range === '30d' ? 30 : 90;
      if (titleEl) titleEl.textContent = n <= 7 ? 'Daily vs Previous Week' : `Last ${n} Days`;
      const today = new Date();
      const cd = _byDay(sessions), pd = _byDay(prev);
      for (let i = n - 1; i >= 0; i--) {
        const d = _add(today, -i);
        const k = _dk(d);
        labels.push(
          n <= 7  ? d.toLocaleDateString('en-US', { weekday: 'short' }) :
          n <= 30 ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) :
          (i % 7 === 0 ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '')
        );
        curData.push(cd[k] || 0);
        prevData.push(pd[_dk(_add(d, -n))] || 0);
      }
    }

    const hasPrev  = prevData.some(v => v > 0);
    const goalMin  = AppState.studyDailyGoal || 240;
    const goalLine = range === 'today' ? [] : new Array(labels.length).fill(goalMin);

    _trendChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          ...(hasPrev ? [{
            label: range === 'today' ? 'Yesterday' : 'Prev period',
            data: prevData,
            backgroundColor: 'rgba(110,122,170,0.22)',
            borderColor: 'rgba(110,122,170,0.35)',
            borderWidth: 1,
            borderRadius: 3,
            order: 2,
          }] : []),
          {
            label: range === 'today' ? 'Today' : 'Study time',
            data: curData,
            backgroundColor: 'rgba(77,121,255,0.72)',
            borderColor: 'rgba(77,121,255,1)',
            borderWidth: 1,
            borderRadius: 3,
            order: 1,
          },
          ...(goalLine.length ? [{
            label: 'Daily goal',
            data: goalLine,
            type: 'line',
            borderColor: 'rgba(255,178,48,0.55)',
            borderWidth: 1.5,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
            order: 0,
          }] : []),
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: theme.color, font: { size: 11 }, boxWidth: 12, padding: 10 },
          },
          tooltip: {
            callbacks: { label: ctx => `${ctx.dataset.label}: ${_fmtDur(ctx.parsed.y)}` },
          },
        },
        scales: {
          x: {
            ticks: { color: theme.color, font: { size: 10 }, maxRotation: 40 },
            grid: { color: theme.grid },
          },
          y: {
            beginAtZero: true,
            ticks: { color: theme.color, font: { size: 10 }, callback: v => _fmtDur(v) },
            grid: { color: theme.grid },
          },
        },
      },
    });
  }

  // ── Hour-of-day chart ─────────────────────────────────────

  function _hours(sessions, range, all) {
    const canvas = document.getElementById('saHourChart');
    if (!canvas || typeof Chart === 'undefined') return;
    if (_hourChart) { _hourChart.destroy(); _hourChart = null; }

    const cur   = _byHour(sessions);
    const prev  = _byHour(_prevPeriod(range, all));
    const maxV  = Math.max(...cur, 1);
    const hasPrev = prev.some(v => v > 0);
    const theme = T();
    const labels = Array.from({ length: 24 }, (_, i) =>
      i === 0 ? '12a' : i < 12 ? `${i}a` : i === 12 ? '12p' : `${i - 12}p`);

    _hourChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          ...(hasPrev ? [{
            label: 'Prev period',
            data: prev,
            backgroundColor: 'rgba(110,122,170,0.22)',
            borderColor: 'rgba(110,122,170,0.35)',
            borderWidth: 1,
            borderRadius: 2,
          }] : []),
          {
            label: 'Study time',
            data: cur,
            backgroundColor: cur.map(v => {
              const a = 0.25 + (v / maxV) * 0.7;
              return `rgba(0,212,124,${a.toFixed(2)})`;
            }),
            borderColor: 'rgba(0,212,124,0.7)',
            borderWidth: 1,
            borderRadius: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: theme.color, font: { size: 11 }, boxWidth: 12, padding: 10 },
          },
          tooltip: {
            callbacks: { label: ctx => `${ctx.dataset.label}: ${_fmtDur(ctx.parsed.y)}` },
          },
        },
        scales: {
          x: { ticks: { color: theme.color, font: { size: 9 } }, grid: { color: theme.grid } },
          y: { beginAtZero: true, ticks: { color: theme.color, font: { size: 10 }, callback: v => _fmtDur(v) }, grid: { color: theme.grid } },
        },
      },
    });
  }

  // ── Distribution donuts ───────────────────────────────────

  function _donut(canvasId, legendId, sessions, key) {
    const canvas = document.getElementById(canvasId);
    const lg     = document.getElementById(legendId);
    if (!canvas || typeof Chart === 'undefined') return;

    const old = key === 'activity' ? _actChart : _subjChart;
    if (old) old.destroy();
    if (key === 'activity') _actChart = null; else _subjChart = null;

    const done  = _done(sessions);
    if (!done.length) {
      canvas.style.display = 'none';
      if (lg) lg.innerHTML = '<div class="sa-empty">No data for this period</div>';
      return;
    }
    canvas.style.display = '';

    const map = {};
    done.forEach(s => { const k = s[key] || 'unknown'; map[k] = (map[k] || 0) + s.duration_min; });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);

    const PALETTE = ['#4d79ff','#00d47c','#ffb230','#e87ab0','#56d4e0','#9b7be8','#e8916a','#ff6b6b','#4db8c8','#a56eff'];
    const labels  = sorted.map(([k]) => key === 'activity' ? StudyTracker.getActivity(k)?.label || k : StudyTracker.getSubject(k)?.label || k);
    const data    = sorted.map(([, v]) => v);
    const colors  = sorted.map(([k], i) => key === 'subject' ? (StudyTracker.getSubject(k)?.color || PALETTE[i % PALETTE.length]) : PALETTE[i % PALETTE.length]);
    const total   = data.reduce((a, b) => a + b, 0);

    const chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: 'var(--card,#0e1629)' }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '62%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: ctx => `${ctx.label}: ${_fmtDur(ctx.parsed)} (${Math.round(ctx.parsed / total * 100)}%)` },
          },
        },
      },
    });

    if (key === 'activity') _actChart = chart; else _subjChart = chart;

    if (lg) {
      lg.innerHTML = sorted.map(([k, min], i) =>
        `<div class="sa-lg-row">
          <span class="sa-lg-dot" style="background:${colors[i]}"></span>
          <span class="sa-lg-lbl">${labels[i]}</span>
          <span class="sa-lg-val">${_fmtDur(min)}<span class="sa-lg-pct"> ${Math.round(min / total * 100)}%</span></span>
        </div>`).join('');
    }
  }

  // ── Public API ────────────────────────────────────────────

  return {

    init() {
      // Notify user if they leave the tab during a study session
      document.addEventListener('visibilitychange', () => {
        if (!StudyTracker._running) return;
        const inBreak = StudyTracker._mode === 'pomodoro' &&
          (StudyTracker._pomoPhase === 'break' || StudyTracker._pomoPhase === 'longbreak');
        if (inBreak) return;

        if (document.hidden) {
          _tabHiddenAt = Date.now();
        } else if (_tabHiddenAt) {
          const secs = Math.round((Date.now() - _tabHiddenAt) / 1000);
          _tabHiddenAt = null;
          if (secs >= 10 && typeof UI !== 'undefined') {
            UI.showToast(`👀 Away ${StudyTracker.fmtTimer(secs)} — timer kept running.`);
          }
        }
      });
    },

    render(sessions, range) {
      const all = AppState.studyLog || [];
      _heatmap();
      _comparison(sessions, range, all);
      _insight(sessions, range, all);
      _trend(sessions, range, all);
      _hours(sessions, range, all);
      _donut('saActivityChart', 'saActivityLegend', sessions, 'activity');
      _donut('saSubjectChart',  'saSubjectLegend',  sessions, 'subject');
    },

    // Expose for external calls (e.g. after new session saved)
    refreshHeatmap: _heatmap,
  };

})();
