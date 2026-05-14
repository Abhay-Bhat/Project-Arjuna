// ============================================================
// ATHENA — Finance Tracker (Enhanced v2)
// Dubai savings + Investment Portfolio + Expense Tracker
// ============================================================

// EPFO historical interest rates by financial year (for maturity projections)
const EPF_FY_RATES = {
  '2015-16': 8.75, '2016-17': 8.65, '2017-18': 8.55,
  '2018-19': 8.65, '2019-20': 8.50, '2020-21': 8.50,
  '2021-22': 8.10, '2022-23': 8.15, '2023-24': 8.25,
  '2024-25': 8.25, '2025-26': 8.25,
};
// Get EPF rate for a given financial year string like '2024-25'
function epfRateForFY(fy) {
  return EPF_FY_RATES[fy] || 8.25;
}
// Get EPF rate for the current financial year
function currentEPFRate() {
  const now = new Date();
  const yr = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return EPF_FY_RATES[`${yr}-${String(yr+1).slice(2)}`] || 8.25;
}

const FINANCE_TARGET_AED  = 199800;
const FINANCE_TARGET_INR  = 4600000;
const FINANCE_BASELINE    = 0;
const FINANCE_TOTAL_GOAL  = 5900000;
const MONTHLY_TRANSFER    = 250000;

// API Keys for stock price providers (optional, improves reliability)
// Get free API key from: https://financialmodelingprep.com/developer/docs
const FMP_API_KEY = null; // Set to your Financial Modeling Prep API key
// Get free API key from: https://www.alphavantage.co/support/#api-key
const ALPHA_VANTAGE_API_KEY = null; // Set to your Alpha Vantage API key
// Optional CORS proxy for browser-based fetches when direct provider CORS is blocked.
// Example: const CORS_PROXY = 'https://corsproxy.io/?';
const CORS_PROXY = null;
const MONTHLY_SIP         = 50000;

// Insurance types that are pure protection (no wealth value)
const INS_PROTECTION_TYPES = ['Term', 'Health', 'Accident'];

// ── Financial Rate Configuration Engine ────────────────────

// Bank-specific FD rates (% p.a.) keyed by tenure bracket in years
// Rates as of Q1 2025 — user can always override manually
const FD_BANK_RATES = {
  SBI:     { 0.5: 6.50, 1: 6.80, 2: 7.00, 3: 6.75, 5: 6.50,  def: 6.80 },
  HDFC:    { 0.5: 6.60, 1: 7.10, 2: 7.25, 3: 7.15, 5: 7.00,  def: 7.10 },
  ICICI:   { 0.5: 6.50, 1: 6.90, 2: 7.25, 3: 7.10, 5: 7.00,  def: 7.00 },
  AXIS:    { 0.5: 6.50, 1: 7.10, 2: 7.26, 3: 7.10, 5: 7.00,  def: 7.10 },
  KOTAK:   { 0.5: 6.50, 1: 7.10, 2: 7.25, 3: 7.10, 5: 6.60,  def: 7.10 },
  BOB:     { 0.5: 5.50, 1: 6.85, 2: 7.05, 3: 6.80, 5: 6.50,  def: 6.85 },
  PNB:     { 0.5: 5.50, 1: 6.80, 2: 6.80, 3: 6.50, 5: 6.50,  def: 6.80 },
  CANARA:  { 0.5: 5.50, 1: 6.85, 2: 6.85, 3: 6.80, 5: 6.70,  def: 6.85 },
  UNION:   { 0.5: 5.50, 1: 6.80, 2: 6.80, 3: 6.75, 5: 6.50,  def: 6.80 },
  INDUS:   { 0.5: 6.75, 1: 7.50, 2: 7.75, 3: 7.50, 5: 7.25,  def: 7.50 },
  YES:     { 0.5: 6.75, 1: 7.50, 2: 7.75, 3: 7.50, 5: 7.25,  def: 7.50 },
  RBL:     { 0.5: 7.00, 1: 7.80, 2: 7.80, 3: 7.55, 5: 7.10,  def: 7.80 },
  IDFC:    { 0.5: 6.50, 1: 7.75, 2: 7.75, 3: 7.50, 5: 7.00,  def: 7.75 },
  BAJAJ:   { 0.5: 6.50, 1: 7.50, 2: 7.80, 3: 7.95, 5: 7.80,  def: 7.80 },
  POST:    { 0.5: 6.20, 1: 6.90, 2: 7.00, 3: 7.10, 5: 7.50,  def: 7.10 }, // Post Office FD
  DEFAULT: { 0.5: 6.50, 1: 7.00, 2: 7.00, 3: 7.00, 5: 6.75,  def: 7.00 },
};

// Per-type default rates, tenure, compounding, and amount-field label
const INV_RATE_CONFIG = {
  PPF:        { rate: 7.1,  tenure: 15, compound: 'annual_fy',  amtLabel: 'Annual Contribution (₹)',  max: 150000, note: 'Govt. rate revised quarterly. Interest credited Mar 31 each FY. Max ₹1.5L/yr. Enter "Prior Corpus" if account pre-existed your start date.' },
  EPF:        { rate: 8.25, tenure: 30, compound: 'monthly_ann',amtLabel: 'Monthly Employee Contribution (₹)', note: 'EPFO rate FY 2023-24. Includes 3.67% employer match to EPF.' },
  SIP:        { rate: 12.0, tenure: 10, compound: 'monthly',    amtLabel: 'Monthly SIP Amount (₹)',   note: 'Historical Nifty 50 CAGR. Not guaranteed — market-linked. Use 12% as baseline.' },
  Deposits:   { rate: 7.0,  tenure: 1,  compound: 'quarterly',  amtLabel: 'Principal Amount (₹)',     note: 'FD: lump-sum, quarterly compounding. RD: monthly instalment, monthly compounding. Rate auto-detected from bank name.' },
  Shares:     { rate: 12.0, tenure: 10, compound: 'annual',     amtLabel: 'Amount Invested (₹)',      note: 'Historical Nifty 50 CAGR. Not guaranteed.' },
  Bonds:      { rate: 7.2,  tenure: 5,  compound: 'annual',     amtLabel: 'Investment Amount (₹)',    note: 'Avg. Govt. savings bond yield. Use actual coupon rate for corporate bonds.' },
  Gold:       { rate: 10.5, tenure: 8,  compound: 'annual',     amtLabel: 'Investment Amount (₹)',    note: 'SGB: 2.5% fixed interest + ~8% gold price CAGR = ~10.5% total est.' },
  RealEstate: { rate: 9.0,  tenure: 10, compound: 'annual',     amtLabel: 'Purchase / Down-payment (₹)', note: 'Historical Indian real estate CAGR est. (metro cities ~10-12%).' },
  Crypto:     { rate: 15.0, tenure: 5,  compound: 'annual',     amtLabel: 'Amount Invested (₹)',      note: 'Highly speculative. Conservative 15% est. Actual returns vary wildly.' },
  Insurance:  { rate: 5.5,  tenure: 20, compound: 'annual',     amtLabel: 'Annual Premium (₹)',       note: 'Term/Health: No returns. ULIP ~10-12% (market). Endowment ~4-5%.' },
  Other:      { rate: 7.0,  tenure: 5,  compound: 'annual',     amtLabel: 'Amount Invested (₹)',      note: 'Generic estimate. Override rate manually for accuracy.' },
};

const EXPENSE_CATEGORIES = [
  { key: 'housing',       label: 'Housing & Utilities',  icon: '🏠' },
  { key: 'food',          label: 'Food & Dining',         icon: '🍽️' },
  { key: 'transport',     label: 'Transport & Fuel',      icon: '🚗' },
  { key: 'health',        label: 'Health & Medical',      icon: '💊' },
  { key: 'education',     label: 'Education & Learning',  icon: '📚' },
  { key: 'entertainment', label: 'Entertainment & Subs',  icon: '🎬' },
  { key: 'shopping',      label: 'Shopping & Personal',   icon: '🛍️' },
  { key: 'insurance',     label: 'Insurance Premiums',    icon: '🛡️' },
  { key: 'savings',       label: 'Savings & Investments', icon: '💰' },
  { key: 'other',         label: 'Other',                 icon: '📦' },
];

