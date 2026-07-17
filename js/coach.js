// ============================================================
// Skadi — Coach Engine v1
// Auto-computes scores, tips, projections from raw tracked data.
// No manual entry required — everything derived from existing logs.
// ============================================================

const CoachEngine = {

  // ─────────────────────────────────────────────────────────
  // DOMAIN SCORES (0–100) from raw data
  // ─────────────────────────────────────────────────────────
  computeScores() {
    const todayKey = AppState.getTodayKey();
    const h7  = this._healthData(7);
    const sh7 = this._studyHours(7).reduce((s, v) => s + v, 0);

    // UPSC: scheduled-vs-completed ratio
    const schedule  = AppState.upscSchedule || [];
    const expected  = schedule.filter(e => e.date <= todayKey).length;
    const completed = Object.values(AppState.upscSubjectProgress || {}).reduce((s, v) => s + v, 0);
    const upscScore = expected > 0 ? Math.round(Math.min(1, completed / expected) * 100) : 50;

    // Health: sleep (30) + gym (25) + phone (25) + habits (20)
    let hs = 0;
    hs += h7.avgSleep >= 7.5 ? 30 : h7.avgSleep >= 7 ? 25 : h7.avgSleep >= 6 ? 15 : h7.avgSleep >= 5 ? 5 : 0;
    hs += h7.gymDays >= 5 ? 25 : h7.gymDays >= 3 ? 18 : h7.gymDays >= 1 ? 8 : 0;
    hs += h7.phoneN > 0
      ? (h7.avgPhone <= 1.5 ? 25 : h7.avgPhone <= 3 ? 18 : h7.avgPhone <= 5 ? 8 : 0)
      : 12; // no data → neutral
    hs += h7.habitPct >= 80 ? 20 : h7.habitPct >= 60 ? 14 : h7.habitPct >= 40 ? 8 : h7.habitPct >= 20 ? 3 : 0;

    // Study: hours vs goal
    const goalH = parseFloat(localStorage.getItem('skadi_study_goal') || '4');
    const studyScore = Math.min(100, Math.round((sh7 / 7 / Math.max(0.5, goalH)) * 100));

    // Tasks: completion rate minus overdue penalty
    const tasks    = (AppState.tasks || []).filter(t => !t.deleted);
    const doneCnt  = tasks.filter(t => t.status === 'done').length;
    const overCnt  = tasks.filter(t => t.dueDate && t.dueDate < todayKey && t.status !== 'done').length;
    const taskScore = tasks.length > 0
      ? Math.max(0, Math.round((doneCnt / tasks.length) * 100) - overCnt * 8)
      : 60;

    return {
      upsc:   Math.min(100, upscScore),
      health: Math.min(100, hs),
      study:  Math.min(100, studyScore),
      tasks:  Math.min(100, taskScore),
    };
  },

  // ─────────────────────────────────────────────────────────
  // COACHING TIPS — prioritized, data-driven
  // ─────────────────────────────────────────────────────────
  generateTips() {
    const tips    = [];
    const today   = AppState.getTodayKey();
    const h7      = this._healthData(7);
    const schedule = AppState.upscSchedule || [];
    const expected  = schedule.filter(e => e.date <= today).length;
    const completed = Object.values(AppState.upscSubjectProgress || {}).reduce((s, v) => s + v, 0);
    const lag = expected - completed;

    // UPSC lag
    if (lag > 15)
      tips.push({ p: 1, icon: '📚', tab: 'upsc',
        text: `${lag} classes behind schedule. Plan a 3h daily block this week to recover — debt compounds fast.` });
    else if (lag > 5)
      tips.push({ p: 2, icon: '📚', tab: 'upsc',
        text: `${lag} classes behind. A focused 4–5h weekend session can close it cleanly.` });
    else if (lag > 0)
      tips.push({ p: 3, icon: '📚', tab: 'upsc',
        text: `${lag} class${lag > 1 ? 'es' : ''} behind — minor drift. Catch up before the gap grows.` });

    // Sleep
    if (h7.sleepN >= 3) {
      if (h7.avgSleep < 6)
        tips.push({ p: 1, icon: '😴', tab: 'health',
          text: `Sleep avg ${h7.avgSleep.toFixed(1)}h — critically low. Memory consolidation needs 7h+; this is hurting UPSC retention directly.` });
      else if (h7.avgSleep < 6.5)
        tips.push({ p: 2, icon: '😴', tab: 'health',
          text: `Averaging ${h7.avgSleep.toFixed(1)}h sleep. 30 extra minutes improves recall and decision-making measurably.` });
    }

    // Phone screen time
    if (h7.phoneN >= 3 && h7.avgPhone > 4.5)
      tips.push({ p: 2, icon: '📱', tab: 'health',
        text: `Screen time ${h7.avgPhone.toFixed(1)}h/day. Set a hard 2h cap — every hour on phone is an hour not studying.` });

    // Gym
    if (h7.gymDays <= 1)
      tips.push({ p: 3, icon: '🏋️', tab: 'health',
        text: `${h7.gymDays} gym session this week. Exercise isn't optional — it raises BDNF, the molecule behind learning.` });

    // Study hours
    const goalH   = parseFloat(localStorage.getItem('skadi_study_goal') || '4');
    const avgStudy = this._studyHours(7).reduce((s, v) => s + v, 0) / 7;
    if (avgStudy < goalH * 0.5)
      tips.push({ p: 1, icon: '⏱', tab: 'upsc',
        text: `Study avg ${avgStudy.toFixed(1)}h/day vs ${goalH}h goal. Use the stopwatch — 90 focused minutes beats 4 distracted ones.` });
    else if (avgStudy < goalH * 0.75)
      tips.push({ p: 2, icon: '⏱', tab: 'upsc',
        text: `Study avg ${avgStudy.toFixed(1)}h/day — below ${goalH}h target. Protect the morning block first; add afternoon if possible.` });

    // Overdue tasks
    const tasks  = (AppState.tasks || []).filter(t => !t.deleted);
    const overdue = tasks.filter(t => t.dueDate && t.dueDate < today && t.status !== 'done');
    if (overdue.length >= 3)
      tips.push({ p: 2, icon: '✅', tab: 'tasks',
        text: `${overdue.length} overdue tasks. Unresolved items create cognitive load that competes with study focus. Batch-clear in one session.` });
    else if (overdue.length > 0)
      tips.push({ p: 3, icon: '✅', tab: 'tasks',
        text: `${overdue.length} overdue task${overdue.length > 1 ? 's' : ''} — small friction. 15 minutes to resolve.` });

    // Nutrition
    if (h7.habitN >= 4 && h7.habitPct < 40)
      tips.push({ p: 2, icon: '🥗', tab: 'health',
        text: `Nutrition habits at ${Math.round(h7.habitPct)}% this week. Consistent fuelling is the backbone of daily energy.` });

    // All clear
    if (!tips.find(t => t.p <= 2))
      tips.push({ p: 5, icon: '✦', tab: null,
        text: `Systems running well — sleep ${h7.avgSleep.toFixed(1)}h · study ${avgStudy.toFixed(1)}h/day. Stay consistent.` });

    return tips.sort((a, b) => a.p - b.p);
  },

  // Best single tip for Today pro-tip card
  getBestTip() {
    const tips = this.generateTips();
    if (!tips.length) {
      const phase = typeof PhaseManager !== 'undefined' ? PhaseManager.getPhase() : null;
      const map = {
        ramp1:     'Settling in — build the evening habit anchor. Even 1 focused hour beats zero.',
        ramp2:     'Momentum building. Docker foundations + extended UPSC block. Consistency compounds.',
        ramp3:     'Deepening phase. Kubernetes begins — the learning curve is steep but short. Push through.',
        ramp4:     'Full capacity. 2.5h UPSC evenings are the new normal. Protect the routine.',
        sustained: 'Cruise altitude. Protect the morning block — nothing borrows from it.',
      };
      return { icon: '💡', text: map[phase?.id] || 'Consistency over intensity. Show up every day — even imperfectly.', tab: null };
    }
    return tips[0];
  },

  // ─────────────────────────────────────────────────────────
  // UPSC DEADLINE PROJECTION
  // ─────────────────────────────────────────────────────────
  getUPSCProjection() {
    const schedule  = AppState.upscSchedule || [];
    const todayKey  = AppState.getTodayKey();
    const completed = Object.values(AppState.upscSubjectProgress || {}).reduce((s, v) => s + v, 0);
    const total     = schedule.length || (typeof UPSCTracker !== 'undefined' ? UPSCTracker.totalClasses() : 726);
    const remaining = Math.max(0, total - completed);

    // 30-day pace: count schedule slots that were covered
    const d30 = new Date(); d30.setDate(d30.getDate() - 30);
    const d30Key   = d30.toISOString().split('T')[0];
    const recent30 = schedule.filter(e => e.date >= d30Key && e.date <= todayKey).length;
    const pace30   = recent30 / 30;

    // Also derive a study-session-based estimate
    const studyH30 = this._studyHours(30).reduce((s, v) => s + v, 0);

    const targetEnd = schedule.length > 0 ? schedule[schedule.length - 1]?.date : null;
    const expected  = schedule.filter(e => e.date <= todayKey).length;
    const lag       = expected - completed;

    let projectedEnd = null, projectedDays = null;
    if (pace30 > 0) {
      projectedDays = Math.ceil(remaining / pace30);
      const p = new Date(); p.setDate(p.getDate() + projectedDays);
      projectedEnd = p.toISOString().split('T')[0];
    }

    let requiredPacePerDay = null, daysLeft = null, onTrack = null;
    if (targetEnd) {
      const today = new Date();
      const tgt   = new Date(targetEnd);
      daysLeft = Math.max(1, Math.ceil((tgt - today) / 86400000));
      requiredPacePerDay = (remaining / daysLeft).toFixed(1);
      onTrack = projectedEnd ? projectedEnd <= targetEnd : null;
    }

    return {
      completed, total, remaining,
      pacePerDay: pace30.toFixed(1),
      avgStudyH30: (studyH30 / 30).toFixed(1),
      projectedEnd, projectedDays,
      targetEnd, requiredPacePerDay, daysLeft, onTrack, lag, expected,
    };
  },

  // ─────────────────────────────────────────────────────────
  // AUTO REVIEW — drives the Growth tab coach board
  // ─────────────────────────────────────────────────────────
  getAutoReview() {
    const scores  = this.computeScores();
    const h7      = this._healthData(7);
    const streak  = AppState.getPastimeStreak();
    const today   = AppState.getTodayKey();
    const tasks   = (AppState.tasks || []).filter(t => !t.deleted);
    const overCnt = tasks.filter(t => t.dueDate && t.dueDate < today && t.status !== 'done').length;
    const openCnt = tasks.filter(t => t.status !== 'done').length;
    const sh7     = this._studyHours(7).reduce((s, v) => s + v, 0);
    const schedule = AppState.upscSchedule || [];
    const expected  = schedule.filter(e => e.date <= today).length;
    const completed = Object.values(AppState.upscSubjectProgress || {}).reduce((s, v) => s + v, 0);
    const lag = expected - completed;

    const color = s => s >= 75 ? 'var(--accent-green)' : s >= 45 ? 'var(--accent-amber)' : 'var(--accent-rose)';

    return {
      domains: [
        { key: 'upsc',   label: 'UPSC Classes',      score: scores.upsc,
          note: lag > 0 ? `${lag} behind` : lag < 0 ? `${Math.abs(lag)} ahead` : 'On track',
          color: color(scores.upsc), tab: 'upsc' },
        { key: 'study',  label: 'Study Hours',        score: scores.study,
          note: `${sh7.toFixed(1)}h this week`,
          color: color(scores.study), tab: 'upsc' },
        { key: 'health', label: 'Health',              score: scores.health,
          note: h7.sleepN > 0 ? `Sleep ${h7.avgSleep.toFixed(1)}h · Gym ${h7.gymDays}d · Habits ${Math.round(h7.habitPct)}%` : 'Log in Health tab',
          color: color(scores.health), tab: 'health' },
        { key: 'tasks',  label: 'Execution',           score: scores.tasks,
          note: `${openCnt} open${overCnt > 0 ? ` · ${overCnt} overdue` : ''}`,
          color: color(scores.tasks), tab: 'tasks' },
      ],
      tips: this.generateTips().slice(0, 5),
      lastUpdated: new Date().toLocaleString('en-IN',
        { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
    };
  },

  // ─────────────────────────────────────────────────────────
  // DATA READERS
  // ─────────────────────────────────────────────────────────
  _healthData(days) {
    let sleepS = 0, sleepN = 0, gymDays = 0, phoneS = 0, phoneN = 0;
    let habDone = 0, habMax = 0, habN = 0;
    const HABIT_IDS = ['eggs', 'fish', 'nuts', 'sun', 'water', 'noFried', 'earlyDinner'];
    const today = new Date();
    for (let i = 0; i < days; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const h   = (AppState.healthLog || {})[key] || {};
      if (h.sleep_h != null) { sleepS += h.sleep_h; sleepN++; }
      if (h.gym) gymDays++;
      if (h.phone_h != null) { phoneS += h.phone_h; phoneN++; }
      const nut = JSON.parse(localStorage.getItem(`arjuna_nutrition_${key}`) || '{}');
      if (Object.keys(nut).length > 0) {
        habDone += HABIT_IDS.filter(id => nut[id]).length;
        habMax  += HABIT_IDS.length;
        habN++;
      }
    }
    return {
      avgSleep: sleepN > 0 ? sleepS / sleepN : 0, sleepN,
      gymDays,
      avgPhone: phoneN > 0 ? phoneS / phoneN : 0, phoneN,
      habitPct: habMax > 0 ? (habDone / habMax) * 100 : 0, habitN: habN,
    };
  },

  _studyHours(days) {
    const result = [];
    const today  = new Date();
    for (let i = 0; i < days; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const key  = d.toISOString().split('T')[0];
      const mins = (AppState.studyLog || [])
        .filter(s => s.date === key)
        .reduce((s, sess) => s + (sess.duration_min || 0), 0);
      result.push(mins / 60);
    }
    return result;
  },
};
