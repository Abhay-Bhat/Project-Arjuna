// ============================================================
// ATHENA — Application State (v2)
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

  // ── Mind (NoFap + Mental) ────────────────────────────────
  nofapStart:      null, // ISO string — streak start date
  nofapLog:        [],   // [{ date, type:'relapse'|'check', trigger, note }]
  mindLog:         {},   // { 'YYYY-MM-DD': { loneliness:1-5, meditation_min, parents } }

  // ── Growth ───────────────────────────────────────────────
  careerLog:       {},   // { milestone_id: { done, date, note } }
  booksLog:        {},   // { 'YYYY-MM': { title, pages_read, total_pages, done, note } }
  weeklyReviews:   {},   // { 'YYYY-Www': { q1..q10, submitted_at } }
  monthlyReviews:  {},   // { 'YYYY-MM': { domains, submitted_at } }
  partnerLog:      [],   // [{ date, type:'msg'|'call'|'meet', note }]

  // ── Dubai Checklist ──────────────────────────────────────
  dubaiChecklist:  {},   // { item_id: true }

  // ── Tasks (Planner) ──────────────────────────────────────
  taskBuckets:     [],   // [{ id, title, color }]
  tasks:           [],   // [{ id, bucketId, title, dueDate, priority, done, createdAt }]

  // ─────────────────────────────────────────────────────────

  // Phase 1 — always runs first, uses only local IndexedDB/localStorage
  async init() {
    await Storage.init();
    const data = await Storage.load();
    if (data) this._applyLoaded(data);
    document.documentElement.setAttribute('data-theme', this.theme || 'dark');
  },

  // Phase 2 -- runs once after sign-in; applies cloud data unconditionally.
  // No timestamp comparison: UI.init() renders immediately and calls AppState.save()
  // which stamps _savedAt = NOW, making any cloud data look stale.  Cloud wins on
  // load because it represents the latest state across all devices.
  async syncCloud() {
    const cloudData = await CloudSync.pull();
    if (!cloudData) return;
    this._applyLoaded(cloudData);
    Storage.save(cloudData);
    if (typeof UI !== 'undefined') UI.updateAll();
  },

  _applyLoaded(d) {
    if (!d) return;
    try {
      this.currentTab           = d.currentTab           || 'today';
      this.theme                = d.theme                || 'dark';
      this.dashboardCollapsed   = d.dashboardCollapsed   || false;
      this.nriAccountLive       = d.nriAccountLive       || false;
      this.sipActive            = d.sipActive            || false;
      this.nofapStart           = d.nofapStart           || null;
      this.selectedDate  = d.selectedDate  ? new Date(d.selectedDate)  : new Date();
      this.calendarMonth = d.calendarMonth ? new Date(d.calendarMonth) : new Date();
      const pick = (key, def) => d[key] != null ? d[key] : def;
      this.checkedItems         = pick('checkedItems',     {});
      this.holidayOverrides     = pick('holidayOverrides', {});
      this.dailyHistory         = pick('dailyHistory',     {});
      this.upscSubjectProgress  = pick('upscSubjectProgress', {});
      this.upscSchedule         = pick('upscSchedule',    []);
      this.upscProgress         = pick('upscProgress',    0);
      this.financeEntries       = pick('financeEntries',  []);
      this.investments          = pick('investments',     []);
      this.monthlyExpenses      = pick('monthlyExpenses', []);
      this.healthLog            = pick('healthLog',       {});
      this.cholesterol          = pick('cholesterol',     []);
      this.caLog                = pick('caLog',           {});
      this.nofapLog             = pick('nofapLog',        []);
      this.mindLog              = pick('mindLog',         {});
      this.careerLog            = pick('careerLog',       {});
      this.booksLog             = pick('booksLog',        {});
      this.weeklyReviews        = pick('weeklyReviews',   {});
      this.monthlyReviews       = pick('monthlyReviews',  {});
      this.partnerLog           = pick('partnerLog',      []);
      this.dubaiChecklist       = pick('dubaiChecklist',  {});
      this.taskBuckets          = pick('taskBuckets',     []);
      this.tasks                = pick('tasks',           []);
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

  _doSave() {
    const payload = {
      _savedAt: new Date().toISOString(), // Timestamp for cloud conflict resolution
      selectedDate: this.selectedDate.toISOString(),
      calendarMonth: this.calendarMonth.toISOString(),
      currentTab: this.currentTab,
      theme: this.theme,
      dashboardCollapsed: this.dashboardCollapsed,
      nriAccountLive: this.nriAccountLive,
      sipActive: this.sipActive,
      nofapStart: this.nofapStart,
      checkedItems: this.checkedItems,
      holidayOverrides: this.holidayOverrides,
      dailyHistory: this.dailyHistory,
      upscSubjectProgress: this.upscSubjectProgress,
      upscSchedule: this.upscSchedule,
      upscProgress: this.upscProgress,
      financeEntries: this.financeEntries,
      investments: this.investments,
      monthlyExpenses: this.monthlyExpenses,
      healthLog: this.healthLog,
      cholesterol: this.cholesterol,
      caLog: this.caLog,
      nofapLog: this.nofapLog,
      mindLog: this.mindLog,
      careerLog: this.careerLog,
      booksLog: this.booksLog,
      weeklyReviews: this.weeklyReviews,
      monthlyReviews: this.monthlyReviews,
      partnerLog: this.partnerLog,
      dubaiChecklist: this.dubaiChecklist,
      taskBuckets:    this.taskBuckets,
      tasks:          this.tasks
    };
    Storage.save(payload);
    CloudSync.push(payload); // Push to Firestore (no-op when not configured)
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
    let effectiveDay = day;
    if (override === 'weekend') effectiveDay = 6;
    if (override === 'weekday') effectiveDay = 1;

    const tmpDate = new Date(this.selectedDate);
    // Use a date with the overridden weekday for phase detection
    return PhaseManager.getScheduleKey(tmpDate);
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

  // ── NoFap helpers ────────────────────────────────────────
  getNoFapStreak() {
    if (!this.nofapStart) return 0;
    const start = new Date(this.nofapStart);
    const now   = new Date();
    return Math.max(0, Math.floor((now - start) / 864e5));
  },

  logRelapse(trigger, note = '') {
    this.nofapLog.push({ date: this.getTodayKey(), type: 'relapse', trigger, note });
    this.nofapStart = new Date().toISOString();
    this.save();
  },

  startStreak() {
    this.nofapStart = new Date().toISOString();
    this.save();
  },

  // ── Health helpers ───────────────────────────────────────
  getTodayHealth() {
    return this.healthLog[this.getTodayKey()] || { sleep_h: null, gym: false, phone_h: null, ca_done: false };
  },

  setTodayHealth(updates) {
    const key = this.getTodayKey();
    this.healthLog[key] = { ...(this.healthLog[key] || {}), ...updates };
    this.save();
  },

  getSelectedHealth() {
    return this.healthLog[this.getDateKey()] || { sleep_h: null, gym: false, phone_h: null, ca_done: false };
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

  // ── Mind helpers ─────────────────────────────────────────
  getTodayMind() {
    return this.mindLog[this.getTodayKey()] || { loneliness: null, meditation_min: 0, parents: false };
  },

  setTodayMind(updates) {
    const key = this.getTodayKey();
    this.mindLog[key] = { ...(this.mindLog[key] || {}), ...updates };
    this.save();
  },

  getSelectedMind() {
    return this.mindLog[this.getDateKey()] || { loneliness: null, meditation_min: 0, parents: false };
  },

  setSelectedMind(updates) {
    const key = this.getDateKey();
    this.mindLog[key] = { ...(this.mindLog[key] || {}), ...updates };
    this.save();
  },

  // ── Export/Import ───────────────────────────────────────
  exportData() {
    const data = {
      selectedDate: this.selectedDate.toISOString(),
      calendarMonth: this.calendarMonth.toISOString(),
      currentTab: this.currentTab,
      theme: this.theme,
      dashboardCollapsed: this.dashboardCollapsed,
      nriAccountLive: this.nriAccountLive,
      sipActive: this.sipActive,
      nofapStart: this.nofapStart,
      checkedItems: this.checkedItems,
      holidayOverrides: this.holidayOverrides,
      dailyHistory: this.dailyHistory,
      upscSubjectProgress: this.upscSubjectProgress,
      upscSchedule: this.upscSchedule,
      upscProgress: this.upscProgress,
      financeEntries: this.financeEntries,
      investments: this.investments,
      monthlyExpenses: this.monthlyExpenses,
      healthLog: this.healthLog,
      cholesterol: this.cholesterol,
      caLog: this.caLog,
      nofapLog: this.nofapLog,
      mindLog: this.mindLog,
      careerLog: this.careerLog,
      booksLog: this.booksLog,
      weeklyReviews: this.weeklyReviews,
      monthlyReviews: this.monthlyReviews,
      partnerLog: this.partnerLog,
      dubaiChecklist: this.dubaiChecklist
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `athena-backup-${new Date().toISOString().split('T')[0]}.json`;
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
        // Restore all data fields
        this.selectedDate = new Date(data.selectedDate || new Date());
        this.calendarMonth = new Date(data.calendarMonth || new Date());
        this.currentTab = data.currentTab || 'today';
        this.theme = data.theme || 'dark';
        this.dashboardCollapsed = data.dashboardCollapsed || false;
        this.nriAccountLive = data.nriAccountLive || false;
        this.sipActive = data.sipActive || false;
        this.nofapStart = data.nofapStart || null;
        this.checkedItems = data.checkedItems || {};
        this.holidayOverrides = data.holidayOverrides || {};
        this.dailyHistory = data.dailyHistory || {};
        this.upscSubjectProgress = data.upscSubjectProgress || {};
        this.upscSchedule = data.upscSchedule || [];
        this.upscProgress = data.upscProgress || 0;
        this.financeEntries  = data.financeEntries   || [];
        this.investments     = data.investments      || [];
        this.monthlyExpenses = data.monthlyExpenses  || [];
        this.healthLog = data.healthLog || {};
        this.cholesterol = data.cholesterol || [];
        this.caLog = data.caLog || {};
        this.nofapLog = data.nofapLog || [];
        this.mindLog = data.mindLog || {};
        this.careerLog = data.careerLog || {};
        this.booksLog = data.booksLog || {};
        this.weeklyReviews = data.weeklyReviews || {};
        this.monthlyReviews = data.monthlyReviews || {};
        this.partnerLog = data.partnerLog || [];
        this.dubaiChecklist = data.dubaiChecklist || {};
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