const FinanceTracker = {

  render() {
    this.renderSummary();
    this.renderInvestments();
    this.renderCharts();
    this.renderEntryForm();
    this.renderLog();
    this.renderChecklist();
    this.renderExpenses();
    this._bindInvestmentFormToggle();
    this._bindModals();
  },

  // ═══ Dubai Savings (unchanged) ════════════════════════════

  renderCharts() {
    this._renderSavingsChart();
    this.renderInvestmentChart();
    this.renderExpenseChart();
    this.renderOverviewChart();
  },

  _renderSavingsChart() {
    const canvas = document.getElementById('finSavingsChart');
    if (!canvas) return;

    const entries = AppState.financeEntries || [];
    const monthlyData = {};
    entries.forEach(e => {
      monthlyData[e.month] = (monthlyData[e.month] || 0) + (e.saved_aed || 0);
    });

    const months = Object.keys(monthlyData).sort();
    const data = months.map(m => monthlyData[m]);
    const target = new Array(months.length).fill(16650);

    const ctx = canvas.getContext('2d');
    if (window.finSavingsChartInstance) window.finSavingsChartInstance.destroy();

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const textColor = isDark ? '#697098' : '#5a6380';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

    window.finSavingsChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months.map(m => new Date(m + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })),
        datasets: [
          {
            label: 'Saved (AED)',
            data,
            backgroundColor: 'rgba(255,178,48,0.8)',
            borderColor: '#ffb230',
            borderWidth: 2,
            borderRadius: 6
          },
          {
            label: 'Monthly Target (16,650)',
            data: target,
            type: 'line',
            borderColor: '#00d4c8',
            borderDash: [5, 5],
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, labels: { color: textColor, font: { size: 12 } } }
        },
        scales: {
          y: { beginAtZero: true, ticks: { color: textColor, font: { size: 11 } }, grid: { color: gridColor } },
          x: { ticks: { color: textColor, font: { size: 11 } }, grid: { display: false } }
        }
      }
    });
  },

  renderSummary() {
    const entries = AppState.financeEntries || [];
    const totalSavedAED  = entries.reduce((s, e) => s + (e.saved_aed || 0), 0);
    const totalTransfINR = entries.reduce((s, e) => s + (e.transferred_inr || 0), 0);
    const estSavedINR    = Math.round((totalSavedAED / FINANCE_TARGET_AED) * FINANCE_TARGET_INR);
    const investmentWealth = this.calculateTrueWealth ? this.calculateTrueWealth() : 0;
    const totalCorpus    = FINANCE_BASELINE + estSavedINR + investmentWealth;
    const corpusPct      = Math.min(Math.round((totalCorpus / FINANCE_TOTAL_GOAL) * 100), 100);
    const targetPct      = Math.min(Math.round((totalSavedAED / FINANCE_TARGET_AED) * 100), 100);
    const dubai = PhaseManager.getDubaiSavingsDays();
    const daysPct = Math.round((dubai.elapsed / dubai.total) * 100);

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    const setW = (id, w) => { const el = document.getElementById(id); if (el) el.style.width = Math.min(w, 100) + '%'; };

    set('finTotalAED',    totalSavedAED.toLocaleString('en-IN') + ' AED');
    set('finTargetAED',   FINANCE_TARGET_AED.toLocaleString('en-IN') + ' AED');
    set('finTargetPct',   targetPct + '%');
    setW('finTargetBar',  targetPct);
    set('finEstINR',      '₹' + this._lakh(estSavedINR));
    set('finCorpus',      '₹' + this._lakh(totalCorpus));
    set('finInvWealth',   '₹' + this._lakh(investmentWealth));
    set('finGoalINR',     '₹' + this._lakh(FINANCE_TOTAL_GOAL));
    set('finCorpusPct',   corpusPct + '%');
    setW('finCorpusBar',  corpusPct);
    set('finBaseline',    '₹' + this._lakh(FINANCE_BASELINE));
    set('finTransferred', '₹' + this._lakh(totalTransfINR));
    set('finDubaiDays',   dubai.elapsed + ' / ' + dubai.total + ' days');
    setW('finDubaiBar',   daysPct);

    const nriEl = document.getElementById('finNRI');
    if (nriEl) {
      nriEl.textContent = AppState.nriAccountLive ? '✅ Live' : '⏳ Pending';
      nriEl.className   = 'status-badge ' + (AppState.nriAccountLive ? 'done' : 'pending');
    }
    const sipEl = document.getElementById('finSIP');
    if (sipEl) {
      sipEl.textContent = AppState.sipActive ? '✅ Active' : '⏳ Starts Aug 2026';
      sipEl.className   = 'status-badge ' + (AppState.sipActive ? 'done' : 'pending');
    }
  },

  renderEntryForm() {
    const form = document.getElementById('finEntryForm');
    if (!form || form.dataset.initialised) return;
    form.dataset.initialised = '1';

    form.addEventListener('submit', e => {
      e.preventDefault();
      const month = document.getElementById('finMonth')?.value;
      const aed   = parseFloat(document.getElementById('finAED')?.value) || 0;
      const inr   = parseFloat(document.getElementById('finINR')?.value) || 0;
      const notes = document.getElementById('finNotes')?.value || '';
      if (!month) { alert('Please select a month.'); return; }

      AppState.financeEntries = AppState.financeEntries.filter(e => e.month !== month);
      AppState.financeEntries.push({ id: Date.now(), month, saved_aed: aed, transferred_inr: inr, notes });
      AppState.financeEntries.sort((a, b) => a.month.localeCompare(b.month));
      AppState.save();
      form.reset();
      this.render();
    });

    document.getElementById('btnNRI')?.addEventListener('click', () => {
      AppState.nriAccountLive = !AppState.nriAccountLive;
      AppState.save();
      this.renderSummary();
    });
    document.getElementById('btnSIP')?.addEventListener('click', () => {
      AppState.sipActive = !AppState.sipActive;
      AppState.save();
      this.renderSummary();
    });
  },

  renderLog() {
    const tbody = document.getElementById('finLogBody');
    if (!tbody) return;
    const entries = [...(AppState.financeEntries || [])].reverse();
    if (!entries.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-td">No entries yet. Add your first month above.</td></tr>';
      return;
    }
    tbody.innerHTML = entries.map(e => `
      <tr>
        <td>${e.month}</td>
        <td class="num">${(e.saved_aed || 0).toLocaleString()} AED</td>
        <td class="num">₹${this._lakh(e.transferred_inr || 0)}</td>
        <td class="notes-td">${e.notes || '—'}</td>
        <td><button class="btn-xs btn-danger" data-del="${e.id}">✕</button></td>
      </tr>`).join('');

    tbody.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        AppState.financeEntries = AppState.financeEntries.filter(e => String(e.id) !== btn.dataset.del);
        AppState.save();
        this.render();
      });
    });
  },

  renderChecklist() {
    const container = document.getElementById('finChecklist');
    if (!container) return;
    const items = [
      { id: 'nri_open',      label: 'Open NRI account (SBI/ICICI) — 7–10 days',       deadline: 'Before leaving India' },
      { id: 'sip_start',     label: 'Start SIP ₹50K/month via INDmoney',               deadline: 'Aug 2026' },
      { id: 'first_xfer',    label: 'First home transfer ₹2.5L on 25th',               deadline: 'Jul 25, 2026' },
      { id: 'liq_india',     label: 'Keep ₹3–4L liquid in India',                      deadline: 'Before leaving' },
      { id: 'return_flight', label: 'Book non-refundable return flight India Jun 27',  deadline: 'Oct 2026' },
      { id: 'index_fund',    label: 'Deploy ₹20L in index funds after return',          deadline: 'Jul 2027' }
    ];

    container.innerHTML = items.map(item => {
      const done = AppState.dubaiChecklist?.[item.id];
      return `
        <div class="checklist-item${done ? ' done' : ''}">
          <label>
            <input type="checkbox" data-item="${item.id}" ${done ? 'checked' : ''}>
            <span class="ci-label">${item.label}</span>
          </label>
          <span class="ci-deadline">${item.deadline}</span>
        </div>`;
    }).join('');

    container.querySelectorAll('[data-item]').forEach(cb => {
      cb.addEventListener('change', e => {
        AppState.dubaiChecklist = AppState.dubaiChecklist || {};
        if (e.target.checked) AppState.dubaiChecklist[e.target.dataset.item] = true;
        else delete AppState.dubaiChecklist[e.target.dataset.item];
        AppState.save();
        e.target.closest('.checklist-item').classList.toggle('done', e.target.checked);
      });
    });
  },

  // ═══ Wealth Calculation Engine ════════════════════════════

  // Returns the effective rate for an investment (stored rate → auto-detected → default)
  getAutoRate(type, bankAccount, tenureYears) {
    const bank    = (bankAccount || '').toUpperCase().replace(/[^A-Z]/g, '');
    const tenure  = parseFloat(tenureYears) || (INV_RATE_CONFIG[type]?.tenure || 1);
    const cfg     = INV_RATE_CONFIG[type] || INV_RATE_CONFIG.Other;

    if (type === 'Deposits') {
      // Match bank name against known banks
      let bankRates = FD_BANK_RATES.DEFAULT;
      for (const key of Object.keys(FD_BANK_RATES)) {
        if (key !== 'DEFAULT' && bank.includes(key)) { bankRates = FD_BANK_RATES[key]; break; }
      }
      // Interpolate rate to nearest tenure bracket
      const brackets = [0.5, 1, 2, 3, 5];
      const nearest  = brackets.reduce((p, c) => Math.abs(c - tenure) < Math.abs(p - tenure) ? c : p);
      const rate     = bankRates[nearest] ?? bankRates.def;
      const bankName = Object.keys(FD_BANK_RATES).find(k => k !== 'DEFAULT' && bank.includes(k)) || 'Standard';
      return { rate, compound: 'quarterly', note: `${bankName} FD rate for ${tenure}yr tenure (Q1 2025). Quarterly compounding.` };
    }

    if (type === 'Insurance') {
      const insType = (bankAccount || '').includes('ULIP') ? 'ULIP' :
                      (bankAccount || '').includes('Endow') ? 'Endowment' : 'Term';
      if (INS_PROTECTION_TYPES.includes(insType)) return { rate: 0, compound: 'none', note: 'Pure protection — no investment return.' };
      return { rate: 5.5, compound: 'annual', note: 'Endowment/ULIP est. ULIP can be ~10-12% (market-linked). Override rate manually.' };
    }

    return { rate: cfg.rate, compound: cfg.compound, note: cfg.note };
  },

  // Completed financial years (April 1 → March 31) since a given date.
  // Counts every FY in which the account was open and interest was credited —
  // including the first partial year if started mid-FY.
  //   Jan–Mar start: first FY ends that same March 31
  //   Apr–Dec start: first FY ends the following March 31
  _completedFYs(startDate) {
    const start  = new Date(startDate);
    const now    = new Date();
    const startY = start.getFullYear();
    const startM = start.getMonth(); // 0-indexed; April = 3

    // First March 31 on or after the account was opened
    const fyEndYear = startM < 3 ? startY : startY + 1;

    let count = 0;
    let y = fyEndYear;
    while (true) {
      const fyEnd = new Date(y, 2, 31); // March 31
      if (fyEnd > now) break;
      count++;
      y++;
    }
    return count;
  },

  // Decimal years elapsed since startDate
  _yearsElapsed(startDate) {
    const start = new Date(startDate);
    const now   = new Date();
    return Math.max(0, (now - start) / (365.25 * 24 * 3600 * 1000));
  },

  // Convert tenure to years based on unit
  _tenureToYears(tenure, unit) {
    const t = parseFloat(tenure) || 0;
    if (unit === 'Days')   return t / 365;
    if (unit === 'Months') return t / 12;
    return t; // default: Years
  },

  // Months elapsed since startDate
  _monthsElapsed(startDate) {
    const start = new Date(startDate);
    const now   = new Date();
    return Math.max(0, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()));
  },

  // PPF: months in the first FY that a deposit earns interest.
  // Rule: deposit before the 5th of a month → that month counts; after 5th → next month.
  // We use the start date's day to determine whether the first month counts.
  // Apr=3 … Mar=2 in JS 0-indexed month numbering.
  _ppfFirstYearMonths(startDate) {
    const d = new Date(startDate);
    const m = d.getMonth(); // 0-indexed
    const day = d.getDate();
    // Months from deposit month to March (end of FY)
    // April(3)→March: 12 months if deposited, 11 if after 5th
    // October(9)→March: 6 months if deposited, 5 if after 5th
    let monthsInFY;
    if (m < 3) {
      // Jan(0), Feb(1), Mar(2) — near end of FY
      monthsInFY = 3 - m; // e.g. Jan → 3 months (Jan, Feb, Mar)
    } else {
      // Apr(3) to Dec(11)
      monthsInFY = 15 - m; // Apr→12, May→11, ..., Dec→3
    }
    // If deposited after 5th, that month's balance doesn't count → lose 1 month
    if (day > 5) monthsInFY = Math.max(monthsInFY - 1, 0);
    return monthsInFY;
  },

  // Core PPF accumulation loop used by both current-value and maturity calculators.
  // openBal  = prior corpus (already in account, earns full year every year)
  // P        = annual deposit added at the start of each tracked FY
  // r        = annual rate (decimal)
  // years    = number of completed FYs to simulate
  // firstYearMonths = months the FIRST deposit earns (12 if April, less if mid-year)
  _ppfAccumulate(openBal, P, r, years, firstYearMonths) {
    let total = openBal;
    for (let i = 0; i < years; i++) {
      const months = (i === 0) ? firstYearMonths : 12;
      // Prior corpus earns full year; deposit earns proportional months
      const priorInterest   = Math.round(total * r);
      const depositInterest = Math.round(P * r * months / 12);
      total = total + priorInterest + P + depositInterest;
    }
    return total;
  },

  // ── Per-type CURRENT VALUE (what it's worth today) ──────

  calculateCurrentValue(inv) {
    if (!inv) return 0;
    const P       = inv.amount || 0;
    const r       = parseFloat(inv.interestRate || this.getAutoRate(inv.type, inv.bankAccount, inv.tenure).rate) / 100;
    const type    = inv.type;
    const start   = inv.date;

    switch (type) {
      case 'PPF': {
        // Interest credited once on March 31. Deposit before 5th of a month → that
        // month earns; after 5th → interest starts next month.
        const fys           = start ? this._completedFYs(start) : 0;
        const openBal       = inv.openingBalance || 0;
        const firstYearMths = start ? this._ppfFirstYearMonths(start) : 12;
        if (fys === 0) {
          // No FY completed yet — show money physically in account (no interest credited)
          return openBal + P;
        }
        // Value as of last March 31 (interest credited; current-year deposit not added
        // since we don't know how much has been deposited so far this year)
        return this._ppfAccumulate(openBal, P, r, fys, firstYearMths);
      }
      case 'EPF': {
        // If monthly log exists, use it for accurate calculation
        if (inv.epfLog && inv.epfLog.length > 0) {
          return inv.epfLog.reduce((total, entry) => {
            if (entry.type === 'withdrawal') return total - (entry.employee || 0) - (entry.employer || 0);
            return total + (entry.employee || 0) + (entry.employer || 0);
          }, 0);
        }
        // Fallback: opening balance + monthly formula
        const openBal      = inv.openingBalance || 0;
        const employerMatch = P * (3.67 / 12);
        const totalMonthly  = P + employerMatch;
        if (!start) return Math.round(openBal || P);
        const m        = this._monthsElapsed(start);
        const monthlyR = r / 12;
        const newContribs  = m > 0 ? Math.round(totalMonthly * ((Math.pow(1 + monthlyR, m) - 1) / monthlyR) * (1 + monthlyR)) : 0;
        const priorGrowth  = Math.round(openBal * Math.pow(1 + monthlyR, m));
        return newContribs + priorGrowth;
      }
      case 'SIP': {
        // Lump sum one-time MF investment
        if (inv.sipMode === 'LumpSum') {
          if (inv.amfiCode && inv.units > 0 && inv.livePrice > 0) return Math.round(inv.units * inv.livePrice);
          if (!start) return P;
          const t = this._yearsElapsed(start);
          return Math.round(P * Math.pow(1 + r, t));
        }
        // Regular SIP (monthly)
        if (inv.amfiCode && inv.units > 0 && inv.livePrice > 0) return Math.round(inv.units * inv.livePrice);
        if (!start) return P;
        const m = this._monthsElapsed(start);
        if (m === 0) return P;
        const mr = r / 12;
        return Math.round(P * ((Math.pow(1 + mr, m) - 1) / mr) * (1 + mr));
      }
      case 'Deposits': {
        if (inv.depositType === 'RD') {
          // Recurring Deposit: monthly instalments, monthly compounding
          if (!start) return P;
          const tenureYrs    = this._tenureToYears(inv.tenure || 1, inv.tenureUnit || 'Years');
          const tenureMonths = Math.round(tenureYrs * 12) || 12;
          // Cap at tenure — once the RD matures the instalment stream stops
          const m  = Math.min(Math.max(this._monthsElapsed(start), 1), tenureMonths);
          if (r === 0) return P * m;
          const mr = r / 12;
          return Math.round(P * ((Math.pow(1 + mr, m) - 1) / mr) * (1 + mr));
        }
        // FD: lump-sum quarterly compounding
        if (!start || r === 0) return P;
        const t = this._yearsElapsed(start);
        return Math.round(P * Math.pow(1 + r / 4, 4 * t));
      }
      case 'Bonds': {
        if (!start) return P;
        const t = this._yearsElapsed(start);
        return Math.round(P * Math.pow(1 + r, t));
      }
      case 'Gold': {
        // SGB: 2.5% semi-annual interest + gold price appreciation; use combined rate
        if (!start) return P;
        const t = this._yearsElapsed(start);
        return Math.round(P * Math.pow(1 + r / 100 + r / 100, t / 2) * Math.pow(1 + r / 100, Math.floor(t))); // simplified annual
      }
      case 'Shares': {
        // If ticker + units + live price known, use real market value
        if (inv.ticker && inv.units > 0 && inv.livePrice > 0) {
          return Math.round(inv.units * inv.livePrice);
        }
        if (!start || r === 0) return P;
        const t = this._yearsElapsed(start);
        return Math.round(P * Math.pow(1 + r, t));
      }
      case 'RealEstate':
      case 'Crypto':
      case 'Other': {
        if (!start || r === 0) return P;
        const t = this._yearsElapsed(start);
        return Math.round(P * Math.pow(1 + r, t));
      }
      case 'Insurance': {
        const insType = inv.insuranceType || 'Term';
        if (INS_PROTECTION_TYPES.includes(insType)) return 0;
        if (!start || r === 0) return P;
        const t = this._yearsElapsed(start);
        return Math.round(P * Math.pow(1 + r, t));
      }
      default:
        return P;
    }
  },

  // ── Per-type MATURITY VALUE (projected at end of tenure) ──

  calculateMaturityAmount(inv) {
    if (!inv) return 0;
    const P       = inv.amount || 0;
    const rAuto   = this.getAutoRate(inv.type, inv.bankAccount, inv.tenure || INV_RATE_CONFIG[inv.type]?.tenure);
    const r       = parseFloat(inv.interestRate || rAuto.rate) / 100;
    const n       = parseFloat(inv.tenure || INV_RATE_CONFIG[inv.type]?.tenure || 5);
    const type    = inv.type;

    switch (type) {
      case 'PPF': {
        // Same iterative model as currentValue; all future deposits assumed April 1 (12 months)
        const openBal       = inv.openingBalance || 0;
        const firstYearMths = inv.date ? this._ppfFirstYearMonths(inv.date) : 12;
        return this._ppfAccumulate(openBal, P, r, Math.round(n), firstYearMths);
      }
      case 'EPF': {
        const openBal      = inv.openingBalance || 0;
        // Use actual balance if log exists
        const currentBalance = (inv.epfLog && inv.epfLog.length > 0)
          ? inv.epfLog.reduce((total, entry) => {
              if (entry.type === 'withdrawal') return total - (entry.employee || 0) - (entry.employer || 0);
              return total + (entry.employee || 0) + (entry.employer || 0);
            }, 0)
          : openBal;
        const monthlyEmp   = P;
        const employerMatch = P * (3.67 / 12);
        const totalMonthly  = monthlyEmp + employerMatch;
        const mr = r / 12;
        const m  = n * 12;
        const newContribs = Math.round(totalMonthly * ((Math.pow(1 + mr, m) - 1) / mr) * (1 + mr));
        const priorGrowth = Math.round(currentBalance * Math.pow(1 + mr, m));
        return newContribs + priorGrowth;
      }
      case 'SIP': {
        const mr = r / 12;
        const m  = n * 12;
        if (inv.sipMode === 'LumpSum') return Math.round(P * Math.pow(1 + r, n));
        return Math.round(P * ((Math.pow(1 + mr, m) - 1) / mr) * (1 + mr));
      }
      case 'Deposits': {
        const tenureYrs = this._tenureToYears(n, inv.tenureUnit || 'Years');
        if (inv.depositType === 'RD') {
          // RD maturity: monthly instalments over full tenure
          const m  = Math.round(tenureYrs * 12) || 1;
          if (r === 0) return P * m;
          const mr = r / 12;
          return Math.round(P * ((Math.pow(1 + mr, m) - 1) / mr) * (1 + mr));
        }
        // FD: lump-sum quarterly compounding
        return Math.round(P * Math.pow(1 + r / 4, 4 * tenureYrs));
      }
      case 'Gold': {
        // SGBs: 8-year tenure standard; combined annual return
        return Math.round(P * Math.pow(1 + r, n));
      }
      default: {
        // Lump-sum annual compounding
        return Math.round(P * Math.pow(1 + r, n));
      }
    }
  },

  // Helper: total amount invested so far (for SIP/EPF/PPF with ongoing contributions)
  getTotalInvestedAmount(inv) {
    const P     = inv.amount || 0;
    const start = inv.date;
    if (!start) return P;
    switch (inv.type) {
      case 'PPF': {
        // openingBalance (prior corpus) + annual contributions for all FYs tracked + current year
        const fys    = this._completedFYs(start);
        const openBal = inv.openingBalance || 0;
        return openBal + (fys + 1) * P; // +1 for current ongoing year's deposit
      }
      case 'Deposits': {
        if (inv.depositType === 'RD') {
          const tenureYrs    = this._tenureToYears(inv.tenure || 1, inv.tenureUnit || 'Years');
          const tenureMonths = Math.round(tenureYrs * 12) || 12;
          const m = Math.min(this._monthsElapsed(start), tenureMonths);
          return P * Math.max(m, 1);
        }
        return P; // FD: one lump-sum deposit
      }
      case 'SIP': {
        if (inv.sipMode === 'LumpSum') return P; // one-time investment
        const m = this._monthsElapsed(start);
        return P * Math.max(m, 1);
      }
      case 'EPF': {
        const m = this._monthsElapsed(start);
        return P * Math.max(m, 1);
      }
      default:
        return P;
    }
  },

  calculateInvestmentWealth(inv) {
    if (!inv) return 0;
    const status = inv.status || 'active';
    if (status === 'closed')    return 0;
    if (status === 'reinvested') return 0;
    if (status === 'withdrawn') return inv.withdrawnAmount || 0;
    if (inv.type === 'Insurance') {
      const insType = inv.insuranceType || 'Term';
      if (INS_PROTECTION_TYPES.includes(insType)) return 0;
    }
    return this.calculateCurrentValue(inv);
  },

  // Kept for backward-compat (FD already used this; now superseded by calculateCurrentValue)
  _calcDepositValue(inv) {
    return this.calculateCurrentValue(inv);
  },

  calculateTrueWealth() {
    return (AppState.investments || []).reduce((sum, inv) => sum + this.calculateInvestmentWealth(inv), 0);
  },

  getTotalCoverAmount() {
    return (AppState.investments || [])
      .filter(inv => inv.type === 'Insurance' && inv.coverAmount > 0 && (inv.status || 'active') === 'active')
      .reduce((sum, inv) => sum + (inv.coverAmount || 0), 0);
  },

  getWealthBreakdown() {
    const bd = { liquid: 0, growth: 0, secured: 0, retirement: 0, real: 0, speculative: 0 };
    (AppState.investments || []).forEach(inv => {
      const v = this.calculateInvestmentWealth(inv);
      switch (inv.type) {
        case 'Deposits':    bd.liquid += v; break;
        case 'SIP':         bd.growth += v; break;
        case 'Shares':      bd.growth += v; break;
        case 'Crypto':      bd.speculative += v; break;
        case 'Bonds':       bd.secured += v; break;
        case 'PPF':         bd.secured += v; break;
        case 'EPF':         bd.retirement += v; break;
        case 'Gold':        bd.real += v; break;
        case 'RealEstate':  bd.real += v; break;
        case 'Insurance': {
          const ins = inv.insuranceType || 'Term';
          if (!INS_PROTECTION_TYPES.includes(ins)) bd.secured += v;
          break;
        }
        default:            bd.speculative += v; break;
      }
    });
    return bd;
  },

  getInvestmentBreakdown() {
    const bd = {};
    (AppState.investments || [])
      .filter(inv => !['withdrawn','closed','reinvested'].includes(inv.status || 'active') || (inv.status === 'withdrawn' && inv.withdrawnAmount > 0))
      .forEach(inv => {
        const v = this.calculateInvestmentWealth(inv);
        if (v <= 0) return;
        const key = inv.type === 'Insurance' && inv.insuranceType ? `Insurance (${inv.insuranceType})` : inv.type;
        bd[key] = (bd[key] || 0) + v;
      });
    return bd;
  },

  getTotalInvested() {
    return (AppState.investments || []).reduce((s, inv) => s + (inv.amount || 0), 0);
  },

  getUpcomingMaturities() {
    const now = new Date();
    return (AppState.investments || [])
      .filter(inv => inv.maturityDate && !['withdrawn','closed','reinvested'].includes(inv.status || ''))
      .map(inv => {
        const matDate  = new Date(inv.maturityDate);
        const daysUntil = Math.ceil((matDate - now) / (24 * 3600 * 1000));
        return { ...inv, daysUntil };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);
  },

  // ═══ Investment Rendering ══════════════════════════════════

  renderInvestments() {
    this.renderNetWorthCard();
    this.renderSummary();
    this.renderInvestmentSummary();
    this.renderPortfolioSummary();
    this.renderInvestmentChart();
    this.renderWealthByNature();
    this.renderMaturityAlerts();
    this.renderInvestmentSections();
    this.renderAITips();
    this.renderFinancialTip();
    this.renderHelpSection();
  },

  renderNetWorthCard() {
    const el   = document.getElementById('netWorthValue');
    if (!el) return;
    const wealth    = this.calculateTrueWealth();
    const cover     = this.getTotalCoverAmount();
    const breakdown = this.getWealthBreakdown();

    el.textContent = '₹' + this._lakh(wealth);
    const coverEl = document.getElementById('totalCoverValue');
    if (coverEl) coverEl.textContent = '₹' + this._lakh(cover);

    const bd = document.getElementById('netWorthBreakdown');
    if (!bd) return;
    const items = [
      { label: '🏦 Liquid',       value: breakdown.liquid },
      { label: '📈 Growth',       value: breakdown.growth },
      { label: '🛡️ Secured',     value: breakdown.secured },
      { label: '🏛️ Retirement', value: breakdown.retirement },
      { label: '🏠 Real Assets',  value: breakdown.real },
      { label: '⚡ Speculative',  value: breakdown.speculative },
    ].filter(i => i.value > 0);

    bd.innerHTML = items.length
      ? items.map(i => `<div class="nw-item"><div class="nw-item-label">${i.label}</div><div class="nw-item-value">₹${this._lakh(i.value)}</div></div>`).join('')
      : '<div style="color:var(--text-muted);font-size:11px;grid-column:1/-1;text-align:center;padding:6px 0;">Add investments to see breakdown</div>';
  },

  renderInvestmentSummary() {
    const wealth = this.calculateTrueWealth();
    const count  = (AppState.investments || []).filter(i => !['closed'].includes(i.status || '')).length;
    const el     = document.getElementById('totalInvested');
    const cnt    = document.getElementById('investmentCount');
    if (el)  el.textContent  = '₹' + this._lakh(wealth);
    if (cnt) cnt.textContent = count + ' investment' + (count !== 1 ? 's' : '') + ' tracked';
  },

  renderPortfolioSummary() {
    const container = document.getElementById('portfolioSummaryContainer');
    if (!container) return;

    const investments = AppState.investments || [];
    if (!investments.length) {
      container.innerHTML = '<div style="color:var(--text-muted);font-size:12px;text-align:center;padding:20px 0;">Add investments to see your portfolio breakdown.</div>';
      return;
    }

    const totalWealth   = Math.max(this.calculateTrueWealth(), 1);
    const totalInvested = Math.max(this.getTotalInvested(), 1);
    const totalCover    = this.getTotalCoverAmount();
    const bd            = this.getWealthBreakdown();

    // Build per-type aggregation
    const typeMap = {};
    investments.forEach(inv => {
      const key  = inv.type === 'Insurance' && inv.insuranceType ? `${inv.type} · ${inv.insuranceType}` : inv.type;
      if (!typeMap[key]) typeMap[key] = { type: inv.type, subtype: inv.insuranceType || '', invested: 0, value: 0, cover: 0, count: 0, active: 0, withdrawn: 0 };
      const t = typeMap[key];
      t.count++;
      t.invested   += inv.amount || 0;
      t.value      += this.calculateInvestmentWealth(inv);
      t.cover      += inv.coverAmount || 0;
      const s = inv.status || 'active';
      if (s === 'active' || s === 'matured') t.active++;
      else if (s === 'withdrawn') t.withdrawn++;
    });

    // Sort by value desc
    const rows = Object.entries(typeMap).sort((a, b) => b[1].value - a[1].value);

    // Key metrics
    const equityPct    = totalWealth > 0 ? Math.round(((bd.growth) / totalWealth) * 100) : 0;
    const debtPct      = totalWealth > 0 ? Math.round(((bd.liquid + bd.secured) / totalWealth) * 100) : 0;
    const retirePct    = totalWealth > 0 ? Math.round((bd.retirement / totalWealth) * 100) : 0;
    const diversScore  = Math.min(Object.keys(typeMap).length * 14, 100);

    const metricColor = (v, good, warn) => v >= good ? 'var(--accent-green)' : v >= warn ? 'var(--accent-amber)' : 'var(--accent-rose)';

    container.innerHTML = `
      <!-- Key Metrics Strip -->
      <div class="portfolio-metrics-strip">
        <div class="pm-metric">
          <div class="pm-label">Equity</div>
          <div class="pm-value" style="color:${metricColor(equityPct,40,20)};">${equityPct}%</div>
          <div class="pm-sub">of wealth</div>
        </div>
        <div class="pm-metric">
          <div class="pm-label">Debt / Safe</div>
          <div class="pm-value" style="color:${metricColor(debtPct,20,10)};">${debtPct}%</div>
          <div class="pm-sub">of wealth</div>
        </div>
        <div class="pm-metric">
          <div class="pm-label">Retirement</div>
          <div class="pm-value" style="color:var(--accent-violet);">${retirePct}%</div>
          <div class="pm-sub">EPF / NPS</div>
        </div>
        <div class="pm-metric">
          <div class="pm-label">Cover</div>
          <div class="pm-value" style="color:var(--accent-violet);">₹${this._lakh(totalCover)}</div>
          <div class="pm-sub">life + health</div>
        </div>
        <div class="pm-metric">
          <div class="pm-label">Diversification</div>
          <div class="pm-value" style="color:${metricColor(diversScore,70,42)};">${diversScore}%</div>
          <div class="pm-sub">${Object.keys(typeMap).length} asset type${Object.keys(typeMap).length !== 1 ? 's' : ''}</div>
        </div>
        <div class="pm-metric">
          <div class="pm-label">Gain / Loss</div>
          ${(() => {
            const gain = this.calculateTrueWealth() - this.getTotalInvested();
            const pct  = this.getTotalInvested() > 0 ? ((gain / this.getTotalInvested()) * 100).toFixed(1) : 0;
            const col  = gain >= 0 ? 'var(--accent-green)' : 'var(--accent-rose)';
            return `<div class="pm-value" style="color:${col};">${gain >= 0 ? '+' : ''}₹${this._lakh(Math.abs(gain))}</div><div class="pm-sub" style="color:${col};">${gain >= 0 ? '+' : ''}${pct}%</div>`;
          })()}
        </div>
      </div>

      <!-- Type Breakdown Table -->
      <div class="data-table-wrap" style="margin-top:14px;">
        <table class="data-table portfolio-summary-table">
          <thead>
            <tr>
              <th>Asset Type</th>
              <th style="text-align:center;">Count</th>
              <th>Rate</th>
              <th>Invested</th>
              <th>Value Today</th>
              <th>At Maturity</th>
              <th>Total Gain</th>
              <th>% Now</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(([key, t]) => {
              const isPure  = t.type === 'Insurance' && INS_PROTECTION_TYPES.includes(t.subtype || 'Term');

              // Aggregate maturity values across all investments of this type
              const typeInvs = investments.filter(inv => {
                const k = inv.type === 'Insurance' && inv.insuranceType ? `${inv.type} · ${inv.insuranceType}` : inv.type;
                return k === key && !['withdrawn','closed','reinvested'].includes(inv.status || '');
              });
              const typeMat  = typeInvs.reduce((s, inv) => s + (isPure ? 0 : this.calculateMaturityAmount(inv)), 0);
              const typeRate = typeInvs.length > 0
                ? (typeInvs.reduce((s, inv) => s + (inv.interestRate || this.getAutoRate(inv.type, inv.bankAccount, inv.tenure).rate), 0) / typeInvs.length).toFixed(1)
                : '—';

              const curGain   = t.value - t.invested;
              const matGain   = typeMat - t.invested;
              const matGainPct = t.invested > 0 ? ((matGain / t.invested) * 100).toFixed(0) : 0;
              const curGainCol = curGain >= 0 ? 'var(--accent-green)' : 'var(--accent-rose)';
              const matGainCol = matGain >= 0 ? 'var(--accent-green)' : 'var(--accent-rose)';
              const wPct      = totalWealth > 0 ? ((t.value / totalWealth) * 100).toFixed(1) : 0;

              const catMap = { Deposits:'🏦 Liquid', SIP:'📈 Growth', Shares:'📈 Growth', Crypto:'⚡ Spec.',
                               PPF:'🛡️ Secured', Bonds:'🛡️ Secured', EPF:'🏛️ Retire.', Gold:'🏠 Real',
                               RealEstate:'🏠 Real', Insurance:'🛡️ Secured', Other:'⚡ Spec.' };
              const cat = isPure ? '🛡️ Cover' : (catMap[t.type] || '⚡ Spec.');

              return `
                <tr>
                  <td>
                    <span style="font-weight:600;">${t.type}</span>
                    ${t.subtype ? `<span style="font-size:10px;color:var(--text-muted);display:block;">${t.subtype}</span>` : ''}
                  </td>
                  <td style="text-align:center;">
                    <span style="font-size:13px;">${t.count}</span>
                    ${t.withdrawn > 0 ? `<span style="font-size:9px;color:var(--text-faint);display:block;">${t.withdrawn} closed</span>` : ''}
                  </td>
                  <td style="font-size:11px;color:var(--accent-teal);font-weight:600;">${typeRate !== '—' ? typeRate + '%' : '—'}</td>
                  <td class="num">₹${this._lakh(t.invested)}</td>
                  <td class="num">
                    ${isPure ? '<span style="color:var(--text-faint);">—</span>'
                      : `<div>₹${this._lakh(t.value)}</div><div style="font-size:10px;color:${curGainCol};">${curGain >= 0 ? '+' : ''}₹${this._lakh(Math.abs(curGain))}</div>`}
                  </td>
                  <td class="num">
                    ${isPure && t.cover > 0
                      ? `<span class="cover-badge">₹${this._lakh(t.cover)}</span>`
                      : typeMat > 0
                        ? `<div style="color:var(--accent-teal);font-weight:700;">₹${this._lakh(typeMat)}</div><div style="font-size:10px;color:var(--accent-green);">+${matGainPct}%</div>`
                        : '<span style="color:var(--text-faint);">—</span>'}
                  </td>
                  <td>
                    ${!isPure && t.invested > 0
                      ? `<span style="font-size:12px;font-weight:600;color:${matGainCol};">${matGain >= 0 ? '+' : ''}₹${this._lakh(Math.abs(matGain))}</span>`
                      : '<span style="color:var(--text-faint);">—</span>'}
                  </td>
                  <td>
                    ${isPure ? '<span style="color:var(--text-faint);">—</span>' : `
                      <div style="display:flex;align-items:center;gap:5px;">
                        <div style="flex:1;background:var(--border);border-radius:3px;height:4px;min-width:32px;">
                          <div style="width:${Math.min(parseFloat(wPct),100)}%;background:var(--accent-blue);height:100%;border-radius:3px;"></div>
                        </div>
                        <span style="font-size:11px;font-weight:600;color:var(--text);min-width:26px;">${wPct}%</span>
                      </div>`}
                  </td>
                  <td><span style="font-size:11px;color:var(--text-muted);">${cat}</span></td>
                </tr>`;
            }).join('')}
          </tbody>
          <tfoot>
            <tr style="border-top:2px solid var(--border-bright);">
              <td style="font-weight:700;color:var(--text);">TOTAL</td>
              <td style="text-align:center;font-weight:700;">${investments.length}</td>
              <td></td>
              <td class="num" style="font-weight:700;">₹${this._lakh(this.getTotalInvested())}</td>
              <td class="num" style="font-weight:700;color:var(--accent-blue);">₹${this._lakh(this.calculateTrueWealth())}</td>
              <td class="num" style="font-weight:700;color:var(--accent-teal);">
                ${(() => {
                  const totalMat = investments.reduce((s, inv) => {
                    const isPure = inv.type === 'Insurance' && INS_PROTECTION_TYPES.includes(inv.insuranceType || 'Term');
                    return s + (isPure ? 0 : this.calculateMaturityAmount(inv));
                  }, 0);
                  return `₹${this._lakh(totalMat)}`;
                })()}
              </td>
              <td>
                ${(() => {
                  const totalMat = investments.reduce((s, inv) => {
                    const isPure = inv.type === 'Insurance' && INS_PROTECTION_TYPES.includes(inv.insuranceType || 'Term');
                    return s + (isPure ? 0 : this.calculateMaturityAmount(inv));
                  }, 0);
                  const base = this.getTotalInvested();
                  const g    = totalMat - base;
                  const p    = base > 0 ? ((g / base) * 100).toFixed(1) : 0;
                  const c    = g >= 0 ? 'var(--accent-green)' : 'var(--accent-rose)';
                  return `<span style="font-size:12px;font-weight:700;color:${c};">${g >= 0 ? '+' : ''}₹${this._lakh(Math.abs(g))} (${g >= 0 ? '+' : ''}${p}%)</span>`;
                })()}
              </td>
              <td></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>`;
  },

  renderInvestmentChart() {
    const canvas = document.getElementById('investmentChart');
    if (!canvas) return;

    const breakdown = this.getInvestmentBreakdown();
    const labels    = Object.keys(breakdown);
    const data      = Object.values(breakdown);

    if (!labels.length) { canvas.style.display = 'none'; return; }
    canvas.style.display = 'block';

    const colors = ['#5b7fff','#00d4c8','#ff9933','#00d47c','#a56eff','#ff5c80','#ffc107','#00b8a8','#8b5cf6','#ec4899'];
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const ctx = canvas.getContext('2d');
    if (window.investmentChartInstance) window.investmentChartInstance.destroy();

    window.investmentChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: isDark ? '#141a32' : '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: isDark ? '#e8ecf8' : '#0a0e24', font: { size: 11 }, padding: 10 } },
          tooltip: {
            callbacks: {
              label: ctx => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                return `₹${ctx.parsed.toLocaleString('en-IN')} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  },

  renderWealthByNature() {
    const grid = document.getElementById('wealthGrid');
    if (!grid) return;
    const bd = this.getWealthBreakdown();
    const cats = [
      { key: 'liquid',      label: 'Liquid',       icon: '🏦', sub: 'Deposits & savings' },
      { key: 'growth',      label: 'Growth',        icon: '📈', sub: 'SIP, Shares, Equity' },
      { key: 'secured',     label: 'Secured',       icon: '🛡️', sub: 'PPF, Bonds, Insurance' },
      { key: 'retirement',  label: 'Retirement',    icon: '🏛️', sub: 'EPF & pension' },
      { key: 'real',        label: 'Real Assets',   icon: '🏠', sub: 'Gold, Real Estate' },
      { key: 'speculative', label: 'Speculative',   icon: '⚡', sub: 'Crypto, Other' },
    ];
    grid.innerHTML = cats.map(cat => `
      <div class="wealth-card">
        <div class="wealth-icon">${cat.icon}</div>
        <div class="wealth-label">${cat.label}</div>
        <div class="wealth-amount">₹${this._lakh(bd[cat.key] || 0)}</div>
        <div class="wealth-sub">${cat.sub}</div>
      </div>`).join('');
  },

  renderMaturityAlerts() {
    const maturities = this.getUpcomingMaturities();

    const renderTo = (containerId, limit) => {
      const el = document.getElementById(containerId);
      if (!el) return;
      const relevant = maturities.filter(m => m.daysUntil <= 180);
      if (!relevant.length) {
        el.innerHTML = '<div style="color:var(--text-muted);font-size:11px;text-align:center;padding:10px 0;">No maturities within 6 months.</div>';
        return;
      }
      el.innerHTML = relevant.slice(0, limit || relevant.length).map(inv => {
        const isOverdue = inv.daysUntil < 0;
        const urgency = isOverdue ? 'urgent' : (inv.daysUntil <= 30 ? 'urgent' : inv.daysUntil <= 60 ? 'soon' : 'future');
        const color   = isOverdue ? 'var(--accent-rose)' : (urgency === 'soon' ? 'var(--accent-amber)' : 'var(--accent-blue)');
        const dayLabel = isOverdue ? `${Math.abs(inv.daysUntil)}d ago` : `${inv.daysUntil}d`;
        const val     = this.calculateInvestmentWealth(inv);
        return `
          <div class="maturity-alert ${urgency}">
            <div style="flex:1;min-width:0;">
              <div style="font-size:12px;font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${inv.type}${inv.bankAccount ? ' · ' + inv.bankAccount : ''}</div>
              <div style="font-size:10px;color:var(--text-muted);">₹${this._lakh(val)} · ${inv.maturityDate}</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex-shrink:0;">
              <span style="font-family:'Space Mono',monospace;font-size:12px;font-weight:700;color:${color};">${isOverdue ? '⚠ DUE' : dayLabel}</span>
              ${isOverdue ? `<button class="btn btn-xs" onclick="FinanceTracker.openMaturityModal(${inv.id})" style="font-size:9px;padding:2px 6px;">Handle</button>` : ''}
            </div>
          </div>`;
      }).join('');
    };

    renderTo('maturityAlertsMain', 10);
    renderTo('maturityAlertsSidebar', 4);

    // Update badge count on section header
    const badge = document.getElementById('maturityBadge');
    if (badge) {
      const overdue  = maturities.filter(m => m.daysUntil < 0).length;
      const upcoming = maturities.filter(m => m.daysUntil >= 0 && m.daysUntil <= 180).length;
      const total = overdue + upcoming;
      if (total > 0) {
        badge.textContent = overdue > 0 ? `${overdue} overdue · ${upcoming} upcoming` : `${upcoming} upcoming`;
        badge.style.display = 'inline';
        badge.style.background = overdue > 0 ? 'var(--accent-rose)' : 'var(--accent-amber)';
      } else {
        badge.style.display = 'none';
      }
    }
  },

  renderInvestmentSections() {
  const el = document.getElementById('investmentSections');
  if (!el) return;
  const all = AppState.investments || [];
  const L = v => this._lakh(v);

  const gainHtml = (val, invested) => {
    const g = val - invested;
    const pct = invested > 0 ? ((g / invested) * 100).toFixed(1) : 0;
    const c = g >= 0 ? 'var(--accent-green)' : 'var(--accent-rose)';
    return `<div style="font-size:10px;color:${c};">${g >= 0 ? '+' : ''}₹${L(Math.abs(g))} (${g >= 0 ? '+' : ''}${pct}%)</div>`;
  };

  const statusBadge = inv => {
    const s = inv.status || 'active';
    const mat = inv.maturityDate && new Date(inv.maturityDate) < new Date() && s === 'active';
    const d = mat ? 'matured' : s;
    return `<span class="inv-status ${d}">${d}</span>`;
  };

  const matDateHtml = inv => {
    if (!inv.maturityDate) return '<span style="color:var(--text-muted);">—</span>';
    const over = new Date(inv.maturityDate) < new Date();
    return `<span style="font-size:10px;${over ? 'color:var(--accent-amber);font-weight:600;' : 'color:var(--text-muted);'}">${inv.maturityDate}${over ? ' ⚠' : ''}</span>`;
  };

  const actionBtns = inv => {
    const s = inv.status || 'active';
    const mat = inv.maturityDate && new Date(inv.maturityDate) < new Date() && s === 'active';
    return `<div style="display:flex;gap:3px;flex-wrap:nowrap;">
      <button class="btn btn-xs" onclick="FinanceTracker.openEditInvModal(${inv.id})" title="Edit">✏️</button>
      ${s === 'active' ? `<button class="btn btn-xs" onclick="FinanceTracker.openWithdrawalModal(${inv.id})" title="Withdraw" style="font-size:10px;">↩</button>` : ''}
      ${mat ? `<button class="btn btn-xs" onclick="FinanceTracker.openMaturityModal(${inv.id})" style="font-size:10px;border-color:var(--accent-gold);color:var(--accent-gold);">⏰</button>` : ''}
      <button class="btn btn-xs btn-danger" onclick="FinanceTracker.deleteInvestment(${inv.id})">✕</button>
    </div>`;
  };

  const tbl = (invs, cols) => {
    const hasTot = cols.some(c => c.tot);
    return `
      <div class="data-table-wrap inv-sec-tbl">
        <table class="data-table" style="font-size:12px;">
          <thead><tr>
            ${cols.map(c => `<th style="font-size:10px;padding:7px 10px;white-space:nowrap;">${c.h}</th>`).join('')}
            <th style="font-size:10px;padding:7px 10px;">Actions</th>
          </tr></thead>
          <tbody>
            ${invs.length ? invs.map(inv => {
              const s = inv.status || 'active';
              const mat = inv.maturityDate && new Date(inv.maturityDate) < new Date() && s === 'active';
              const style = s === 'withdrawn' || s === 'reinvested' ? 'opacity:.5;' : mat ? 'background:rgba(255,193,7,0.03);' : '';
              return `<tr style="${style}">${cols.map(c => `<td style="padding:8px 10px;${c.s || ''}">${c.v(inv)}</td>`).join('')}<td style="padding:8px 10px;">${actionBtns(inv)}</td></tr>`;
            }).join('') : `<tr><td colspan="${cols.length + 1}" class="empty-td" style="font-size:11px;">No entries yet — add using the form above.</td></tr>`}
          </tbody>
          ${hasTot && invs.length ? `<tfoot><tr style="background:var(--surface);border-top:2px solid var(--border);">
            ${cols.map(c => `<td style="padding:7px 10px;font-size:11px;font-weight:700;${c.s || ''}">${c.tot ? c.tot(invs) : ''}</td>`).join('')}
            <td></td>
          </tr></tfoot>` : ''}
        </table>
      </div>`;
  };

  const sec = (id, icon, title, invs, tableHtml) => {
    const total    = invs.reduce((s, i) => s + this.calculateInvestmentWealth(i), 0);
    const invested = invs.reduce((s, i) => s + this.getTotalInvestedAmount(i), 0);
    const gVal = total - invested;
    const gPct = invested > 0 ? ((gVal / invested) * 100).toFixed(1) : 0;
    const gCol = gVal >= 0 ? 'var(--accent-green)' : 'var(--accent-rose)';
    const active = invs.filter(i => (i.status || 'active') === 'active').length;
    const closed = invs.length - active;
    return `
      <div class="inv-section" id="invSec_${id}">
        <div class="inv-section-hdr" onclick="document.getElementById('invSec_${id}').classList.toggle('collapsed')">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:18px;line-height:1;">${icon}</span>
            <div>
              <div style="font-weight:700;font-size:13px;">${title}</div>
              <div style="font-size:10px;color:var(--text-muted);">${active} active${closed ? ' · ' + closed + ' closed' : ''}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:20px;">
            <div style="text-align:right;">
              <div style="font-size:10px;color:var(--text-muted);">Invested</div>
              <div style="font-size:12px;font-weight:600;">₹${L(invested)}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:10px;color:var(--text-muted);">Value Today</div>
              <div style="font-size:15px;font-weight:700;color:var(--accent-teal);">₹${L(total)}</div>
              ${invs.length ? `<div style="font-size:10px;color:${gCol};">${gVal >= 0 ? '+' : ''}₹${L(Math.abs(gVal))} (${gVal >= 0 ? '+' : ''}${gPct}%)</div>` : ''}
            </div>
            <span class="inv-sec-chev">▼</span>
          </div>
        </div>
        <div class="inv-section-body">${tableHtml}</div>
      </div>`;
  };

  const ppfInvs = all.filter(i => i.type === 'PPF');
  const ppfTbl = tbl(ppfInvs, [
    { h: 'Bank', v: i => `<span style="font-weight:600;">${i.bankAccount || '—'}</span>` },
    { h: 'Start Date', v: i => `<span style="color:var(--text-muted);font-size:11px;">${i.date || '—'}</span>` },
    { h: 'Annual Contribution', v: i => `<span style="font-weight:700;">₹${L(i.amount)}</span>`, s: 'text-align:right;', tot: is => `₹${L(is.reduce((s, i) => s + (i.amount || 0), 0))}` },
    { h: 'Prior Corpus', v: i => i.openingBalance ? `₹${L(i.openingBalance)}` : '<span style="color:var(--text-muted);">—</span>', s: 'text-align:right;' },
    { h: 'FYs Credited', v: i => i.date ? `<span style="font-weight:700;color:var(--accent-teal);">${this._completedFYs(i.date)}</span>` : '—', s: 'text-align:center;' },
    { h: 'Value Today', v: i => { const v = this.calculateInvestmentWealth(i), inv = this.getTotalInvestedAmount(i); return `<div style="font-weight:700;color:var(--accent-teal);">₹${L(v)}</div>${gainHtml(v, inv)}`; }, s: 'text-align:right;', tot: is => `₹${L(is.reduce((s, i) => s + this.calculateInvestmentWealth(i), 0))}` },
    { h: '15yr Maturity', v: i => `<span style="color:var(--accent-blue);font-weight:600;">₹${L(this.calculateMaturityAmount(i))}</span>`, s: 'text-align:right;' },
    { h: 'Status', v: statusBadge },
  ]);

  const epfInvs = all.filter(i => i.type === 'EPF');
  const epfTbl = epfInvs.length === 0
    ? `<p style="font-size:11px;color:var(--text-muted);padding:10px;">No EPF accounts yet — add using the form above.</p>`
    : epfInvs.map(inv => {
        const log = inv.epfLog || [];
        const totalEmp = log.reduce((s, e) => e.type !== 'withdrawal' ? s + (e.employee || 0) : s - (e.employee || 0), 0);
        const totalEr  = log.reduce((s, e) => e.type !== 'withdrawal' ? s + (e.employer || 0) : s - (e.employer || 0), 0);
        const totalVal = totalEmp + totalEr;
        const logRows = [...log].reverse().slice(0, 24).map(e => {
          const typeBadge = {
            contribution: `<span style="color:var(--accent-teal);font-size:9px;font-weight:700;">CONTRIB</span>`,
            interest:     `<span style="color:var(--accent-green);font-size:9px;font-weight:700;">INTEREST</span>`,
            transfer:     `<span style="color:var(--accent-blue);font-size:9px;font-weight:700;">TRANSFER</span>`,
            withdrawal:   `<span style="color:var(--accent-rose);font-size:9px;font-weight:700;">WITHDRAWAL</span>`,
          }[e.type] || '';
          return `<tr>
            <td style="padding:5px 8px;font-family:'Space Mono',monospace;font-size:11px;">${e.month}</td>
            <td style="padding:5px 8px;text-align:right;font-size:11px;">${typeBadge}</td>
            <td style="padding:5px 8px;text-align:right;font-size:11px;">₹${L(e.employee || 0)}</td>
            <td style="padding:5px 8px;text-align:right;font-size:11px;">₹${L(e.employer || 0)}</td>
            <td style="padding:5px 8px;text-align:right;font-size:11px;font-weight:600;">₹${L((e.employee || 0) + (e.employer || 0))}</td>
            <td style="padding:5px 8px;font-size:10px;color:var(--text-muted);">${e.note || ''}</td>
            <td style="padding:5px 8px;">
              <button class="btn btn-xs btn-danger" onclick="FinanceTracker.deleteEPFLogEntry(${inv.id}, '${e.month}', '${e.type}')" style="font-size:9px;">✕</button>
            </td>
          </tr>`;
        }).join('');
        return `
          <div style="border-top:1px solid var(--border);padding:12px 16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
              <div>
                <div style="font-weight:700;font-size:13px;">${inv.bankAccount || 'EPF Account'}</div>
                <div style="font-size:10px;color:var(--text-muted);">${inv.notes || ''} · Rate: ${inv.interestRate || 8.25}% · Status: <span style="color:${(inv.status||'active')==='active'?'var(--accent-green)':'var(--accent-amber)'};">${inv.status||'active'}</span></div>
              </div>
              <div style="display:flex;gap:10px;align-items:center;">
                <div style="text-align:right;">
                  <div style="font-size:10px;color:var(--text-muted);">Employee Total</div>
                  <div style="font-size:13px;font-weight:700;">₹${L(totalEmp)}</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:10px;color:var(--text-muted);">Employer Total</div>
                  <div style="font-size:13px;font-weight:700;">₹${L(totalEr)}</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:10px;color:var(--text-muted);">Total Corpus</div>
                  <div style="font-size:15px;font-weight:700;color:var(--accent-teal);">₹${L(totalVal)}</div>
                </div>
                <button class="btn btn-xs" onclick="FinanceTracker.openEditInvModal(${inv.id})" style="font-size:10px;">✏️ Edit</button>
                <button class="btn btn-xs btn-danger" onclick="FinanceTracker.deleteInvestment(${inv.id})" style="font-size:10px;">✕</button>
              </div>
            </div>
            <!-- Add month form -->
            <div style="background:var(--surface);border-radius:8px;padding:10px;margin-bottom:10px;display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end;" id="epfAddForm_${inv.id}">
              <div><label style="font-size:10px;color:var(--text-muted);display:block;margin-bottom:2px;">Month (YYYY-MM)</label>
                <input type="month" id="epfMonth_${inv.id}" style="font-size:11px;padding:4px 8px;background:var(--card);border:1px solid var(--border);border-radius:4px;color:var(--text);width:130px;"></div>
              <div><label style="font-size:10px;color:var(--text-muted);display:block;margin-bottom:2px;">Employee ₹</label>
                <input type="number" id="epfEmp_${inv.id}" placeholder="${inv.amount || 0}" style="font-size:11px;padding:4px 8px;background:var(--card);border:1px solid var(--border);border-radius:4px;color:var(--text);width:100px;"></div>
              <div><label style="font-size:10px;color:var(--text-muted);display:block;margin-bottom:2px;">Employer ₹</label>
                <input type="number" id="epfEr_${inv.id}" placeholder="${inv.amount || 0}" style="font-size:11px;padding:4px 8px;background:var(--card);border:1px solid var(--border);border-radius:4px;color:var(--text);width:100px;"></div>
              <div><label style="font-size:10px;color:var(--text-muted);display:block;margin-bottom:2px;">Type</label>
                <select id="epfType_${inv.id}" style="font-size:11px;padding:4px 8px;background:var(--card);border:1px solid var(--border);border-radius:4px;color:var(--text);">
                  <option value="contribution">Contribution</option>
                  <option value="interest">Interest Credit</option>
                  <option value="transfer">Transfer In</option>
                  <option value="withdrawal">Withdrawal</option>
                </select></div>
              <div><label style="font-size:10px;color:var(--text-muted);display:block;margin-bottom:2px;">Note (optional)</label>
                <input type="text" id="epfNote_${inv.id}" placeholder="e.g. Salary increment" style="font-size:11px;padding:4px 8px;background:var(--card);border:1px solid var(--border);border-radius:4px;color:var(--text);width:160px;"></div>
              <button class="btn btn-xs btn-primary" onclick="FinanceTracker.addEPFLogEntry(${inv.id})" style="font-size:11px;padding:5px 12px;">+ Add Entry</button>
            </div>
            <!-- Monthly log table -->
            ${log.length ? `
            <div class="data-table-wrap" style="max-height:300px;">
              <table class="data-table" style="font-size:12px;">
                <thead><tr>
                  <th style="font-size:10px;padding:6px 8px;">Month</th>
                  <th style="font-size:10px;padding:6px 8px;text-align:right;">Type</th>
                  <th style="font-size:10px;padding:6px 8px;text-align:right;">Employee</th>
                  <th style="font-size:10px;padding:6px 8px;text-align:right;">Employer</th>
                  <th style="font-size:10px;padding:6px 8px;text-align:right;">Total</th>
                  <th style="font-size:10px;padding:6px 8px;">Note</th>
                  <th style="font-size:10px;padding:6px 8px;"></th>
                </tr></thead>
                <tbody>${logRows}</tbody>
                <tfoot><tr style="background:var(--surface);border-top:2px solid var(--border);">
                  <td colspan="2" style="padding:6px 8px;font-size:11px;font-weight:700;">TOTAL</td>
                  <td style="padding:6px 8px;text-align:right;font-size:11px;font-weight:700;">₹${L(totalEmp)}</td>
                  <td style="padding:6px 8px;text-align:right;font-size:11px;font-weight:700;">₹${L(totalEr)}</td>
                  <td style="padding:6px 8px;text-align:right;font-size:11px;font-weight:700;color:var(--accent-teal);">₹${L(totalVal)}</td>
                  <td colspan="2"></td>
                </tr></tfoot>
              </table>
            </div>` : `<p style="font-size:11px;color:var(--text-muted);padding:4px 0;">No entries yet. Use the form above to add monthly contributions.</p>`}
          </div>`;
      }).join('');

  const fdInvs = all.filter(i => i.type === 'Deposits').sort((a, b) => (a.maturityDate || '').localeCompare(b.maturityDate || ''));
  const fdTbl = tbl(fdInvs, [
    { h: 'Bank', v: i => `<div style="font-weight:600;">${i.bankAccount || '—'}</div>${i.notes ? `<div style="font-size:9px;color:var(--text-muted);">${i.notes}</div>` : ''}` },
    { h: 'Type', v: i => { const isRD = i.depositType === 'RD'; return `<span style="font-size:11px;font-weight:700;color:${isRD ? 'var(--accent-violet)' : 'var(--accent-teal)'};">${isRD ? 'RD' : 'FD'}</span>`; } },
    { h: 'Amount', v: i => { const isRD = i.depositType === 'RD'; return `<div style="font-weight:700;">₹${L(i.amount)}${isRD ? '<span style="font-size:9px;color:var(--text-muted);">/mo</span>' : ''}</div>`; }, s: 'text-align:right;', tot: is => `₹${L(is.reduce((s, i) => s + this.getTotalInvestedAmount(i), 0))} inv` },
    { h: 'Rate', v: i => `${i.interestRate || '—'}%` },
    { h: 'Tenure', v: i => i.tenure ? `${i.tenure} ${i.tenureUnit || 'yr'}` : '—' },
    { h: 'Start', v: i => `<span style="color:var(--text-muted);font-size:10px;">${i.date || '—'}</span>` },
    { h: 'Maturity Date', v: matDateHtml },
    { h: 'Value Today', v: i => `<span style="font-weight:700;">₹${L(this.calculateInvestmentWealth(i))}</span>`, s: 'text-align:right;', tot: is => `₹${L(is.reduce((s, i) => s + this.calculateInvestmentWealth(i), 0))}` },
    { h: 'At Maturity', v: i => (i.status || 'active') === 'active' ? `<span style="color:var(--accent-blue);">₹${L(this.calculateMaturityAmount(i))}</span>` : '—', s: 'text-align:right;', tot: is => `₹${L(is.filter(i => (i.status || 'active') === 'active').reduce((s, i) => s + this.calculateMaturityAmount(i), 0))}` },
    { h: 'Status', v: statusBadge },
  ]);

  const shareInvs = all.filter(i => i.type === 'Shares').sort((a, b) => (a.ticker || a.bankAccount || '').localeCompare(b.ticker || b.bankAccount || ''));
  const shareTbl = tbl(shareInvs, [
    { h: 'Ticker', v: i => `<span style="font-weight:700;font-size:12px;font-family:'Space Mono',monospace;">${i.ticker || i.bankAccount || '—'}</span>` },
    { h: 'Qty', v: i => i.units ? `<span style="font-weight:600;">${i.units}</span>` : '—', s: 'text-align:right;' },
    { h: 'Invested', v: i => `₹${L(i.amount)}`, s: 'text-align:right;', tot: is => `₹${L(is.reduce((s, i) => s + (i.amount || 0), 0))}` },
    { h: 'Avg Buy', v: i => (i.units && i.amount) ? `₹${(i.amount / i.units).toFixed(2)}` : '—', s: 'text-align:right;font-size:11px;' },
    { h: 'Live Price', v: i => i.livePrice > 0 ? `<span style="color:var(--accent-teal);font-weight:600;">₹${i.livePrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>` : '<span style="color:var(--text-muted);font-size:10px;">—</span>', s: 'text-align:right;' },
    { h: 'Value Today', v: i => `<span style="font-weight:700;">₹${L(this.calculateInvestmentWealth(i))}</span>`, s: 'text-align:right;', tot: is => `₹${L(is.reduce((s, i) => s + this.calculateInvestmentWealth(i), 0))}` },
    { h: 'P&L', v: i => { const v = this.calculateInvestmentWealth(i), g = v - (i.amount || 0), pct = i.amount ? ((g / i.amount) * 100).toFixed(1) : 0, c = g >= 0 ? 'var(--accent-green)' : 'var(--accent-rose)'; return `<div style="color:${c};font-weight:600;">${g >= 0 ? '+' : ''}₹${L(Math.abs(g))}</div><div style="font-size:9px;color:${c};">${g >= 0 ? '+' : ''}${pct}%</div>`; }, s: 'text-align:right;', tot: is => { const tg = is.reduce((s, i) => s + this.calculateInvestmentWealth(i) - (i.amount || 0), 0), ti = is.reduce((s, i) => s + (i.amount || 0), 0), pct = ti ? ((tg / ti) * 100).toFixed(1) : 0, c = tg >= 0 ? 'var(--accent-green)' : 'var(--accent-rose)'; return `<span style="color:${c};">${tg >= 0 ? '+' : ''}₹${L(Math.abs(tg))} (${tg >= 0 ? '+' : ''}${pct}%)</span>`; } },
    { h: 'Broker', v: i => `<span style="font-size:10px;color:var(--text-muted);">${i.bankAccount || '—'}</span>` },
  ]);

  const sipInvs = all.filter(i => i.type === 'SIP');
  const sipTbl = tbl(sipInvs, [
    { h: 'Fund / Platform', v: i => `<div style="font-weight:600;">${i.bankAccount || '—'}</div>${i.notes ? `<div style="font-size:9px;color:var(--text-muted);">${i.notes}</div>` : ''}` },
    { h: 'Amount', v: i => `<div style="font-weight:700;">₹${L(i.amount)}${i.sipMode !== 'LumpSum' ? '<span style="font-size:9px;color:var(--text-muted);">/mo</span>' : ''}</div>`, s: 'text-align:right;' },
    { h: 'AMFI Code', v: i => i.amfiCode ? `<span style="font-family:'Space Mono',monospace;font-size:10px;">${i.amfiCode}</span>` : '<span style="color:var(--text-muted);">—</span>' },
    { h: 'Units', v: i => i.units ? `<span style="font-family:'Space Mono',monospace;font-size:11px;">${i.units.toFixed(3)}</span>` : '—', s: 'text-align:right;' },
    { h: 'Live NAV', v: i => i.livePrice ? `<span style="color:var(--accent-teal);">₹${i.livePrice.toFixed(4)}</span>` : '—', s: 'text-align:right;font-size:11px;' },
    { h: 'Value Today', v: i => `<span style="font-weight:700;color:var(--accent-teal);">₹${L(this.calculateInvestmentWealth(i))}</span>`, s: 'text-align:right;', tot: is => `₹${L(is.reduce((s, i) => s + this.calculateInvestmentWealth(i), 0))}` },
    { h: 'Total Invested', v: i => `₹${L(this.getTotalInvestedAmount(i))}`, s: 'text-align:right;', tot: is => `₹${L(is.reduce((s, i) => s + this.getTotalInvestedAmount(i), 0))}` },
    { h: 'Status', v: statusBadge },
  ]);

  const insInvs = all.filter(i => i.type === 'Insurance');
  const _annualPremium = i => {
    const f = (i.premiumFrequency || '').toLowerCase();
    if (f === 'monthly')     return (i.amount || 0) * 12;
    if (f === 'quarterly')   return (i.amount || 0) * 4;
    if (f === 'half-yearly' || f === 'half yearly') return (i.amount || 0) * 2;
    return i.amount || 0; // annual or unset — stored amount IS the annual premium
  };
  const _premLabel = i => {
    const f = (i.premiumFrequency || '').toLowerCase();
    if (f === 'monthly')     return '/mo';
    if (f === 'quarterly')   return '/qtr';
    if (f === 'half-yearly' || f === 'half yearly') return '/6mo';
    return '/yr';
  };
  const insTbl = tbl(insInvs, [
    { h: 'Company', v: i => `<div style="font-weight:600;">${i.bankAccount || '—'}</div>${i.notes ? `<div style="font-size:9px;color:var(--text-muted);">${i.notes}</div>` : ''}` },
    { h: 'Sub-type', v: i => { const p = INS_PROTECTION_TYPES.includes(i.insuranceType || 'Term'); return `<span style="font-size:11px;font-weight:600;color:${p ? 'var(--accent-rose)' : 'var(--accent-blue)'};">${i.insuranceType || '—'}</span>`; } },
    { h: 'Premium', v: i => {
        const lbl = _premLabel(i);
        const ann = _annualPremium(i);
        const showAnn = lbl !== '/yr';
        return `<div>₹${L(i.amount)}<span style="font-size:9px;color:var(--text-muted);">${lbl}</span></div>` +
               (showAnn ? `<div style="font-size:9px;color:var(--text-muted);">₹${L(ann)}/yr</div>` : '');
      }, s: 'text-align:right;', tot: is => `₹${L(is.reduce((s, i) => s + _annualPremium(i), 0))}/yr` },
    { h: 'Frequency', v: i => `<span style="font-size:10px;">${i.premiumFrequency || '—'}</span>` },
    { h: 'Cover / Sum Assured', v: i => i.coverAmount ? `<span style="color:var(--accent-violet);font-weight:700;">₹${L(i.coverAmount)}</span>` : '—', s: 'text-align:right;', tot: is => `₹${L(is.reduce((s, i) => s + (i.coverAmount || 0), 0))} cover` },
    { h: 'Start', v: i => `<span style="font-size:10px;color:var(--text-muted);">${i.date || '—'}</span>` },
    { h: 'Maturity / Expiry', v: matDateHtml },
    { h: 'Status', v: statusBadge },
  ]);

  const otherInvs = all.filter(i => ['Gold', 'Bonds', 'RealEstate', 'Crypto', 'Other'].includes(i.type)).sort((a, b) => a.type.localeCompare(b.type));
  const otherTbl = tbl(otherInvs, [
    { h: 'Type', v: i => `<span style="font-weight:700;">${i.type}</span>` },
    { h: 'Name / Description', v: i => `<span>${i.bankAccount || i.notes || '—'}</span>` },
    { h: 'Amount Invested', v: i => `₹${L(i.amount)}`, s: 'text-align:right;', tot: is => `₹${L(is.reduce((s, i) => s + (i.amount || 0), 0))}` },
    { h: 'Rate', v: i => `${i.interestRate || '—'}%` },
    { h: 'Start', v: i => `<span style="font-size:10px;color:var(--text-muted);">${i.date || '—'}</span>` },
    { h: 'Maturity', v: matDateHtml },
    { h: 'Value Today', v: i => `<span style="font-weight:700;">₹${L(this.calculateInvestmentWealth(i))}</span>`, s: 'text-align:right;', tot: is => `₹${L(is.reduce((s, i) => s + this.calculateInvestmentWealth(i), 0))}` },
    { h: 'Status', v: statusBadge },
  ]);

  el.innerHTML = `
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:12px;align-items:center;">
      <span style="font-size:10px;color:var(--text-muted);">Stock / MF prices:</span>
      <button id="refreshPricesBtn" class="btn btn-xs" onclick="FinanceTracker.refreshLivePrices()" style="font-size:11px;padding:4px 10px;" title="Try auto-fetching from Yahoo Finance via CORS proxy">🔄 Auto-Fetch</button>
      <button class="btn btn-xs" onclick="FinanceTracker.openManualPriceModal()" style="font-size:11px;padding:4px 10px;background:rgba(91,127,255,0.12);border-color:var(--accent-blue);color:var(--accent-blue);" title="Enter prices manually from Zerodha / Groww">✏️ Enter Manually</button>
    </div>
    ${sec('PPF',    '🏛️', 'PPF — Public Provident Fund',         ppfInvs,   ppfTbl)}
    ${sec('EPF',    '🏛️', 'EPF — Employee Provident Fund',       epfInvs,   epfTbl)}
    ${sec('FD',     '🏦', 'Fixed & Recurring Deposits',          fdInvs,    fdTbl)}
    ${sec('Shares', '📊', 'Stocks — Direct Equity',              shareInvs, shareTbl)}
    ${sec('SIP',    '📈', 'Mutual Funds & SIPs',                 sipInvs,   sipTbl)}
    ${sec('Ins',    '🛡️', 'Insurance Policies',                  insInvs,   insTbl)}
    ${sec('Other',  '🥇', 'Gold · Bonds · Real Estate · Crypto', otherInvs, otherTbl)}
  `;
},

  renderFinancialTip() {
    const tipEl = document.getElementById('finTipText');
    if (!tipEl) return;
    const total = this.calculateTrueWealth();
    if (!total) {
      tipEl.textContent = 'Start adding investments to get personalized AI tips.';
      return;
    }
    const tips = this._generateDetailedAITips();
    if (tips.length) tipEl.textContent = tips[0].icon + ' ' + tips[0].title + ': ' + tips[0].desc;
  },

  renderAITips() {
    const container = document.getElementById('aiTipsContainer');
    if (!container) return;
    const tips = this._generateDetailedAITips();
    if (!tips.length) {
      container.innerHTML = `
        <div class="ai-tip-item">
          <span class="ai-tip-icon">💡</span>
          <div class="ai-tip-content">
            <div class="ai-tip-title">Getting Started</div>
            <div class="ai-tip-desc">Add your investments (FD, SIP, Insurance, EPF, etc.) to receive AI-driven personalized financial tips based on your portfolio composition and goals.</div>
          </div>
        </div>`;
      return;
    }
    container.innerHTML = tips.map(tip => `
      <div class="ai-tip-item">
        <span class="ai-tip-icon">${tip.icon}</span>
        <div class="ai-tip-content">
          <div class="ai-tip-title">${tip.title}</div>
          <div class="ai-tip-desc">${tip.desc}</div>
        </div>
        <span class="ai-tip-priority ${tip.priority}">${tip.priority}</span>
      </div>`).join('');
  },

  _generateDetailedAITips() {
    const investments = AppState.investments || [];
    const bd    = this.getWealthBreakdown();
    const total = this.calculateTrueWealth();
    const tips  = [];
    if (total === 0) return [];

    const pct = v => total > 0 ? ((v / total) * 100).toFixed(0) : '0';

    // Emergency fund
    if (parseInt(pct(bd.liquid)) < 10) {
      tips.push({ icon: '🚨', priority: 'high', title: 'Build Emergency Fund First', desc: `Liquid wealth (₹${this._lakh(bd.liquid)}) is under 10%. Aim for 3–6 months of expenses in FD or savings before investing more in equity.` });
    } else if (parseInt(pct(bd.liquid)) > 45) {
      tips.push({ icon: '📈', priority: 'medium', title: 'Excess Cash — Put It to Work', desc: `${pct(bd.liquid)}% in liquid assets earns low returns. Deploy surplus into SIPs or index funds to beat inflation over the long term.` });
    }

    // Equity check
    const growthPct = parseInt(pct(bd.growth));
    if (growthPct < 25) {
      tips.push({ icon: '📊', priority: 'medium', title: 'Increase Equity Exposure', desc: `Only ${pct(bd.growth)}% in growth assets (SIP/Shares). For a 5+ year horizon, target 50–60% equity. Start or increase your SIP today — even ₹2,000/month makes a difference.` });
    } else if (growthPct > 75) {
      tips.push({ icon: '⚖️', priority: 'medium', title: 'Portfolio Is Equity-Heavy', desc: `${pct(bd.growth)}% equity is aggressive. Rebalance 15–20% into PPF, FDs, or Bonds to reduce volatility and preserve gains during market downturns.` });
    } else {
      tips.push({ icon: '✅', priority: 'low', title: 'Healthy Equity-Debt Balance', desc: `${pct(bd.growth)}% in growth assets — well balanced. Continue SIP consistently for rupee cost averaging and stay invested through market cycles.` });
    }

    // Insurance check
    const hasInsurance = investments.some(i => i.type === 'Insurance');
    const hasTerm      = investments.some(i => i.type === 'Insurance' && i.insuranceType === 'Term' && (i.status || 'active') === 'active');
    const cover        = this.getTotalCoverAmount();
    if (!hasInsurance) {
      tips.push({ icon: '🛡️', priority: 'high', title: 'No Insurance Detected', desc: `You have no insurance in your portfolio. A term plan covering 10–15× annual income is the foundation of financial security. Get protected before investing more.` });
    } else if (!hasTerm) {
      tips.push({ icon: '🛡️', priority: 'medium', title: 'Get a Term Insurance Plan', desc: `No pure term plan found. Term insurance gives the highest life cover at the lowest cost. Add one to your portfolio — especially if you have dependents or loans.` });
    } else if (cover < 5000000) {
      tips.push({ icon: '📋', priority: 'medium', title: 'Review Your Insurance Cover', desc: `Total cover ₹${this._lakh(cover)} may be insufficient. Financial planners recommend 10–15× annual income. Review and top up your term/health cover.` });
    }

    // PPF
    if (!investments.some(i => i.type === 'PPF' && (i.status || 'active') === 'active')) {
      tips.push({ icon: '🏦', priority: 'medium', title: 'Open a PPF Account', desc: `PPF offers 7.1% guaranteed returns with full EEE tax status. Invest up to ₹1.5L/year for 80C deduction + tax-free interest + tax-free maturity.` });
    }

    // SIP
    if (!investments.some(i => i.type === 'SIP' && (i.status || 'active') === 'active')) {
      tips.push({ icon: '🔄', priority: 'high', title: 'Start a SIP Today', desc: `No active SIP found. ₹5,000/month in a Nifty 50 index fund grows to ₹40L+ in 20 years (12% CAGR). Start small and increase by 10% each year (step-up SIP).` });
    }

    // Tax 80C
    const taxSaving = investments.filter(i => ['PPF','EPF'].includes(i.type) || (i.type === 'Insurance' && !INS_PROTECTION_TYPES.includes(i.insuranceType || ''))).reduce((s, i) => s + (i.amount || 0), 0);
    if (taxSaving < 150000) {
      tips.push({ icon: '💰', priority: 'medium', title: 'Maximize Section 80C Benefits', desc: `Invest ₹1.5L/year in ELSS, PPF, EPF, or life insurance to claim full 80C deduction — saving up to ₹46,800 annually (at 30% tax bracket).` });
    }

    // Speculative
    if (parseInt(pct(bd.speculative)) > 15) {
      tips.push({ icon: '⚠️', priority: 'high', title: 'High Speculative Exposure', desc: `${pct(bd.speculative)}% in crypto/speculative assets is risky. Cap this at 10% max. Gradually rebalance excess into index funds or FDs.` });
    }

    // Gold
    if (parseInt(pct(bd.real)) < 5 && total > 500000) {
      tips.push({ icon: '🥇', priority: 'low', title: 'Add Gold as Inflation Hedge', desc: `5–10% in Sovereign Gold Bonds (SGBs) gives 2.5% annual interest + gold price appreciation + capital gains exempt at maturity. A low-cost hedge.` });
    }

    // EPF
    if (investments.some(i => i.type === 'EPF' && (i.status || 'active') === 'active')) {
      tips.push({ icon: '✅', priority: 'low', title: 'EPF Is Active — Maximize It', desc: `EPF at 8.15% interest with EEE tax status is India's best guaranteed return. Maximize VPF (Voluntary PF) contributions to boost your retirement corpus.` });
    }

    // Expense savings rate
    const expenses = AppState.monthlyExpenses || [];
    if (expenses.length >= 2) {
      const totalInc = expenses.reduce((s, e) => s + (e.income || 0), 0);
      const totalExp = expenses.reduce((s, e) => s + Object.values(e.categories || {}).reduce((a, b) => a + b, 0), 0);
      const savingsRate = totalInc > 0 ? ((totalInc - totalExp) / totalInc) * 100 : 0;
      if (savingsRate < 20) {
        tips.push({ icon: '📉', priority: 'high', title: 'Savings Rate Too Low', desc: `Your average savings rate is ${savingsRate.toFixed(0)}% — below the recommended 20–30%. Identify top expense categories and cut 10–15% to accelerate wealth building.` });
      } else if (savingsRate >= 30) {
        tips.push({ icon: '🏆', priority: 'low', title: 'Excellent Savings Rate!', desc: `${savingsRate.toFixed(0)}% savings rate is outstanding. Deploy that surplus strategically: SIP first, then PPF, then NPS — in that order.` });
      }
    }

    return tips.slice(0, 7);
  },

  renderHelpSection() {
    const container = document.getElementById('finHelpContainer');
    if (!container || container.dataset.rendered) return;
    container.dataset.rendered = '1';

    const sections = [
      {
        icon: '📝',
        title: 'How to Enter Data — Field-by-Field Guide for Every Type',
        content: (() => {
          const row = (field, what, example) => `
            <tr>
              <td style="font-weight:600;white-space:nowrap;color:var(--accent-teal);vertical-align:top;padding:6px 10px 6px 0;font-size:11px;">${field}</td>
              <td style="font-size:11px;vertical-align:top;padding:6px 10px 6px 0;color:var(--text);">${what}</td>
              <td style="font-size:11px;vertical-align:top;padding:6px 0;color:var(--text-muted);font-style:italic;">${example}</td>
            </tr>`;
          const card = (emoji, title, color, rows, note) => `
            <div style="border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:12px;">
              <div style="font-weight:700;font-size:13px;margin-bottom:10px;color:${color};">${emoji} ${title}</div>
              <table style="width:100%;border-collapse:collapse;">
                <thead><tr>
                  <th style="font-size:10px;text-align:left;padding:0 10px 6px 0;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;width:22%;">Field</th>
                  <th style="font-size:10px;text-align:left;padding:0 10px 6px 0;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;width:48%;">What to enter</th>
                  <th style="font-size:10px;text-align:left;padding:0 0 6px 0;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;">Example</th>
                </tr></thead>
                <tbody style="border-top:1px solid var(--border);">${rows}</tbody>
              </table>
              ${note ? `<div style="margin-top:10px;font-size:11px;background:rgba(91,127,255,0.07);border-left:3px solid var(--accent-blue);padding:7px 10px;border-radius:0 6px 6px 0;">${note}</div>` : ''}
            </div>`;

          return `
            <p style="font-size:12px;color:var(--text-muted);margin-bottom:14px;">Each investment type uses specific fields. Fields not listed here (e.g. Tenure, Rate) are either auto-filled or not applicable for that type — leave them as-is unless you need to override.</p>

            ${card('🏛️', 'PPF — Public Provident Fund', 'var(--accent-teal)',
              row('Amount (₹)', 'Your <strong>annual contribution</strong> — how much you deposit each April (max ₹1,50,000)', '₹1,50,000') +
              row('Bank / Institution', 'Bank or post office holding the account', 'SBI · Post Office') +
              row('Start Date', 'April 1 of the year you want to track from. Use the most recent April 1 for simplicity.', '2025-04-01') +
              row('Prior Corpus', 'Your PPF balance from the <strong>statement dated just before your Start Date</strong>. Leave 0 for a brand-new account.', '₹4,99,818') +
              row('Rate', 'Auto-set to 7.1%. Do not change unless the government revises it.', '7.1') +
              row('Maturity Date', 'Auto-calculated as 15 years from Start Date. Override if your actual maturity differs.', 'Auto'),
              '💡 <strong>Annual update routine:</strong> Each April, use ✏️ Edit → set <em>Prior Corpus</em> to the year-end balance from your bank statement, and move <em>Start Date</em> to the new April 1. The dashboard then projects forward accurately.')}

            ${card('🏛️', 'EPF — Employee Provident Fund', 'var(--accent-teal)',
              row('Amount (₹)', 'Your monthly <strong>employee contribution</strong> (12% of your basic salary). Do NOT enter the total PF deduction from your payslip — only the employee share.', '₹3,600') +
              row('Bank / Institution', 'Your company name or "EPFO"', 'Infosys · EPFO') +
              row('Start Date', 'Date you joined your current employer / when EPF deductions began', '2020-06-01') +
              row('Rate', 'Auto-set to 8.25%. EPFO revises this annually — update when announced.', '8.25') +
              row('Tenure', 'Years until your estimated retirement', '30') +
              row('Maturity Date', 'Your estimated retirement date', '2050-06-01'),
              '💡 <strong>Employer match:</strong> The dashboard automatically adds the 3.67% employer EPF contribution on top of your entry. The remaining 8.33% employer share goes to EPS (pension) and is not tracked here. For EPF balance updates, use ✏️ Edit and enter current balance as <em>Amount</em> (lump sum mode) with Start Date = today.')}

            ${card('🏦', 'Fixed Deposit (FD / RD)', '#e8a838',
              row('Amount (₹)', 'The <strong>principal amount</strong> you deposited at booking', '₹1,00,000') +
              row('Bank / Institution', 'Bank name — rate is <strong>auto-detected</strong> for SBI, HDFC, ICICI, Axis, Kotak, IDFC and 10+ more', 'HDFC · ICICI') +
              row('Start Date', 'Date you booked / opened the FD', '2024-03-15') +
              row('Tenure (Years)', 'FD duration. Use decimals for months: 0.5 = 6 months, 1.5 = 18 months', '2 · 1.5 · 0.5') +
              row('Rate (% p.a.)', 'Auto-detected from bank + tenure. Override if your actual rate differs.', '7.25') +
              row('Maturity Date', 'Auto-calculated from start + tenure. Verify against your FD receipt.', 'Auto'),
              '💡 The dashboard alerts you 6 months before maturity. At maturity use <strong>Handle</strong> to withdraw or reinvest — the old entry closes and a new one is created automatically.')}

            ${card('📈', 'SIP — Mutual Fund', '#5b7fff',
              row('Amount (₹)', 'Your <strong>monthly SIP installment amount</strong>. For lump-sum MF purchases, enter the lump sum here and set Tenure to match your horizon.', '₹5,000 / mo') +
              row('Bank / Institution', 'Fund house or platform name', 'Zerodha Coin · Groww') +
              row('Start Date', 'Date of your first SIP installment', '2022-01-05') +
              row('Tenure (Years)', 'Your planned investment horizon (not the fund\'s exit load period)', '15') +
              row('Rate (% p.a.)', 'Expected CAGR. Default 12% (Nifty 50 historical). Use 10% for debt funds, 14–15% for mid/small cap.', '12') +
              row('AMFI Code', '<strong>For live NAV:</strong> find the scheme code on <em>mfapi.in</em>. Search your fund name and note the 6-digit code.', '119597') +
              row('Units Held', '<strong>For live NAV:</strong> total units allotted — shown in your Zerodha/Groww/CAMS statement or account', '312.456'),
              '💡 <strong>Live NAV:</strong> Once AMFI Code + Units are entered, click <strong>🔄 Refresh Prices</strong> in the Investment Log header. Value Today becomes Units × Current NAV in real time. Use ✏️ Edit to update units after each installment purchase.')}

            ${card('📊', 'Shares — Direct Stocks (NSE / BSE)', '#00d47c',
              row('Amount (₹)', 'Total amount <strong>you paid</strong> to buy the shares (cost basis, including brokerage). This is your invested amount.', '₹50,000') +
              row('Broker', 'Your brokerage platform', 'Zerodha · Groww · ICICI Direct') +
              row('Start Date', 'Date of purchase (first purchase if averaging)', '2023-08-10') +
              row('Stock Exchange', 'NSE or BSE listing for the stock. Choose the exchange where your stock is traded.', 'NSE / BSE') +
              row('Ticker Symbol', 'The exchange-specific trading symbol. Use the exact symbol from your broker or exchange website.', 'RELIANCE · INFY · TCS') +
              row('Number of Shares', 'Total shares you currently hold (net quantity after all buy/sell trades)', '50') +
              row('Notes', 'Optional: stock name, folio info, or buy price for reference', 'Reliance Industries @ ₹2,450'),
              '💡 <strong>Live price:</strong> Once Exchange + Ticker + Shares are entered, click <strong>🔄 Refresh Prices</strong>. Value Today = Shares × live market price from Financial Modeling Prep or Yahoo Finance. For better reliability, consider adding an Alpha Vantage API key to the code.')}

            ${card('🥇', 'Gold — Physical, SGB, ETF', '#e8a838',
              row('Amount (₹)', 'Total amount invested (purchase price). For SGBs: face value × units bought.', '₹1,00,000') +
              row('Bank / Institution', 'Type of gold holding', 'SGB RBI · Gold ETF · Physical') +
              row('Start Date', 'Purchase / allotment date', '2023-01-15') +
              row('Tenure (Years)', 'SGBs: 8 years (auto-set). Physical/ETF: your hold horizon.', '8') +
              row('Rate (% p.a.)', 'Default 10.5% (gold ~8% CAGR + 2.5% SGB coupon). For physical gold, use 8%. For ETF, use 8–9%.', '10.5') +
              row('Maturity Date', 'SGBs: 8 years from allotment. Physical / ETF: leave blank.', 'Auto for SGB'),
              '💡 SGB interest (2.5% p.a.) is paid semi-annually to your bank account — this is separate from the price appreciation tracked here. Capital gains on SGB at maturity are tax-exempt if held to 8-year maturity.')}

            ${card('🏠', 'Real Estate', '#e8a838',
              row('Amount (₹)', 'Your <strong>total acquisition cost</strong>: registration + stamp duty + purchase price. For under-construction: total amount paid so far.', '₹45,00,000') +
              row('Bank / Institution', 'Location or property identifier', 'Bangalore flat · Plot Mysore') +
              row('Start Date', 'Date of registration / possession', '2021-11-01') +
              row('Tenure (Years)', 'How long you plan to hold', '10') +
              row('Rate (% p.a.)', 'Estimated annual appreciation. Default 9%. Override: metro prime 12%, tier-2 city 7%, commercial 8%.', '9') +
              row('Notes', 'Property address, builder name, loan details', '3BHK Whitefield, Prestige'),
              '💡 Home loan EMI is an expense, not this field. Track the <em>asset value</em> here; track loan repayment under monthly expenses. For rental income, update Amount periodically to reflect current market value via ✏️ Edit.')}

            ${card('📜', 'Bonds / Debentures / NPS', 'var(--accent-teal)',
              row('Amount (₹)', 'Face value / amount invested at purchase', '₹50,000') +
              row('Bank / Institution', 'Bond name or issuer', 'REC Bond · NHAI · NPS Tier-1') +
              row('Start Date', 'Purchase date', '2023-07-01') +
              row('Tenure (Years)', 'Bond maturity period', '5') +
              row('Rate (% p.a.)', 'Actual coupon / interest rate on your bond certificate. <strong>Always override</strong> — don\'t rely on default.', '7.74') +
              row('Maturity Date', 'Date shown on your bond certificate', '2028-07-01'),
              '')}

            ${card('🛡️', 'Insurance — All Types', '#5b7fff',
              row('Amount (₹)', 'Your <strong>annual premium</strong> paid. For single-pay policies, enter the one-time premium.', '₹12,000 / yr') +
              row('Insurance Type', '<strong>Critical — select correctly:</strong> Term / Health / Accident → shown as protection cost (₹0 wealth). Endowment / ULIP / MoneyBack → premium tracked as wealth corpus.', 'Term') +
              row('Bank / Institution', 'Insurance company name', 'LIC · HDFC Life · Star Health') +
              row('Cover / Sum Assured', 'Coverage amount from your policy document. For health: total cover per year.', '₹1,00,00,000') +
              row('Premium Frequency', 'How often you pay the premium', 'Annual · Monthly') +
              row('Start Date', 'Policy start / commencement date', '2020-04-01') +
              row('Tenure (Years)', 'Policy term (not premium-paying term if different)', '30') +
              row('Maturity Date', 'For endowment/money-back: policy maturity date. For term: expiry date.', '2050-04-01'),
              '💡 <strong>Rule of thumb on what counts as wealth:</strong> If the policy pays you money during your lifetime (survival benefit, maturity, surrender), it\'s wealth. If it only pays on death/disability/hospitalization, it\'s protection cost. Cover amount is always tracked separately as your financial safety net.')}

            ${card('⚡', 'Crypto — Bitcoin, Altcoins', '#e55353',
              row('Amount (₹)', 'Total INR invested (sum of all purchase transactions)', '₹25,000') +
              row('Bank / Institution', 'Exchange name', 'CoinDCX · WazirX · Binance') +
              row('Start Date', 'Date of first purchase (or average purchase date)', '2023-01-15') +
              row('Rate (% p.a.)', 'Conservative estimate for projection. Actual returns are highly volatile — use 15–20% as a baseline, not a guarantee.', '15') +
              row('Notes', 'Coin name, wallet info, or transaction reference', 'BTC 0.005 @ ₹23L'),
              '💡 <strong>Indian tax rules:</strong> All crypto gains taxed at 30% flat (no deduction, no loss offset). 1% TDS deducted on every sale by the exchange. Keep a transaction log separately for tax filing. Update Amount to current market value via ✏️ Edit for accurate wealth tracking.')}
          `;
        })()
      },
      {
        icon: '📊',
        title: 'Investment Types — Quick Reference',
        content: `
          <table class="fin-help-table">
            <thead><tr><th>Type</th><th>Risk</th><th>Returns</th><th>Liquidity</th><th>Tax Benefit</th></tr></thead>
            <tbody>
              <tr><td><strong>SIP / Mutual Fund</strong></td><td>Medium–High</td><td>10–15% CAGR</td><td>High (T+3)</td><td>ELSS qualifies for 80C</td></tr>
              <tr><td><strong>Fixed Deposit</strong></td><td>Very Low</td><td>6.5–7.5%</td><td>Medium (penalty)</td><td>5-yr Tax Saver FD: 80C</td></tr>
              <tr><td><strong>PPF</strong></td><td>Very Low</td><td>7.1% guaranteed</td><td>Low (15yr lock-in)</td><td>EEE — all tax-free</td></tr>
              <tr><td><strong>EPF</strong></td><td>Very Low</td><td>8.15%</td><td>Low (retirement)</td><td>EEE tax benefit</td></tr>
              <tr><td><strong>Shares (Direct)</strong></td><td>High</td><td>12–18% long-term</td><td>High (T+2)</td><td>LTCG exempt up to ₹1L/yr</td></tr>
              <tr><td><strong>Bonds / Debentures</strong></td><td>Low–Medium</td><td>7–9%</td><td>Medium</td><td>Varies by bond type</td></tr>
              <tr><td><strong>Gold (SGBs)</strong></td><td>Low–Medium</td><td>8–10% (price + 2.5%)</td><td>Medium</td><td>Capital gains exempt at maturity</td></tr>
              <tr><td><strong>Real Estate</strong></td><td>Medium</td><td>8–12% (city-dependent)</td><td>Very Low</td><td>Home loan interest: Sec 24(b)</td></tr>
              <tr><td><strong>Crypto</strong></td><td>Very High</td><td>Extremely variable</td><td>High</td><td>30% flat tax + 1% TDS</td></tr>
            </tbody>
          </table>`
      },
      {
        icon: '🛡️',
        title: 'Insurance — Premium vs Cover Explained',
        content: `
          <table class="fin-help-table">
            <thead><tr><th>Type</th><th>Purpose</th><th>Counted as Wealth?</th><th>Key Points</th></tr></thead>
            <tbody>
              <tr><td><strong>Term Insurance</strong></td><td>Pure life cover</td><td>❌ No (pure cost)</td><td>Cheapest life cover. Buy 10–15× annual income. Essential if you have dependents.</td></tr>
              <tr><td><strong>Health Insurance</strong></td><td>Medical expenses</td><td>❌ No (pure cost)</td><td>₹5L self, ₹10L+ family floater. 80D: ₹25K–75K deduction on premium.</td></tr>
              <tr><td><strong>Personal Accident</strong></td><td>Disability/death cover</td><td>❌ No (pure cost)</td><td>Low premium, high cover. Complements term plan for total protection.</td></tr>
              <tr><td><strong>Endowment / Traditional</strong></td><td>Life cover + forced savings</td><td>✅ Yes (premium paid)</td><td>Returns ~4–5% — poor vs alternatives. "Buy term + invest rest" is smarter.</td></tr>
              <tr><td><strong>ULIP</strong></td><td>Insurance + equity investment</td><td>✅ Yes (fund value)</td><td>5-year lock-in, higher charges. Prefer separate SIP + Term plan instead.</td></tr>
              <tr><td><strong>Money-Back Policy</strong></td><td>Periodic payouts + life cover</td><td>✅ Partially</td><td>Returns ~4–6%. Good for those needing guaranteed income at set intervals.</td></tr>
            </tbody>
          </table>
          <p style="margin-top:10px;font-size:11px;background:rgba(91,127,255,0.08);border-radius:6px;padding:8px;border-left:3px solid var(--accent-blue);"><strong>Dashboard Rule:</strong> Term/Health/Accident premiums = expense only, ₹0 wealth. ULIP/Endowment/Money-Back = premium paid tracked as investable corpus. "Cover Amount" shown separately as your financial protection shield.</p>`
      },
      {
        icon: '🧮',
        title: 'How Each Investment Is Calculated',
        content: `
          <p style="margin-bottom:12px;font-size:12px;color:var(--text-muted);">Every "Value Today" figure in the log is computed in real time. Here's the exact formula used for each type.</p>

          <div style="display:flex;flex-direction:column;gap:10px;">

            <div style="border:1px solid var(--border);border-radius:8px;padding:12px;">
              <div style="font-weight:700;font-size:13px;margin-bottom:6px;color:var(--accent-teal);">🏛️ PPF — Public Provident Fund</div>

              <p style="font-size:11px;font-weight:600;margin-bottom:4px;">Key interest rule</p>
              <p style="font-size:11px;margin-bottom:8px;">Interest is calculated monthly on the minimum balance between the <strong>5th and last day</strong> of each month, but <strong>credited only once — on March 31</strong> (end of financial year). There is <em>no</em> partial-year interest credit at any other date.</p>

              <p style="font-size:11px;font-weight:600;margin-bottom:4px;">Formula used (annuity-due model)</p>
              <div style="background:var(--surface);border-radius:6px;padding:8px;font-family:monospace;font-size:11px;margin-bottom:8px;">
                New contributions (n completed FYs):<br>
                &nbsp;&nbsp;= P × [(1+r)ⁿ − 1] / r × (1+r)<br><br>
                Prior corpus (opened before tracking):<br>
                &nbsp;&nbsp;= Opening Balance × (1+r)ⁿ<br><br>
                <strong>Value shown = new contributions + prior corpus</strong><br>
                (reflects balance as of last March 31)
              </div>

              <p style="font-size:11px;font-weight:600;margin-bottom:4px;">How to enter your PPF correctly</p>
              <ol style="font-size:11px;padding-left:16px;margin-bottom:8px;line-height:1.8;">
                <li><strong>Amount</strong> = your fixed annual contribution (e.g. ₹1,50,000)</li>
                <li><strong>Start Date</strong> = April 1 of the first year you're tracking from</li>
                <li><strong>Prior Corpus</strong> = the balance from your last statement <em>before</em> the start date (leave 0 for brand-new accounts)</li>
                <li>Each time you receive an annual statement, use <strong>✏️ Edit</strong> → update "Prior Corpus" to the new year-end balance and move "Start Date" to the new April 1 — this keeps the projection accurate.</li>
              </ol>

              <p style="font-size:11px;margin-bottom:4px;"><strong>Example</strong> — FY 25-26 statement shows ₹4,99,818:</p>
              <div style="background:var(--surface);border-radius:6px;padding:8px;font-size:11px;margin-bottom:8px;">
                Prior Corpus = ₹4,99,818 · Start Date = 2026-04-01 · Amount = ₹1,50,000<br>
                Value shown (end FY 26-27) = 4,99,818 × 1.071 + 1,50,000 × 1.071 = ₹6,96,155
              </div>

              <p style="font-size:11px;color:var(--accent-amber);">⚠️ Invest before April 5 each year to earn a full April month's interest — investing on April 1 maximises annual returns by ~₹1,000 vs investing in May.</p>
            </div>

            <div style="border:1px solid var(--border);border-radius:8px;padding:12px;">
              <div style="font-weight:700;font-size:13px;margin-bottom:6px;color:var(--accent-teal);">🏦 Fixed Deposits</div>
              <p style="font-size:11px;margin-bottom:6px;">Compounded quarterly from the start date to today. Interest is added to the principal every 3 months.</p>
              <div style="background:var(--surface);border-radius:6px;padding:8px;font-family:monospace;font-size:11px;margin-bottom:6px;">
                Value = P × (1 + r/4)^(4×t)<br>
                t = exact years elapsed (today − start date)
              </div>
              <p style="font-size:11px;color:var(--text-muted);">Example: ₹1,00,000 at 7% for 2 years → ₹1,00,000 × (1.0175)⁸ = ₹1,14,868</p>
            </div>

            <div style="border:1px solid var(--border);border-radius:8px;padding:12px;">
              <div style="font-weight:700;font-size:13px;margin-bottom:6px;color:var(--accent-teal);">📈 SIP — Systematic Investment Plan</div>
              <p style="font-size:11px;margin-bottom:6px;"><strong>With AMFI code + units:</strong> Value = Units held × Live NAV (fetched from mfapi.in).</p>
              <p style="font-size:11px;margin-bottom:6px;"><strong>Without live data:</strong> Uses the future-value annuity formula for monthly contributions:</p>
              <div style="background:var(--surface);border-radius:6px;padding:8px;font-family:monospace;font-size:11px;margin-bottom:6px;">
                Value = P × [(1 + r/12)^m − 1] / (r/12) × (1 + r/12)<br>
                P = monthly SIP amount · m = months elapsed · r = expected annual return
              </div>
              <p style="font-size:11px;color:var(--text-muted);">Invested = P × m (total months paid × monthly amount)</p>
            </div>

            <div style="border:1px solid var(--border);border-radius:8px;padding:12px;">
              <div style="font-weight:700;font-size:13px;margin-bottom:6px;color:var(--accent-teal);">📊 Shares — Direct Stocks</div>
              <p style="font-size:11px;margin-bottom:6px;"><strong>With NSE ticker + units:</strong> Value = Units held × Live market price (Yahoo Finance NSE).</p>
              <p style="font-size:11px;margin-bottom:4px;"><strong>Without live price:</strong> Estimate using annual compounding:</p>
              <div style="background:var(--surface);border-radius:6px;padding:8px;font-family:monospace;font-size:11px;">
                Value = Amount Invested × (1 + r)^t<br>
                t = years elapsed · r = estimated annual return (default 12%)
              </div>
            </div>

            <div style="border:1px solid var(--border);border-radius:8px;padding:12px;">
              <div style="font-weight:700;font-size:13px;margin-bottom:6px;color:var(--accent-teal);">🏛️ EPF — Employee Provident Fund</div>
              <p style="font-size:11px;margin-bottom:6px;">Monthly contributions (your 12% + employer's 3.67% EPF share) compound monthly. Interest is declared annually by EPFO but effectively credited monthly.</p>
              <div style="background:var(--surface);border-radius:6px;padding:8px;font-family:monospace;font-size:11px;margin-bottom:6px;">
                Monthly amount = P + P×(3.67/12)  [employee + employer EPF share]<br>
                Value = Monthly × [(1 + r/12)^m − 1] / (r/12) × (1 + r/12)<br>
                r = 8.25% · m = months since start
              </div>
              <p style="font-size:11px;color:var(--text-muted);">Enter your monthly employee contribution as the amount. The 3.67% employer EPF match is added automatically. (Full 12% employer contribution goes to EPF only when salary ≤ ₹15,000; otherwise ₹1,250/mo to EPS pension fund.)</p>
            </div>

            <div style="border:1px solid var(--border);border-radius:8px;padding:12px;">
              <div style="font-weight:700;font-size:13px;margin-bottom:6px;color:var(--accent-teal);">🏅 Gold / SGBs &amp; Bonds</div>
              <p style="font-size:11px;margin-bottom:4px;">Annual compounding from start date:</p>
              <div style="background:var(--surface);border-radius:6px;padding:8px;font-family:monospace;font-size:11px;margin-bottom:6px;">
                Value = P × (1 + r)^t
              </div>
              <p style="font-size:11px;color:var(--text-muted);">Gold default 10.5% = ~8% gold price appreciation + 2.5% SGB coupon. Bonds default 7.2% = avg. govt. bond yield. Override rate manually for your actual instrument.</p>
            </div>

            <div style="border:1px solid var(--border);border-radius:8px;padding:12px;">
              <div style="font-weight:700;font-size:13px;margin-bottom:6px;color:var(--accent-teal);">🛡️ Insurance</div>
              <p style="font-size:11px;">Term / Health / Accident → <strong>₹0 wealth</strong>. These are pure costs; only the "Cover Amount" is tracked (shown as your protection shield).<br>
              ULIP / Endowment / Money-Back → premium paid corpus grows at the configured rate using annual compounding. Surrender value may differ — update the amount manually if you get a surrender quote.</p>
            </div>

            <div style="background:rgba(91,127,255,0.06);border:1px solid rgba(91,127,255,0.2);border-radius:8px;padding:10px;margin-top:2px;">
              <p style="font-size:11px;font-weight:600;margin-bottom:4px;">Withdrawn / Reinvested entries</p>
              <p style="font-size:11px;color:var(--text-muted);">Withdrawn: wealth = actual amount received (enter on closure). Reinvested: old entry → ₹0, new entry auto-created with the reinvested principal. Both are kept for record history.</p>
            </div>

          </div>`
      },
      {
        icon: '💰',
        title: 'Tax Saving — 80C, 80D & More',
        content: `
          <table class="fin-help-table">
            <thead><tr><th>Section</th><th>Limit</th><th>Eligible Instruments</th><th>Max Saving (30%)</th></tr></thead>
            <tbody>
              <tr><td><strong>80C</strong></td><td>₹1.5L/yr</td><td>ELSS (MF), PPF, EPF, Life Insurance premium, 5yr FD, NSC, ULIP</td><td>₹46,800</td></tr>
              <tr><td><strong>80D</strong></td><td>₹25K–75K/yr</td><td>Health Insurance premium (self, spouse, children + parents)</td><td>₹23,400</td></tr>
              <tr><td><strong>80CCD(1B)</strong></td><td>₹50K/yr extra</td><td>NPS — National Pension Scheme (over and above 80C)</td><td>₹15,600</td></tr>
              <tr><td><strong>24(b)</strong></td><td>₹2L/yr</td><td>Home Loan Interest (self-occupied property only)</td><td>₹62,400</td></tr>
              <tr><td><strong>LTCG</strong></td><td>₹1L/yr exempt</td><td>Equity shares/MF held >1 year — gains taxed at 10% above ₹1L</td><td>₹10,000</td></tr>
            </tbody>
          </table>`
      },
      {
        icon: '⚖️',
        title: 'Ideal Asset Allocation by Risk Profile',
        content: `
          <p><strong>Rule of Thumb:</strong> Equity % ≈ 100 − Your Age (adjust for risk appetite)</p>
          <br>
          <table class="fin-help-table">
            <thead><tr><th>Asset Class</th><th>Conservative</th><th>Balanced</th><th>Aggressive</th></tr></thead>
            <tbody>
              <tr><td>Equity (SIP/Shares)</td><td>30–40%</td><td>50–60%</td><td>70–80%</td></tr>
              <tr><td>Debt (FD/PPF/Bonds)</td><td>40–50%</td><td>25–35%</td><td>10–20%</td></tr>
              <tr><td>Gold / Real Estate</td><td>10–15%</td><td>5–10%</td><td>5%</td></tr>
              <tr><td>Emergency Fund (Liquid)</td><td>6 months</td><td>3–6 months</td><td>3 months</td></tr>
              <tr><td>Crypto / Speculative</td><td>0–2%</td><td>2–5%</td><td>5–10%</td></tr>
            </tbody>
          </table>
          <p style="margin-top:8px;font-size:11px;">Rebalance annually: sell over-performing assets, buy under-performing ones to maintain your target allocation.</p>`
      },
      {
        icon: '📅',
        title: 'Maturity & Reinvestment Flow',
        content: `
          <p>When an FD, PPF, or insurance policy matures, the dashboard alerts you (within 6 months). You then choose:</p>
          <br>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div style="background:rgba(0,212,124,0.06);border:1px solid rgba(0,212,124,0.2);border-radius:8px;padding:10px;">
              <p style="font-weight:600;color:var(--accent-green);margin-bottom:6px;">Option A — Withdraw</p>
              <ul style="list-style:none;font-size:11px;">
                <li>• Enter amount actually received</li>
                <li>• Status → "Withdrawn"</li>
                <li>• Wealth updates to received amount</li>
                <li>• Entry kept for records</li>
              </ul>
            </div>
            <div style="background:rgba(91,127,255,0.06);border:1px solid rgba(91,127,255,0.2);border-radius:8px;padding:10px;">
              <p style="font-weight:600;color:var(--accent-blue);margin-bottom:6px;">Option B — Reinvest</p>
              <ul style="list-style:none;font-size:11px;">
                <li>• Enter new amount to reinvest</li>
                <li>• Old entry → "Reinvested" (₹0)</li>
                <li>• New entry auto-created</li>
                <li>• Set new maturity date</li>
              </ul>
            </div>
          </div>
          <p style="margin-top:10px;font-size:11px;color:var(--text-faint);">Pro tip: Always enter the FD interest rate when adding a deposit — the dashboard auto-calculates your accrued interest over time without manual entry.</p>`
      },
      {
        icon: '📉',
        title: 'Expense Tracking — Savings Rate Guide',
        content: `
          <p>Track monthly income and expenses to calculate your savings rate — the most important metric in personal finance.</p>
          <br>
          <table class="fin-help-table">
            <thead><tr><th>Savings Rate</th><th>Assessment</th><th>Years to Financial Independence</th></tr></thead>
            <tbody>
              <tr><td>Below 10%</td><td>🚨 Critical</td><td>40+ years</td></tr>
              <tr><td>10–20%</td><td>⚠️ Needs work</td><td>35–40 years</td></tr>
              <tr><td>20–30%</td><td>✅ Healthy</td><td>28–35 years</td></tr>
              <tr><td>30–50%</td><td>🌟 Excellent</td><td>17–28 years</td></tr>
              <tr><td>50%+</td><td>🏆 FIRE level</td><td>&lt;17 years</td></tr>
            </tbody>
          </table>
          <br>
          <p><strong>50/30/20 Rule:</strong></p>
          <ul style="list-style:none;margin-top:6px;">
            <li>• <strong>50%</strong> — Needs (housing, food, transport, insurance)</li>
            <li>• <strong>30%</strong> — Wants (entertainment, shopping, dining out)</li>
            <li>• <strong>20%</strong> — Savings & Investments (non-negotiable)</li>
          </ul>`
      }
    ];

    container.innerHTML = sections.map((s, i) => `
      <div class="fin-help-accordion${i === 0 ? ' open' : ''}" id="helpAccordion${i}">
        <div class="fin-help-header" onclick="FinanceTracker.toggleHelpSection(${i})">
          <div class="fin-help-header-left">
            <span class="fin-help-icon">${s.icon}</span>
            <span class="fin-help-title">${s.title}</span>
          </div>
          <span class="fin-help-chevron">▼</span>
        </div>
        <div class="fin-help-body">${s.content}</div>
      </div>`).join('');
  },

  toggleHelpSection(idx) {
    document.getElementById(`helpAccordion${idx}`)?.classList.toggle('open');
  },

  // ═══ Investment CRUD ══════════════════════════════════════

  addInvestment(formData) {
    AppState.investments = AppState.investments || [];
    const type   = formData.type;
    const bank   = formData.bankAccount || '';
    const tenureRaw  = parseFloat(formData.tenure) || 0;
    const tenureUnit = formData.tenureUnit || 'Years';
    const tenure     = tenureRaw || INV_RATE_CONFIG[type]?.tenure || 0;

    // Auto-detect rate if not provided
    let rate = parseFloat(formData.interestRate) || 0;
    if (!rate) rate = this.getAutoRate(type, bank, tenure).rate;

    // Auto-set maturity date if tenure given and maturity not set
    let maturityDate = formData.maturityDate || '';
    if (!maturityDate && tenure && formData.date) {
      const start = new Date(formData.date);
      const tenureInYears = this._tenureToYears
        ? this._tenureToYears(tenure, tenureUnit)
        : (tenureUnit === 'Days' ? tenure/365 : tenureUnit === 'Months' ? tenure/12 : tenure);
      start.setDate(start.getDate() + Math.round(tenureInYears * 365));
      maturityDate = start.toISOString().split('T')[0];
    }

    const inv = {
      id:               Date.now(),
      type,
      amount:           parseFloat(formData.amount) || 0,
      notes:            formData.notes || '',
      date:             formData.date || new Date().toISOString().split('T')[0],
      bankAccount:      bank,
      tenure,
      tenureUnit,
      maturityDate,
      status:           formData.status || 'active',
      depositType:      formData.depositType || 'FD',
      insuranceType:    formData.insuranceType || '',
      sipMode:          formData.sipMode || 'SIP',
      coverAmount:      parseFloat(formData.coverAmount) || 0,
      premiumFrequency: formData.premiumFrequency || '',
      interestRate:     rate,
      withdrawnAmount:  0,
      withdrawalDate:   '',
      openingBalance:   parseFloat(formData.openingBalance) || 0,
      ticker:           (formData.ticker || '').toUpperCase().replace(/[^A-Z0-9&]/g, ''),
      tickerExchange:   formData.tickerExchange || 'NSE',
      units:            parseFloat(formData.units) || 0,
      amfiCode:         formData.amfiCode || '',
      livePrice:        parseFloat(formData.livePrice) || 0,
      livePriceFetched: '',
    };
    AppState.investments.push(inv);
    AppState.save();
    this.renderInvestments();
    UI.showToast(`✅ Added ${inv.type}${inv.bankAccount ? ' — ' + inv.bankAccount : ''}`);
  },

  deleteInvestment(id) {
    AppState.investments = (AppState.investments || []).filter(inv => inv.id !== id);
    AppState.save();
    this.renderInvestments();
    UI.showToast('🗑️ Investment removed');
  },

  // ═══ Withdrawal Modal ════════════════════════════════════

  openWithdrawalModal(id) {
    const inv = (AppState.investments || []).find(i => i.id === id);
    if (!inv) return;
    document.getElementById('wdModalTitle').textContent = `${inv.type}${inv.bankAccount ? ' — ' + inv.bankAccount : ''}`;
    document.getElementById('wdModalValue').textContent  = 'Invested: ₹' + this._lakh(inv.amount);
    document.getElementById('wdModalInvId').value        = id;
    document.getElementById('wdAmount').value            = '';
    document.getElementById('wdDate').value              = new Date().toISOString().split('T')[0];
    document.getElementById('withdrawalModal').classList.add('open');
  },

  closeWithdrawalModal() {
    document.getElementById('withdrawalModal')?.classList.remove('open');
  },

  confirmWithdrawal() {
    const id     = parseInt(document.getElementById('wdModalInvId').value);
    const amount = parseFloat(document.getElementById('wdAmount').value) || 0;
    const date   = document.getElementById('wdDate').value;
    const idx    = (AppState.investments || []).findIndex(i => i.id === id);
    if (idx === -1) return;
    AppState.investments[idx] = { ...AppState.investments[idx], status: 'withdrawn', withdrawnAmount: amount, withdrawalDate: date };
    AppState.save();
    this.closeWithdrawalModal();
    this.renderInvestments();
    UI.showToast('✅ Withdrawal recorded');
  },

  // ═══ Maturity Modal ══════════════════════════════════════

  openMaturityModal(id) {
    const inv = (AppState.investments || []).find(i => i.id === id);
    if (!inv) return;
    document.getElementById('matModalTitle').textContent = `${inv.type}${inv.bankAccount ? ' — ' + inv.bankAccount : ''}`;
    document.getElementById('matModalValue').textContent  = 'Est. value: ₹' + this._lakh(this.calculateInvestmentWealth(inv));
    document.getElementById('matModalInvId').value        = id;
    document.getElementById('matWithdrawnAmount').value   = '';
    document.getElementById('matWithdrawalDate').value    = new Date().toISOString().split('T')[0];
    document.getElementById('maturityModal').classList.add('open');
  },

  closeMaturityModal() {
    document.getElementById('maturityModal')?.classList.remove('open');
  },

  handleMaturityWithdraw() {
    const id     = parseInt(document.getElementById('matModalInvId').value);
    const amount = parseFloat(document.getElementById('matWithdrawnAmount').value) || 0;
    const date   = document.getElementById('matWithdrawalDate').value;
    const idx    = (AppState.investments || []).findIndex(i => i.id === id);
    if (idx === -1) return;
    AppState.investments[idx] = { ...AppState.investments[idx], status: 'withdrawn', withdrawnAmount: amount, withdrawalDate: date };
    AppState.save();
    this.closeMaturityModal();
    this.renderInvestments();
    UI.showToast('✅ Withdrawal recorded');
  },

  handleMaturityReinvest() {
    const id     = parseInt(document.getElementById('matModalInvId').value);
    const amount = parseFloat(document.getElementById('matWithdrawnAmount').value) || 0;
    const date   = document.getElementById('matWithdrawalDate').value;
    const idx    = (AppState.investments || []).findIndex(i => i.id === id);
    if (idx === -1) return;

    const old = AppState.investments[idx];
    AppState.investments[idx] = { ...old, status: 'reinvested' };

    AppState.investments.push({
      id:               Date.now(),
      type:             old.type,
      amount:           amount || old.amount,
      notes:            `Reinvested from: ${old.notes || old.type}`,
      date:             date || new Date().toISOString().split('T')[0],
      bankAccount:      old.bankAccount || '',
      maturityDate:     '',
      status:           'active',
      insuranceType:    old.insuranceType || '',
      coverAmount:      old.coverAmount || 0,
      premiumFrequency: old.premiumFrequency || '',
      interestRate:     old.interestRate || 0,
      withdrawnAmount:  0,
      withdrawalDate:   '',
    });
    AppState.save();
    this.closeMaturityModal();
    this.renderInvestments();
    UI.showToast('✅ Reinvestment entry created');
  },

  // ═══ Live Price Fetching (NSE/BSE Stocks + MF NAV) ══════════
  // Browser CORS policy blocks direct API calls from file:// or
  // unauthenticated origins. We try multiple CORS-friendly proxies
  // and fall back gracefully to manual entry.

  async _fetchStockPrice(symbol, exchange) {
    const suffix = (exchange || 'NSE').toUpperCase() === 'BSE' ? '.BO' : '.NS';
    const sym    = symbol.toUpperCase().replace(/[^A-Z0-9&]/g, '') + suffix;
    const yUrl   = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`;

    // CORS proxy ladder — allorigins is most reliable for browser contexts
    const urls = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(yUrl)}`,
      `https://corsproxy.io/?${yUrl}`,
      `https://api.codetabs.com/v1/proxy?quest=${yUrl}`,
      yUrl,  // direct last (works when served over HTTP)
    ];

    for (const url of urls) {
      try {
        const ctrl  = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 7000);
        const res   = await fetch(url, { signal: ctrl.signal });
        clearTimeout(timer);
        if (!res.ok) continue;
        const data  = await res.json();
        const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
        if (price > 0) return price;
      } catch { /* CORS blocked or timeout — try next */ }
    }
    return null;
  },

  async _fetchMFNav(schemeCode) {
    // mfapi.in has CORS enabled — works reliably from browsers
    try {
      const ctrl  = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const res   = await fetch(`https://api.mfapi.in/mf/${schemeCode}/latest`, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const nav  = parseFloat(data?.data?.[0]?.nav);
      if (nav > 0) return nav;
    } catch {}
    return null;
  },

  async refreshLivePrices() {
    const btn = document.getElementById('refreshPricesBtn');
    if (btn) { btn.textContent = '⏳ Fetching…'; btn.disabled = true; }

    const investments = AppState.investments || [];
    let fetched = 0, failed = 0;
    const promises = [];

    for (const inv of investments) {
      if ((inv.status || 'active') !== 'active') continue;
      if (inv.type === 'Shares' && inv.ticker && inv.units > 0) {
        promises.push(
          this._fetchStockPrice(inv.ticker, inv.tickerExchange || 'NSE').then(price => {
            if (price !== null) { inv.livePrice = price; inv.livePriceFetched = new Date().toISOString(); fetched++; }
            else failed++;
          })
        );
      } else if (inv.type === 'SIP' && inv.amfiCode && inv.units > 0) {
        promises.push(
          this._fetchMFNav(inv.amfiCode).then(nav => {
            if (nav !== null) { inv.livePrice = nav; inv.livePriceFetched = new Date().toISOString(); fetched++; }
            else failed++;
          })
        );
      }
    }

    await Promise.allSettled(promises);
    AppState.save();
    this.renderInvestments();
    if (btn) { btn.textContent = '🔄 Refresh Prices'; btn.disabled = false; }

    if (!promises.length) {
      UI.showToast('ℹ️ No live-tracked assets. Add ticker symbols + share quantity.');
    } else if (fetched > 0) {
      UI.showToast(`✅ Updated ${fetched} asset${fetched !== 1 ? 's' : ''}${failed ? ` · ${failed} need manual entry` : ''}`);
      if (failed > 0) this.openManualPriceModal();
    } else {
      // All auto-fetches failed — open manual entry directly
      UI.showToast('ℹ️ Auto-fetch unavailable — enter prices manually below');
      this.openManualPriceModal();
    }
  },

  // ── Manual Price Entry Modal ──────────────────────────────
  // Shown when CORS blocks auto-fetch. User enters prices from
  // their broker app (Zerodha / Groww) and saves them here.

  openManualPriceModal() {
    const modal = document.getElementById('manualPriceModal');
    if (!modal) return;

    const investments = AppState.investments || [];
    const rows = investments
      .filter(i => (i.status || 'active') === 'active' &&
                   ((i.type === 'Shares' && i.ticker) ||
                    (i.type === 'SIP' && i.amfiCode && i.units > 0)))
      .map(inv => {
        const isStock = inv.type === 'Shares';
        const label   = isStock
          ? `${inv.ticker} (${inv.tickerExchange || 'NSE'}) — ${inv.units} shares`
          : inv.bankAccount || 'SIP Fund';
        const lastFetched = inv.livePriceFetched
          ? new Date(inv.livePriceFetched).toLocaleDateString('en-IN')
          : 'never';
        return `
          <tr>
            <td style="padding:8px 10px;font-size:12px;">
              <div style="font-weight:600;">${label}</div>
              <div style="font-size:10px;color:var(--text-muted);">Last updated: ${lastFetched}</div>
            </td>
            <td style="padding:8px 10px;text-align:right;">
              <input type="number" step="0.01" min="0"
                id="mp_${inv.id}"
                value="${inv.livePrice > 0 ? inv.livePrice : ''}"
                placeholder="${isStock ? 'NSE price ₹' : 'NAV ₹'}"
                style="width:110px;font-size:12px;padding:4px 8px;background:var(--card);
                       border:1px solid var(--border);border-radius:4px;color:var(--text);
                       text-align:right;">
            </td>
          </tr>`;
      }).join('');

    const tbody = document.getElementById('manualPriceRows');
    if (tbody) tbody.innerHTML = rows || '<tr><td colspan="2" style="text-align:center;padding:20px;color:var(--text-muted);">No stocks/SIPs with ticker configured yet.</td></tr>';

    modal.classList.add('open');
  },

  closeManualPriceModal() {
    document.getElementById('manualPriceModal')?.classList.remove('open');
  },

  saveManualPrices() {
    const investments = AppState.investments || [];
    let updated = 0;
    investments.forEach(inv => {
      const el = document.getElementById(`mp_${inv.id}`);
      if (!el) return;
      const price = parseFloat(el.value);
      if (price > 0) {
        inv.livePrice = price;
        inv.livePriceFetched = new Date().toISOString();
        updated++;
      }
    });
    AppState.save();
    this.closeManualPriceModal();
    this.renderInvestments();
    UI.showToast(`✅ ${updated} price${updated !== 1 ? 's' : ''} saved`);
  },

  _bindManualPriceModal() {
    const modal = document.getElementById('manualPriceModal');
    if (!modal || modal.dataset.bound) return;
    modal.dataset.bound = '1';
    document.getElementById('mpCancelBtn')?.addEventListener('click', () => this.closeManualPriceModal());
    document.getElementById('mpSaveBtn')?.addEventListener('click',   () => this.saveManualPrices());
    modal.addEventListener('click', e => { if (e.target === modal) this.closeManualPriceModal(); });
  },

  // ═══ EPF Monthly Log Management ══════════════════════════

  addEPFLogEntry(invId) {
    const inv = (AppState.investments || []).find(i => i.id === invId);
    if (!inv) return;

    const month = document.getElementById(`epfMonth_${invId}`)?.value;
    const emp   = parseFloat(document.getElementById(`epfEmp_${invId}`)?.value) || 0;
    const er    = parseFloat(document.getElementById(`epfEr_${invId}`)?.value) || 0;
    const type  = document.getElementById(`epfType_${invId}`)?.value || 'contribution';
    const note  = document.getElementById(`epfNote_${invId}`)?.value || '';

    if (!month) { UI.showToast('⚠️ Please select a month'); return; }
    if (emp === 0 && er === 0) { UI.showToast('⚠️ Enter employee or employer amount'); return; }

    inv.epfLog = inv.epfLog || [];
    // Remove existing entry for same month+type if exists
    inv.epfLog = inv.epfLog.filter(e => !(e.month === month && e.type === type));
    inv.epfLog.push({ month, employee: emp, employer: er, type, note });
    inv.epfLog.sort((a, b) => a.month.localeCompare(b.month));

    // Update amount to latest monthly contribution
    if (type === 'contribution') {
      const latest = [...inv.epfLog].filter(e => e.type === 'contribution').pop();
      if (latest) inv.amount = latest.employee;
    }

    AppState.save();
    this.renderInvestments();
    UI.showToast(`✅ Added ${month} EPF entry`);
  },

  deleteEPFLogEntry(invId, month, type) {
    const inv = (AppState.investments || []).find(i => i.id === invId);
    if (!inv || !inv.epfLog) return;
    inv.epfLog = inv.epfLog.filter(e => !(e.month === month && e.type === type));
    AppState.save();
    this.renderInvestments();
    UI.showToast('🗑️ Entry removed');
  },

  // ═══ Edit Investment Modal ════════════════════════════════

  openEditInvModal(id) {
    const inv = (AppState.investments || []).find(i => i.id === id);
    if (!inv) return;
    const isShares = inv.type === 'Shares';
    const isSIP    = inv.type === 'SIP';
    const isPPF    = inv.type === 'PPF';

    document.getElementById('editInvTitle').textContent = `Edit ${inv.type}${inv.bankAccount ? ' — ' + inv.bankAccount : ''}`;
    document.getElementById('editInvId').value          = inv.id;
    document.getElementById('editInvAmtLabel').textContent = INV_RATE_CONFIG[inv.type]?.amtLabel || 'Amount (₹)';
    document.getElementById('editInvAmount').value      = inv.amount || '';
    document.getElementById('editInvRate').value        = inv.interestRate || '';
    document.getElementById('editInvBank').value        = inv.bankAccount || '';
    document.getElementById('editInvNotes').value       = inv.notes || '';
    document.getElementById('editInvTicker').value      = inv.ticker || '';
    document.getElementById('editInvExchange').value    = inv.tickerExchange || 'NSE';
    document.getElementById('editInvUnits').value       = inv.units || '';
    document.getElementById('editInvAmfi').value        = inv.amfiCode || '';
    document.getElementById('editInvLivePrice').value   = inv.livePrice || '';
    document.getElementById('editInvOpenBal').value     = inv.openingBalance || '';

    const isDeposits = inv.type === 'Deposits';
    const show = (id, vis) => { const el = document.getElementById(id); if (el) el.style.display = vis ? '' : 'none'; };
    show('editInvDepositTypeRow', isDeposits);
    show('editInvExchangeRow', isShares);
    show('editInvTickerRow',    isShares);
    show('editInvUnitsRow',     isShares || isSIP);
    show('editInvAmfiRow',      isSIP);
    show('editInvLivePriceRow', isShares || isSIP);
    show('editInvOpenBalRow',   isPPF);
    if (isDeposits) {
      const dtEl = document.getElementById('editInvDepositType');
      if (dtEl) dtEl.value = inv.depositType || 'FD';
    }
    document.getElementById('editInvUnitsLabel').textContent     = isShares ? 'Number of Shares' : 'Units Held';
    document.getElementById('editInvLivePriceLabel').textContent = isShares ? 'Price / Share (₹)' : 'Current NAV (₹)';
    document.getElementById('editInvModal').classList.add('open');
  },

  closeEditInvModal() {
    document.getElementById('editInvModal')?.classList.remove('open');
  },

  confirmEditInv() {
    const id  = parseInt(document.getElementById('editInvId').value);
    const idx = (AppState.investments || []).findIndex(i => i.id === id);
    if (idx === -1) return;
    const inv = AppState.investments[idx];

    const upd = (field, elId, parser) => {
      const v = parser(document.getElementById(elId)?.value);
      if (!isNaN(v) || typeof v === 'string') inv[field] = v;
    };
    upd('amount',        'editInvAmount',    v => parseFloat(v) || 0);
    upd('interestRate',  'editInvRate',      v => parseFloat(v) || 0);
    upd('bankAccount',   'editInvBank',      v => v || '');
    upd('notes',         'editInvNotes',     v => v || '');
    upd('openingBalance','editInvOpenBal',   v => parseFloat(v) || 0);

    if (inv.type === 'Deposits') {
      inv.depositType = document.getElementById('editInvDepositType')?.value || 'FD';
    }
    if (inv.type === 'Shares' || inv.type === 'SIP') {
      inv.ticker    = (document.getElementById('editInvTicker')?.value || '').toUpperCase().replace(/[^A-Z0-9&]/g, '');
      inv.units     = parseFloat(document.getElementById('editInvUnits')?.value) || 0;
      inv.livePrice = parseFloat(document.getElementById('editInvLivePrice')?.value) || 0;
    }
    if (inv.type === 'Shares') {
      inv.tickerExchange = document.getElementById('editInvExchange')?.value || 'NSE';
    }
    if (inv.type === 'SIP') {
      inv.amfiCode = document.getElementById('editInvAmfi')?.value || '';
    }

    AppState.save();
    this.closeEditInvModal();
    this.renderInvestments();
    UI.showToast('✅ Investment updated');
  },

  _bindEditInvModal() {
    const modal = document.getElementById('editInvModal');
    if (!modal || modal.dataset.bound) return;
    modal.dataset.bound = '1';
    document.getElementById('editInvCancelBtn')?.addEventListener('click', () => this.closeEditInvModal());
    document.getElementById('editInvSaveBtn')?.addEventListener('click',   () => this.confirmEditInv());
    modal.addEventListener('click', e => { if (e.target === modal) this.closeEditInvModal(); });
  },

  // ═══ Modal Event Binding ══════════════════════════════════

  _bindModals() {
    this._bindEditInvModal();
    this._bindManualPriceModal();

    // Withdrawal modal
    const wdModal = document.getElementById('withdrawalModal');
    if (wdModal && !wdModal.dataset.bound) {
      wdModal.dataset.bound = '1';
      document.getElementById('wdCancelBtn')?.addEventListener('click', () => this.closeWithdrawalModal());
      document.getElementById('wdConfirmBtn')?.addEventListener('click', () => this.confirmWithdrawal());
      wdModal.addEventListener('click', e => { if (e.target === wdModal) this.closeWithdrawalModal(); });
    }

    // Maturity modal
    const matModal = document.getElementById('maturityModal');
    if (matModal && !matModal.dataset.bound) {
      matModal.dataset.bound = '1';
      document.getElementById('matCancelBtn')?.addEventListener('click', () => this.closeMaturityModal());
      document.getElementById('matWithdrawBtn')?.addEventListener('click', () => this.handleMaturityWithdraw());
      document.getElementById('matReinvestBtn')?.addEventListener('click', () => this.handleMaturityReinvest());
      matModal.addEventListener('click', e => { if (e.target === matModal) this.closeMaturityModal(); });
    }
  },

  // ═══ Investment Form — Smart Auto-fill & Live Preview ════

  _bindInvestmentFormToggle() { this._bindRateAutoFill(); },

  _bindRateAutoFill() {
    const form = document.getElementById('investmentForm');
    if (!form || form.dataset.rateBound) return;
    form.dataset.rateBound = '1';

    const ids = ['invType','invBankAccount','invAmount','invTenure','invTenureUnit','invInterestRate','invDate','invInsuranceType','invTicker','invUnits','invAmfiCode','invOpeningBalance','invSIPMode','invDepositType'];
    const getEl = id => document.getElementById(id);

    const update = () => {
      const type       = getEl('invType')?.value       || '';
      const bank       = getEl('invBankAccount')?.value || '';
      const amount     = parseFloat(getEl('invAmount')?.value)  || 0;
      const tenure     = parseFloat(getEl('invTenure')?.value)  || (INV_RATE_CONFIG[type]?.tenure || 1);
      const tenureUnit = getEl('invTenureUnit')?.value || 'Years';
      const sipMode    = getEl('invSIPMode')?.value || 'SIP';
      const insType    = getEl('invInsuranceType')?.value || '';
      const dateVal    = getEl('invDate')?.value || new Date().toISOString().split('T')[0];

      // Toggle type-specific fields
      const isIns      = type === 'Insurance';
      const isShares   = type === 'Shares';
      const isSIP      = type === 'SIP';
      const isPPF      = type === 'PPF';
      const isDeposits = type === 'Deposits';
      document.querySelectorAll('.insurance-only').forEach(el => el.classList.toggle('hidden', !isIns));
      document.querySelectorAll('.shares-only').forEach(el => el.classList.toggle('hidden', !isShares));
      document.querySelectorAll('.sip-only').forEach(el => el.classList.toggle('hidden', !isSIP));
      document.querySelectorAll('.shares-sip-only').forEach(el => el.classList.toggle('hidden', !isShares && !isSIP));
      document.querySelectorAll('.deposits-only').forEach(el => el.classList.toggle('hidden', !isDeposits));
      const isEPF = type === 'EPF';
      document.querySelectorAll('.ppf-only').forEach(el => el.classList.toggle('hidden', !isPPF));
      document.querySelectorAll('.ppf-epf-only').forEach(el => el.classList.toggle('hidden', !isPPF && !isEPF));
      document.querySelectorAll('.not-shares').forEach(el => el.classList.toggle('hidden', isShares));
      const unitsLabel = document.getElementById('invUnitsLabel');
      if (unitsLabel) unitsLabel.textContent = isShares ? 'Number of Shares' : 'Units Held';
      const bankLabel = document.getElementById('invBankLabel');
      if (bankLabel) bankLabel.textContent = isShares ? 'Broker' : 'Bank / Institution';
      const openBalLabel = document.getElementById('invOpenBalLabel');
      if (openBalLabel) openBalLabel.firstChild.textContent = isEPF ? 'Current EPF Corpus (₹) ' : 'Prior Corpus (₹) ';

      if (!type) {
        document.getElementById('invCalcPreview').style.display = 'none';
        return;
      }

      // Update amount field label
      const cfg = INV_RATE_CONFIG[type];
      const amtLabel = document.getElementById('invAmountLabel');
      if (amtLabel && cfg) {
        const sipMode = getEl('invSIPMode')?.value || 'SIP';
        amtLabel.textContent = (type === 'SIP' && sipMode === 'LumpSum')
          ? 'Total Investment Amount (₹)' : cfg.amtLabel;
      }

      // Set tenure default if empty
      const tenureEl = getEl('invTenure');
      if (tenureEl && !tenureEl.value && cfg) tenureEl.placeholder = cfg.tenure;

      // Auto-detect rate if user hasn't overridden
      const rateEl  = getEl('invInterestRate');
      const autoTag = document.getElementById('invRateAutoTag');
      const autoInfo = this.getAutoRate(type, bank, tenure);
      const userRate = parseFloat(rateEl?.value) || 0;

      if (rateEl && !rateEl.dataset.userEdited) {
        rateEl.value = autoInfo.rate > 0 ? autoInfo.rate : '';
        rateEl.placeholder = autoInfo.rate > 0 ? autoInfo.rate : 'N/A';
      }
      if (autoTag) autoTag.style.display = rateEl?.dataset.userEdited ? 'none' : 'inline';

      const effectiveRate = userRate > 0 ? userRate : autoInfo.rate;

      // Auto-fill maturity date if not set
      const matEl = getEl('invMaturityDate');
      if (matEl && !matEl.value && tenure && dateVal) {
        const start = new Date(dateVal);
        const tenureInYears = this._tenureToYears(tenure, tenureUnit);
        start.setDate(start.getDate() + Math.round(tenureInYears * 365));
        matEl.value = start.toISOString().split('T')[0];
      }

      // Update amount label for RD
      if (isDeposits && amtLabel) {
        const depType = getEl('invDepositType')?.value || 'FD';
        amtLabel.textContent = depType === 'RD' ? 'Monthly Instalment (₹)' : 'Principal Amount (₹)';
      }

      // Show preview (not applicable for Shares — value comes from live price)
      if (amount > 0 && !isShares) {
        const depositType = getEl('invDepositType')?.value || 'FD';
        const mockInv = { type, amount, bankAccount: bank, interestRate: effectiveRate, tenure, tenureUnit, sipMode, date: dateVal, insuranceType: insType, depositType };
        const currentVal  = this.calculateCurrentValue(mockInv);
        const maturityVal = this.calculateMaturityAmount(mockInv);
        const totalInv    = this.getTotalInvestedAmount(mockInv);
        const gain        = maturityVal - totalInv;
        const retPct      = totalInv > 0 ? ((gain / totalInv) * 100).toFixed(1) : 0;

        const isPure = type === 'Insurance' && INS_PROTECTION_TYPES.includes(insType || 'Term');

        document.getElementById('invCalcPreview').style.display = 'block';
        document.getElementById('icpRate').textContent    = effectiveRate > 0 ? effectiveRate + '% p.a.' : 'N/A';
        document.getElementById('icpCurrent').textContent = isPure ? '₹0 (Protection)' : '₹' + this._lakh(currentVal);
        document.getElementById('icpMaturity').textContent = isPure ? `₹${this._lakh(parseFloat(getEl('invCoverAmount')?.value) || 0)} cover` : '₹' + this._lakh(maturityVal);
        document.getElementById('icpGain').textContent    = isPure ? '—' : (gain >= 0 ? '+' : '') + '₹' + this._lakh(Math.abs(gain));
        document.getElementById('icpReturn').textContent  = isPure ? '—' : (gain >= 0 ? '+' : '') + retPct + '%';
        document.getElementById('icpNote').textContent    = autoInfo.note || '';

        // Color gain
        const gainEl = document.getElementById('icpGain');
        const retEl  = document.getElementById('icpReturn');
        [gainEl, retEl].forEach(el => { if (el) el.style.color = gain >= 0 ? 'var(--accent-green)' : 'var(--accent-rose)'; });
      } else {
        document.getElementById('invCalcPreview').style.display = 'none';
      }
    };

    // User-override detection on rate field
    const rateEl = getEl('invInterestRate');
    if (rateEl) {
      rateEl.addEventListener('input', () => {
        rateEl.dataset.userEdited = rateEl.value ? '1' : '';
        update();
      });
    }

    ids.forEach(id => {
      const el = getEl(id);
      if (el && id !== 'invInterestRate') el.addEventListener('change', update);
      if (el && id !== 'invInterestRate') el.addEventListener('input',  update);
    });

    update();
  },

  // ═══ Expense Tracker ══════════════════════════════════════

  renderExpenses() {
    this._bindExpenseForm();
    this.renderExpenseLog();
    this.renderExpenseChart();
    this.renderOverviewChart();
    this.renderExpenseSummaryCard();
  },

  _bindExpenseForm() {
    const form = document.getElementById('expenseForm');
    if (!form || form.dataset.bound) return;
    form.dataset.bound = '1';

    form.addEventListener('submit', e => {
      e.preventDefault();
      const month  = document.getElementById('expMonth')?.value;
      const income = parseFloat(document.getElementById('expIncome')?.value) || 0;
      if (!month) { alert('Please select a month.'); return; }

      const categories = {};
      EXPENSE_CATEGORIES.forEach(cat => {
        const val = parseFloat(document.getElementById('expCat_' + cat.key)?.value) || 0;
        if (val > 0) categories[cat.key] = val;
      });
      const notes = document.getElementById('expNotes')?.value || '';

      AppState.monthlyExpenses = AppState.monthlyExpenses || [];
      AppState.monthlyExpenses = AppState.monthlyExpenses.filter(e => e.month !== month);
      AppState.monthlyExpenses.push({ id: Date.now(), month, income, categories, notes });
      AppState.monthlyExpenses.sort((a, b) => a.month.localeCompare(b.month));
      AppState.save();
      form.reset();
      this.renderExpenses();
      UI.showToast('✅ Expenses logged for ' + month);
    });
  },

  renderExpenseSummaryCard() {
    const el = document.getElementById('expenseSummaryCard');
    if (!el) return;
    const expenses = AppState.monthlyExpenses || [];
    if (!expenses.length) {
      el.innerHTML = '<div style="color:var(--text-muted);font-size:12px;text-align:center;padding:14px 0;">Log monthly expenses to see your savings rate and averages.</div>';
      return;
    }
    const totalInc = expenses.reduce((s, e) => s + (e.income || 0), 0);
    const totalExp = expenses.reduce((s, e) => s + Object.values(e.categories || {}).reduce((a, b) => a + b, 0), 0);
    const avgInc   = totalInc / expenses.length;
    const avgExp   = totalExp / expenses.length;
    const avgSav   = avgInc - avgExp;
    const savRate  = totalInc > 0 ? (((totalInc - totalExp) / totalInc) * 100).toFixed(0) : 0;
    const savColor = avgSav >= 0 ? 'var(--accent-green)' : 'var(--accent-rose)';

    const catTotals = {};
    EXPENSE_CATEGORIES.forEach(c => { catTotals[c.key] = 0; });
    expenses.forEach(e => Object.entries(e.categories || {}).forEach(([k, v]) => { catTotals[k] = (catTotals[k] || 0) + v; }));
    const topCat = EXPENSE_CATEGORIES.find(c => catTotals[c.key] === Math.max(...Object.values(catTotals)));

    el.innerHTML = `
      <div class="nw-breakdown" style="grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px;">
        <div class="nw-item">
          <div class="nw-item-label">Avg Monthly Income</div>
          <div class="nw-item-value">₹${this._lakh(avgInc)}</div>
        </div>
        <div class="nw-item">
          <div class="nw-item-label">Avg Monthly Expense</div>
          <div class="nw-item-value" style="color:var(--accent-rose);">₹${this._lakh(avgExp)}</div>
        </div>
        <div class="nw-item">
          <div class="nw-item-label">Avg Monthly Savings</div>
          <div class="nw-item-value" style="color:${savColor};">₹${this._lakh(Math.abs(avgSav))}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;background:var(--surface);border-radius:8px;padding:8px 12px;">
        <span style="font-size:12px;color:var(--text-muted);">Overall Savings Rate</span>
        <span style="font-size:16px;font-weight:700;font-family:'Space Mono',monospace;color:${savColor};">${savRate}%</span>
      </div>
      ${topCat ? `<div style="margin-top:8px;font-size:11px;color:var(--text-muted);">Top expense: <strong style="color:var(--text);">${topCat.icon} ${topCat.label}</strong> (₹${this._lakh(catTotals[topCat.key])} total across all months)</div>` : ''}`;
  },

  renderExpenseLog() {
    const tbody = document.getElementById('expenseLogBody');
    if (!tbody) return;
    const expenses = [...(AppState.monthlyExpenses || [])].reverse();
    if (!expenses.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-td">No expense entries yet. Log your first month above.</td></tr>';
      return;
    }
    tbody.innerHTML = expenses.map(e => {
      const totalExp   = Object.values(e.categories || {}).reduce((s, v) => s + v, 0);
      const savings    = (e.income || 0) - totalExp;
      const savingsRate = e.income > 0 ? ((savings / e.income) * 100).toFixed(0) : 0;
      const savColor   = savings >= 0 ? 'var(--accent-green)' : 'var(--accent-rose)';
      return `
        <tr>
          <td>${e.month}</td>
          <td class="num">₹${this._lakh(e.income || 0)}</td>
          <td class="num" style="color:var(--accent-rose);">₹${this._lakh(totalExp)}</td>
          <td class="num" style="color:${savColor};font-weight:600;">₹${this._lakh(Math.abs(savings))}${savings < 0 ? ' <span style="font-size:10px;">(deficit)</span>' : ''}</td>
          <td>
            <span style="font-size:11px;color:${savColor};font-weight:600;">${savingsRate}% saved</span>
            <button class="btn-xs btn-danger" style="margin-left:6px;" data-exp-del="${e.id}">✕</button>
          </td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('[data-exp-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        AppState.monthlyExpenses = (AppState.monthlyExpenses || []).filter(e => String(e.id) !== btn.dataset.expDel);
        AppState.save();
        this.renderExpenses();
      });
    });
  },

  renderOverviewChart() {
    const canvas = document.getElementById('finOverviewChart');
    if (!canvas) return;
    const expenses    = AppState.monthlyExpenses || [];
    const totalWealth = this.calculateTrueWealth();
    const totalInvested = this.getTotalInvested();

    if (!expenses.length && totalWealth === 0) { canvas.style.display = 'none'; return; }
    canvas.style.display = 'block';

    const totalInc = expenses.reduce((s, e) => s + (e.income || 0), 0);
    const totalExp = expenses.reduce((s, e) => s + Object.values(e.categories || {}).reduce((a, b) => a + b, 0), 0);
    const totalSav = Math.max(totalInc - totalExp, 0);

    const values = [totalInc, totalExp, totalSav, totalWealth];
    const labels = ['Total Income', 'Total Expenses', 'Net Savings', 'Portfolio Wealth'];
    const colors = ['rgba(0,212,124,0.8)', 'rgba(255,92,128,0.8)', 'rgba(91,127,255,0.8)', 'rgba(0,212,200,0.8)'];
    const borders= ['#00d47c', '#ff5c80', '#5b7fff', '#00d4c8'];

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const textColor = isDark ? '#697098' : '#5a6380';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

    const ctx = canvas.getContext('2d');
    if (window.finOverviewChartInstance) window.finOverviewChartInstance.destroy();

    window.finOverviewChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderColor: borders,
          borderWidth: 2,
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => {
                const val = ctx.parsed.y;
                const total = values.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                return `₹${val.toLocaleString('en-IN')} (${pct}% of all)`;
              }
            }
          }
        },
        scales: {
          y: { beginAtZero: true, ticks: { color: textColor, font: { size: 10 }, callback: v => '₹' + this._lakh(v) }, grid: { color: gridColor } },
          x: { ticks: { color: textColor, font: { size: 10 } }, grid: { display: false } }
        }
      }
    });
  },

  renderExpenseChart() {
    const canvas = document.getElementById('expenseChart');
    if (!canvas) return;
    const expenses = AppState.monthlyExpenses || [];
    if (!expenses.length) { canvas.style.display = 'none'; return; }
    canvas.style.display = 'block';

    const totals = {};
    EXPENSE_CATEGORIES.forEach(c => { totals[c.key] = 0; });
    expenses.forEach(e => Object.entries(e.categories || {}).forEach(([k, v]) => { totals[k] = (totals[k] || 0) + v; }));

    const visible = EXPENSE_CATEGORIES.filter(c => totals[c.key] > 0);
    const labels  = visible.map(c => c.label);
    const data    = visible.map(c => totals[c.key]);
    const colors  = ['#5b7fff','#00d4c8','#ff9933','#00d47c','#a56eff','#ff5c80','#ffc107','#00b8a8','#8b5cf6','#ec4899'];
    const isDark  = document.documentElement.getAttribute('data-theme') !== 'light';

    const ctx = canvas.getContext('2d');
    if (window.expenseChartInstance) window.expenseChartInstance.destroy();
    window.expenseChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: isDark ? '#141a32' : '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: isDark ? '#e8ecf8' : '#0a0e24', font: { size: 10 }, padding: 8 } },
          tooltip: {
            callbacks: {
              label: ctx => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                return `₹${ctx.parsed.toLocaleString('en-IN')} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  },

  // ═══ Helpers ══════════════════════════════════════════════

  _lakh(n) {
    if (!n && n !== 0) return '0';
    const abs = Math.abs(Math.round(n));
    if (abs >= 1e7) return (n / 1e7).toFixed(1) + 'Cr';
    if (abs >= 1e5) return (n / 1e5).toFixed(1) + 'L';
    return Math.round(n).toLocaleString('en-IN');
  },
};
