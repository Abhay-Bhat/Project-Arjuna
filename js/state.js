// ============================================================
// Skadi — Application State (v2)
// Manages all persisted data across 6 domains.
// ============================================================

// Global HTML-escaping utility — call before inserting any user text into innerHTML.
function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const AppState = {
  // ── Navigation ───────────────────────────────────────────
  selectedDate:   new Date(),
  calendarMonth:  new Date(),
  currentTab:     'today',
  theme:          'dark',
  dashboardCollapsed: false,

  // ── Routine Tracker ──────────────────────────────────────
  checkedItems:     {},   // { 'YYYY-MM-DD-index': true }
  holidayOverrides: {},   // { 'YYYY-MM-DD': 'weekend' | 'weekday' }
  dailyHistory:     {},   // { 'YYYY-MM-DD': { completed, total } }

  // ── UPSC ─────────────────────────────────────────────────
  upscSubjectProgress: {},  // { subject_id: classes_done }
  upscSubjectTotals:   {},  // { subject_id: total_classes } — user-edited totals
  upscSubjectProgressUpdatedAt: null, // ISO — bumped on every progress write
  upscSubjectTotalsUpdatedAt:   null, // ISO — bumped on every totals write
  upscSchedule:        [],
  upscProgress:        0,   // legacy total

  // ── Finance ──────────────────────────────────────────────
  financeEntries:   [],   // [{ id, date, saved_aed, transferred_inr, notes }]
  investments:      [],   // [{ id, type, amount, notes, date, bankAccount, maturityDate, status, insuranceType, coverAmount, premiumFrequency, interestRate, withdrawnAmount, withdrawalDate }]
  monthlyExpenses:  [],   // [{ id, month, income, categories:{housing,food,...}, notes }]
  nriAccountLive:   false,
  sipActive:        false,

  // ── Health ───────────────────────────────────────────────
  healthLog:       {},   // { 'YYYY-MM-DD': { sleep_h, gym, phone_h } }
  cholesterol:     [],   // [{ date, ldl, hdl, total, notes }]

  // ── Current Affairs (UPSC) ───────────────────────────────
  caLog:           {},   // { 'YYYY-MM-DD': { done: bool, articles: [{ id, source, title, notes }] } }

  // ── Mind (Pastime + Mental) ──────────────────────────────
  pastimeStart:    null, // ISO string — streak start date
  pastimeLog:      [],   // [{ date, type:'reset'|'check', reason, note }]
  mindLog:         {},   // { 'YYYY-MM-DD': { loneliness:1-5, meditation_min, parents } }

  // ── Growth ───────────────────────────────────────────────
  careerLog:       {},   // { milestone_id: { done, date, note } }
  booksLog:        {},   // { 'YYYY-MM': { title, pages_read, total_pages, done, note } }
  weeklyReviews:   {},   // { 'YYYY-Www': { q1..q10, submitted_at } }
  monthlyReviews:  {},   // { 'YYYY-MM': { domains, submitted_at } }
  partnerLog:      [],   // [{ date, type:'msg'|'call'|'meet', note }]
  habitStacks:     {},   // { stack1: true, ... } — Habit Stack Rollout (Jul 2026)

  // ── Dubai Checklist ──────────────────────────────────────
  dubaiChecklist:  {},   // { item_id: true }

  // ── Tasks (Planner) ──────────────────────────────────────
  taskBuckets:          [],   // [{ id, title, color }]
  tasks:                [],   // [{ id, bucketId, title, dueDate, priority, done, createdAt }]
  tasksOrderedAt:       null, // ISO — updated on drag-and-drop reorder; used to pick ordering in merge
  taskBucketsOrderedAt: null, // ISO — updated on bucket drag-and-drop reorder

  // ── SMART Goals (Growth tab) ──────────────────────────────
  goals: [], // [{ id, title, domain, specific, measurable, achievable, relevant,
              //    timebound, targetDate, progress, status, milestones, createdAt, modifiedAt }]

  // ── Study Log ────────────────────────────────────────────
  studyLog:        [],   // [{ id, date, subject, activity, duration_min, started_at }]
  studySubjects:   null, // null = use defaults; array = user-customized list
  studyActivities: null, // null = use defaults; array = user-customized list
  studyDailyGoal:  240,  // minutes (4 hours)
  studyPomoWork:   25,   // pomodoro work duration in minutes
  studyPomoBreak:  5,    // short break
  studyPomoLong:   15,   // long break after 4 rounds

  // ── Tech Study Log (DevOps Career Elevation tracker) ─────
  techStudyLog:        [],   // mirror of studyLog, separate dataset
  techStudySubjects:   null,
  techStudyActivities: null,
  techStudyDailyGoal:  30,   // minutes per day (textbook 30-min/day mandate)
  techStudyPomoWork:   25,
  techStudyPomoBreak:  5,
  techStudyPomoLong:   15,

  // ─────────────────────────────────────────────────────────

  // Phase 1 — always runs first, uses only local IndexedDB/localStorage
  async init() {
    await Storage.init();
    const data = await Storage.load();
    if (data) this._applyLoaded(data);
    // Always open on today regardless of what was stored last session
    this.selectedDate  = new Date();
    this.calendarMonth = new Date();
    document.documentElement.setAttribute('data-theme', this.theme || 'dark');
  },

  // Phase 2 -- runs once after sign-in.
  // ALWAYS merges local + cloud regardless of timestamps — this is the only way to
  // guarantee no data is lost. Timestamp comparison was the root cause of past data
  // loss: a device with a "newer" clock would push its partial state and silently
  // overwrite additive data written on other devices while it was offline.
  async syncCloud() {
    const cloudData = await CloudSync.pull();
    if (cloudData === undefined) return; // pull error — do NOT overwrite cloud with local
    if (!cloudData) {
      // No cloud doc yet. Only seed Firestore if this device has previously saved
      // data (_savedAt is set). A brand-new device with empty local state must NOT
      // create an empty cloud doc — that would wipe another device's data in Firestore.
      if (this._savedAt) this._doSave();
      return;
    }
    // Snapshot local state before touching anything
    if (typeof BackupManager !== 'undefined') await BackupManager.create('pre-sync');
    // Preserve the user's active tab — _applyLoaded() will overwrite currentTab
    // from cloud data, causing updateAll() to switch and hide the visible panel.
    const activeTab   = this.currentTab;
    const activeDate  = new Date(this.selectedDate);
    const activeMonth = new Date(this.calendarMonth);
    // Merge every domain from both sides — union arrays, deep-merge logs
    const merged = this._mergeWithCloud(cloudData);
    CloudSync.cancelPush();
    this._applyLoaded(merged);
    // Restore UI navigation state — cloud must never override what the user is currently viewing
    this.currentTab    = activeTab;
    this.selectedDate  = activeDate;
    this.calendarMonth = activeMonth;
    Storage.save(merged);
    this._doSave(); // push merged result back so all devices converge
    if (typeof UI !== 'undefined') UI.updateAll();
  },

  _applyLoaded(d) {
    if (!d) return;
    try {
      this._savedAt             = d._savedAt             || null;
      this.currentTab           = (d.currentTab === 'tech-study' ? 'growth' : d.currentTab) || 'today';
      this.theme                = d.theme                || 'dark';
      this.dashboardCollapsed   = d.dashboardCollapsed   || false;
      this.nriAccountLive       = d.nriAccountLive       || false;
      this.sipActive            = d.sipActive            || false;
      this.pastimeStart         = d.pastimeStart         || d.nofapStart || null;
      this.selectedDate  = d.selectedDate  ? new Date(d.selectedDate)  : new Date();
      this.calendarMonth = d.calendarMonth ? new Date(d.calendarMonth) : new Date();
      const pick = (key, def) => d[key] != null ? d[key] : def;
      this.checkedItems         = pick('checkedItems',     {});
      this.holidayOverrides     = pick('holidayOverrides', {});
      this.dailyHistory         = pick('dailyHistory',     {});
      this.upscSubjectProgress  = pick('upscSubjectProgress', {});
      this.upscSubjectTotals    = pick('upscSubjectTotals',   {});
      this.upscSubjectProgressUpdatedAt = d.upscSubjectProgressUpdatedAt ?? null;
      this.upscSubjectTotalsUpdatedAt   = d.upscSubjectTotalsUpdatedAt   ?? null;
      this.upscSchedule         = pick('upscSchedule',    []);
      this.upscProgress         = pick('upscProgress',    0);
      this.financeEntries       = pick('financeEntries',  []);
      this.investments          = pick('investments',     []);
      this.monthlyExpenses      = pick('monthlyExpenses', []);
      this.healthLog            = pick('healthLog',       {});
      this.cholesterol          = pick('cholesterol',     []);
      this.caLog                = pick('caLog',           {});
      this.pastimeLog           = d.pastimeLog != null ? d.pastimeLog : (d.nofapLog != null ? d.nofapLog : []);
      this.mindLog              = pick('mindLog',         {});
      this.careerLog            = pick('careerLog',       {});
      this.booksLog             = pick('booksLog',        {});
      this.weeklyReviews        = pick('weeklyReviews',   {});
      this.monthlyReviews       = pick('monthlyReviews',  {});
      this.partnerLog           = pick('partnerLog',      []);
      this.habitStacks          = pick('habitStacks',     {});
      this.dubaiChecklist       = pick('dubaiChecklist',  {});
      this.taskBuckets          = pick('taskBuckets',     []);
      this.tasks                = pick('tasks',           []);
      this.tasksOrderedAt       = d.tasksOrderedAt       ?? null;
      this.taskBucketsOrderedAt = d.taskBucketsOrderedAt ?? null;
      this.goals                = pick('goals',           []);
      this.studyLog             = pick('studyLog',        []);
      this.studySubjects        = d.studySubjects  ?? null;
      this.studyActivities      = d.studyActivities ?? null;
      // Migrate old 480-min (8h) default → 240-min (4h)
      this.studyDailyGoal = (d.studyDailyGoal && d.studyDailyGoal !== 480) ? d.studyDailyGoal : 240;
      this.studyPomoWork        = d.studyPomoWork   ?? 25;
      this.studyPomoBreak       = d.studyPomoBreak  ?? 5;
      this.studyPomoLong        = d.studyPomoLong   ?? 15;
      // Tech study tracker (parallel to UPSC study tracker)
      this.techStudyLog         = pick('techStudyLog', []);
      this.techStudySubjects    = d.techStudySubjects   ?? null;
      this.techStudyActivities  = d.techStudyActivities ?? null;
      this.techStudyDailyGoal   = d.techStudyDailyGoal  ?? 30;
      this.techStudyPomoWork    = d.techStudyPomoWork   ?? 25;
      this.techStudyPomoBreak   = d.techStudyPomoBreak  ?? 5;
      this.techStudyPomoLong    = d.techStudyPomoLong   ?? 15;
    } catch(e) {
      console.error('State load error:', e);
    }
  },

  save() {
    // Debounce saves to reduce localStorage writes
    if (this._savePending) clearTimeout(this._savePending);
    this._savePending = setTimeout(() => {
      this._doSave();
      this._savePending = null;
    }, 300);
  },

  // Builds the full serialisable payload from current state.
  _buildPayload() {
    return {
      _savedAt: new Date().toISOString(),
      selectedDate: this.selectedDate.toISOString(),
      calendarMonth: this.calendarMonth.toISOString(),
      currentTab: this.currentTab,
      theme: this.theme,
      dashboardCollapsed: this.dashboardCollapsed,
      nriAccountLive: this.nriAccountLive,
      sipActive: this.sipActive,
      pastimeStart: this.pastimeStart,
      checkedItems: this.checkedItems,
      holidayOverrides: this.holidayOverrides,
      dailyHistory: this.dailyHistory,
      upscSubjectProgress: this.upscSubjectProgress,
      upscSubjectTotals:   this.upscSubjectTotals,
      upscSubjectProgressUpdatedAt: this.upscSubjectProgressUpdatedAt,
      upscSubjectTotalsUpdatedAt:   this.upscSubjectTotalsUpdatedAt,
      upscSchedule: this.upscSchedule,
      upscProgress: this.upscProgress,
      financeEntries: this.financeEntries,
      investments: this.investments,
      monthlyExpenses: this.monthlyExpenses,
      healthLog: this.healthLog,
      cholesterol: this.cholesterol,
      caLog: this.caLog,
      pastimeLog: this.pastimeLog,
      mindLog: this.mindLog,
      careerLog: this.careerLog,
      booksLog: this.booksLog,
      weeklyReviews: this.weeklyReviews,
      monthlyReviews: this.monthlyReviews,
      partnerLog: this.partnerLog,
      habitStacks: this.habitStacks,
      dubaiChecklist: this.dubaiChecklist,
      taskBuckets:          this.taskBuckets,
      tasks:                this.tasks,
      tasksOrderedAt:       this.tasksOrderedAt,
      taskBucketsOrderedAt: this.taskBucketsOrderedAt,
      goals:                this.goals,
      studyLog:        this.studyLog,
      studySubjects:   this.studySubjects,
      studyActivities: this.studyActivities,
      studyDailyGoal:  this.studyDailyGoal,
      studyPomoWork:   this.studyPomoWork,
      studyPomoBreak:  this.studyPomoBreak,
      studyPomoLong:   this.studyPomoLong,
      techStudyLog:        this.techStudyLog,
      techStudySubjects:   this.techStudySubjects,
      techStudyActivities: this.techStudyActivities,
      techStudyDailyGoal:  this.techStudyDailyGoal,
      techStudyPomoWork:   this.techStudyPomoWork,
      techStudyPomoBreak:  this.techStudyPomoBreak,
      techStudyPomoLong:   this.techStudyPomoLong
    };
  },

  _doSave() {
    const payload = this._buildPayload();
    // Persist theme to localStorage so inline head script applies it instantly next load
    try { localStorage.setItem('skadi_theme', this.theme); } catch(e) {}
    Storage.save(payload);
    CloudSync.push(payload); // Push to Firestore (no-op when not configured)
  },

  // Smart merge: union arrays by id, deep-merge object logs.
  // Neither side loses data — prevents overwrite-based data loss across devices.
  _mergeWithCloud(cloudData) {
    const local = this._buildPayload();

    // Arrays with .id: union by id, conflict resolved by modifiedAt/createdAt timestamp.
    // The newer version of each item wins. 'done' is always OR'd so a completion on
    // any device is never un-done even when an older version of the item is present.
    const _itemMs = item => new Date(item.modifiedAt || item.createdAt || 0).getTime();

    // Standard union: content-merges by id, result follows cloud insertion order.
    const _byId = (la, ca) => {
      const map = new Map();
      (ca || []).forEach(item => { if (item.id != null) map.set(item.id, item); });
      (la || []).forEach(item => {
        if (item.id == null) return;
        if (!map.has(item.id)) {
          map.set(item.id, item);
        } else {
          const cloud = map.get(item.id);
          // Newer timestamp wins; if equal, local wins (active device assumption)
          const useLocal = _itemMs(item) > _itemMs(cloud);
          const winner = useLocal ? { ...cloud, ...item } : { ...item, ...cloud };
          if (cloud.done === true || item.done === true) winner.done = true;
          map.set(item.id, winner);
        }
      });
      return [...map.values()];
    };

    // Order-aware union for drag-and-drop lists (tasks, buckets).
    // localTs / cloudTs are the timestamps of the last reorder on each side.
    // Whichever side reordered more recently owns the ordering; the other side's
    // unique items are appended at the end so nothing is lost.
    const _byIdOrdered = (la, ca, localTs, cloudTs) => {
      const map = new Map();
      (ca || []).forEach(item => { if (item.id != null) map.set(item.id, item); });
      (la || []).forEach(item => {
        if (item.id == null) return;
        if (!map.has(item.id)) {
          map.set(item.id, item);
        } else {
          const cloud = map.get(item.id);
          const useLocal = _itemMs(item) > _itemMs(cloud);
          const winner = useLocal ? { ...cloud, ...item } : { ...item, ...cloud };
          if (cloud.done === true || item.done === true) winner.done = true;
          map.set(item.id, winner);
        }
      });
      // Pick ordering from whichever side has the more recent reorder timestamp
      const useLocalOrder = new Date(localTs || 0) >= new Date(cloudTs || 0);
      const primary   = useLocalOrder ? (la || []) : (ca || []);
      const secondary = useLocalOrder ? (ca || []) : (la || []);
      const primaryIds = new Set(primary.map(t => t.id));
      return [
        ...primary.filter(t => t.id != null && map.has(t.id)).map(t => map.get(t.id)),
        ...secondary.filter(t => t.id != null && !primaryIds.has(t.id) && map.has(t.id)).map(t => map.get(t.id)),
      ];
    };

    // Arrays with no id — dedup by date+type (pastimeLog, partnerLog)
    const _byDateType = (la, ca) => {
      const map = new Map();
      const k = e => `${e.date || ''}|${e.type || ''}`;
      (ca || []).forEach(item => map.set(k(item), item));
      (la || []).forEach(item => { const key = k(item); if (!map.has(key)) map.set(key, item); });
      return [...map.values()];
    };

    // Single measurement per date (cholesterol)
    const _byDate = (la, ca) => {
      const map = new Map();
      (ca || []).forEach(item => { if (item.date) map.set(item.date, item); });
      (la || []).forEach(item => { if (item.date && !map.has(item.date)) map.set(item.date, item); });
      return [...map.values()];
    };

    // Object logs: cloud base + local keys override (local = current device)
    const _mergeObj = (lo, co) => ({ ...(co || {}), ...(lo || {}) });

    // UPSC progress / totals: last-write-wins so intentional reductions sync correctly.
    // Each field carries its own *UpdatedAt timestamp; the more-recently-written side wins.
    // Falls back to local-wins when neither side has a timestamp (legacy data).
    const _lwwObj = (localVal, cloudVal, localTs, cloudTs) => {
      if (!localTs && !cloudTs) return { ...(cloudVal || {}), ...(localVal || {}) };
      return (localTs || '') >= (cloudTs || '') ? (localVal || {}) : (cloudVal || {});
    };
    const _laterTs = (a, b) => (!a ? b : !b ? a : a >= b ? a : b);

    // Streak start: keep the LATER date — a later pastimeStart means a more
    // recent reset, so the reset must win over an older cloud value.
    const _laterDate = (a, b) => {
      if (!a) return b; if (!b) return a;
      return new Date(a) > new Date(b) ? a : b;
    };

    return {
      ...cloudData,
      // Order-sensitive arrays: most-recently-reordered side's ordering wins
      tasks:                _byIdOrdered(local.tasks, cloudData.tasks, local.tasksOrderedAt, cloudData.tasksOrderedAt),
      taskBuckets:          _byIdOrdered(local.taskBuckets, cloudData.taskBuckets, local.taskBucketsOrderedAt, cloudData.taskBucketsOrderedAt),
      tasksOrderedAt:       local.tasksOrderedAt > (cloudData.tasksOrderedAt||'') ? local.tasksOrderedAt : (cloudData.tasksOrderedAt||null),
      taskBucketsOrderedAt: local.taskBucketsOrderedAt > (cloudData.taskBucketsOrderedAt||'') ? local.taskBucketsOrderedAt : (cloudData.taskBucketsOrderedAt||null),
      studyLog:        _byId(local.studyLog,         cloudData.studyLog),
      techStudyLog:    _byId(local.techStudyLog,     cloudData.techStudyLog),
      investments:     _byId(local.investments,      cloudData.investments),
      financeEntries:  _byId(local.financeEntries,   cloudData.financeEntries),
      monthlyExpenses: _byId(local.monthlyExpenses,  cloudData.monthlyExpenses),
      goals:           _byId(local.goals,            cloudData.goals),
      // Arrays without id
      cholesterol: _byDate(local.cholesterol,     cloudData.cholesterol),
      pastimeLog:  _byDateType(local.pastimeLog || local.nofapLog, cloudData.pastimeLog || cloudData.nofapLog),
      partnerLog:  _byDateType(local.partnerLog,  cloudData.partnerLog),
      // Object logs — deep merge
      checkedItems:        _mergeObj(local.checkedItems,        cloudData.checkedItems),
      holidayOverrides:    _mergeObj(local.holidayOverrides,    cloudData.holidayOverrides),
      dailyHistory:        _mergeObj(local.dailyHistory,        cloudData.dailyHistory),
      healthLog:           _mergeObj(local.healthLog,           cloudData.healthLog),
      mindLog:             _mergeObj(local.mindLog,             cloudData.mindLog),
      caLog:               _mergeObj(local.caLog,               cloudData.caLog),
      careerLog:           _mergeObj(local.careerLog,           cloudData.careerLog),
      booksLog:            _mergeObj(local.booksLog,            cloudData.booksLog),
      weeklyReviews:       _mergeObj(local.weeklyReviews,       cloudData.weeklyReviews),
      monthlyReviews:      _mergeObj(local.monthlyReviews,      cloudData.monthlyReviews),
      habitStacks:         _mergeObj(local.habitStacks,         cloudData.habitStacks),
      dubaiChecklist:      _mergeObj(local.dubaiChecklist,      cloudData.dubaiChecklist),
      upscSubjectProgress: _lwwObj(
        local.upscSubjectProgress, cloudData.upscSubjectProgress,
        local.upscSubjectProgressUpdatedAt, cloudData.upscSubjectProgressUpdatedAt
      ),
      upscSubjectTotals: _lwwObj(
        local.upscSubjectTotals, cloudData.upscSubjectTotals,
        local.upscSubjectTotalsUpdatedAt, cloudData.upscSubjectTotalsUpdatedAt
      ),
      upscSubjectProgressUpdatedAt: _laterTs(local.upscSubjectProgressUpdatedAt, cloudData.upscSubjectProgressUpdatedAt),
      upscSubjectTotalsUpdatedAt:   _laterTs(local.upscSubjectTotalsUpdatedAt,   cloudData.upscSubjectTotalsUpdatedAt),
      upscProgress:        Math.max(local.upscProgress || 0,    cloudData.upscProgress || 0),
      upscSchedule: (local.upscSchedule || []).length >= (cloudData.upscSchedule || []).length
        ? local.upscSchedule : cloudData.upscSchedule,
      pastimeStart: _laterDate(local.pastimeStart || local.nofapStart, cloudData.pastimeStart || cloudData.nofapStart),
      _savedAt: new Date().toISOString(),
    };
  },

  // ── Date helpers ─────────────────────────────────────────
  getDateKey(d = null) {
    const date = d || this.selectedDate;
    const y  = date.getFullYear();
    const mo = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${y}-${mo}-${dd}`;
  },

  getTodayKey() {
    return this.getDateKey(new Date());
  },

  getScheduleKey() {
    const override = this.holidayOverrides[this.getDateKey()];
    const day = this.selectedDate.getDay();
    const isNaturalWeekend = (day === 0 || day === 6);
    if (override === 'weekend') return 'weekend';
    if (override === 'weekday') return 'weekday';
    return isNaturalWeekend ? 'weekend' : 'weekday';
  },

  // ── Routine helpers ──────────────────────────────────────
  toggleActivity(key, checked) {
    if (checked) this.checkedItems[key] = true;
    else delete this.checkedItems[key];
    this.save();
  },

  setDailyHistory(dateKey, completed, total) {
    this.dailyHistory[dateKey] = { completed, total, ts: Date.now() };
    this.save();
  },

  // ── Pastime helpers ──────────────────────────────────────
  getPastimeStreak() {
    if (!this.pastimeStart) return 0;
    // Use calendar days (midnight-to-midnight) so a same-day reset shows 0,
    // next calendar day shows 1 — regardless of the time of day reset happened.
    const start = new Date(this.pastimeStart);
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.max(0, Math.floor((today - startDay) / 864e5));
  },

  logReset(reason, note = '') {
    this.pastimeLog.push({ date: this.getTodayKey(), type: 'reset', reason, note });
    this.pastimeStart = new Date().toISOString();
    this.save();
  },

  startStreak() {
    this.pastimeStart = new Date().toISOString();
    this.save();
  },

  // ── Health helpers ───────────────────────────────────────
  getTodayHealth() {
    return this.healthLog[this.getTodayKey()] || { sleep_h: null, gym: false, phone_h: null };
  },

  setTodayHealth(updates) {
    const key = this.getTodayKey();
    this.healthLog[key] = { ...(this.healthLog[key] || {}), ...updates };
    this.save();
  },

  getSelectedHealth() {
    return this.healthLog[this.getDateKey()] || { sleep_h: null, gym: false, phone_h: null };
  },

  setSelectedHealth(updates) {
    const key = this.getDateKey();
    this.healthLog[key] = { ...(this.healthLog[key] || {}), ...updates };
    this.save();
  },

  // ── Current Affairs helpers ──────────────────────────────
  getSelectedCA() {
    return this.caLog[this.getDateKey()] || { done: false, articles: [] };
  },

  setCADone(val) {
    const key = this.getDateKey();
    this.caLog[key] = { ...(this.caLog[key] || { articles: [] }), done: val };
    this.save();
  },

  addCAArticle(article) {
    const key = this.getDateKey();
    if (!this.caLog[key]) this.caLog[key] = { done: false, articles: [] };
    this.caLog[key].articles.push({ id: Date.now(), ...article });
    this.caLog[key].done = true;
    this.save();
  },

  removeCAArticle(id) {
    const key = this.getDateKey();
    if (!this.caLog[key]) return;
    this.caLog[key].articles = this.caLog[key].articles.filter(a => a.id !== id);
    if (!this.caLog[key].articles.length) this.caLog[key].done = false;
    this.save();
  },

  getCAStreak() {
    let streak = 0;
    const d = new Date();
    while (true) {
      const k = this.getDateKey(d);
      if (!this.caLog[k]?.done) break;
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  },

  getLast7SleepAvg() {
    const vals = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = this.getDateKey(d);
      const v = this.healthLog[k]?.sleep_h;
      if (v != null) vals.push(v);
    }
    if (!vals.length) return null;
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  },

  getWeekGymCount() {
    let count = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = this.getDateKey(d);
      if (this.healthLog[k]?.gym) count++;
    }
    return count;
  },

  // ── Finance helpers ──────────────────────────────────────
  getTotalSavedAED() {
    return this.financeEntries.reduce((s, e) => s + (e.saved_aed || 0), 0);
  },

  getTotalTransferredINR() {
    return this.financeEntries.reduce((s, e) => s + (e.transferred_inr || 0), 0);
  },

  // ── Export/Import ───────────────────────────────────────
  exportData() {
    const data = this._buildPayload();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skadi-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        // _applyLoaded handles all fields (including taskBuckets/tasks) in one place
        this._applyLoaded(data);
        this.save();
        if (typeof UI !== 'undefined' && UI.showToast) {
          UI.showToast('✅ Data imported successfully!');
        }
        location.reload();
      } catch (err) {
        alert('❌ Import failed: Invalid file format');
        console.error('Import error:', err);
      }
    };
    reader.readAsText(file);
  }
};

// AppState.init() is async — called from main.js after DOMContentLoaded
