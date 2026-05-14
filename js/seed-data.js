// ============================================================
// ATHENA — Seed Data (runs once after AppState.init)
// Adds pre-populated investment entries if they don't exist.
// Safe to re-run: checks by a unique seed key before inserting.
// ============================================================

const SeedData = {

  // Each entry has a unique seedId so it is only inserted once.
  // Add new entries here; existing stored data is never touched.
  _investments: [
    {
      seedId:          'epf_gxs_2022',
      type:            'EPF',
      bankAccount:     'GXS India Tech Centre',
      amount:          8795,
      openingBalance:  0,
      date:            '2022-08-01',
      interestRate:    8.25,
      tenure:          30,
      status:          'active',
      notes:           'UAN: PYKRP00353890000014683',
      insuranceType:   '',
      coverAmount:     0,
      premiumFrequency:'',
      maturityDate:    '',
      ticker: '', units: 0, amfiCode: '', livePrice: 0, livePriceFetched: '',
      withdrawnAmount: 0, withdrawalDate: '',
      epfLog: [
        // FY 2024-25 — current GXS account (fresh start after old account withdrawal+transfer)
        // Old account (Mumbai PYBOM00186940000110887) history totalled ₹73,547 emp + ₹73,547 er
        // which was transferred in via the 2025-01 transfer entry below.
        { month: '2024-03', employee:   632, employer:   632, type: 'contribution', note: 'Partial month restart' },
        { month: '2024-04', employee:  6107, employer:  6107, type: 'contribution', note: 'Salary increment' },
        { month: '2024-05', employee:  6320, employer:  6320, type: 'contribution', note: '' },
        { month: '2024-06', employee:  6320, employer:  6320, type: 'contribution', note: '' },
        { month: '2024-07', employee:  6320, employer:  6320, type: 'contribution', note: '' },
        { month: '2024-08', employee:  6320, employer:  6320, type: 'contribution', note: '' },
        { month: '2024-09', employee:  6320, employer:  6320, type: 'contribution', note: '' },
        { month: '2024-10', employee:  6320, employer:  6320, type: 'contribution', note: '' },
        { month: '2024-11', employee:  6320, employer:  6320, type: 'contribution', note: '' },
        { month: '2024-12', employee:  6320, employer:  6320, type: 'contribution', note: '' },
        { month: '2025-01', employee: 73547, employer: 73547, type: 'transfer',     note: 'Transfer from Mumbai account PYBOM00186940000110887' },
        { month: '2025-01', employee:  6320, employer:  6320, type: 'contribution', note: '' },
        { month: '2025-02', employee:  4551, employer:  4551, type: 'transfer',     note: 'Transfer interest from old account' },
        { month: '2025-02', employee:  7945, employer:  7945, type: 'contribution', note: 'Salary increment' },
        { month: '2025-03', employee:  7945, employer:  7945, type: 'contribution', note: '' },
        { month: '2025-03', employee:  4432, employer:  4432, type: 'interest',     note: 'Interest FY 2024-25' },
        // FY 2025-26
        { month: '2025-04', employee:  7945, employer:  7945, type: 'contribution', note: '' },
        { month: '2025-05', employee:  7945, employer:  7945, type: 'contribution', note: '' },
        { month: '2025-06', employee:  7945, employer:  7945, type: 'contribution', note: '' },
        { month: '2025-07', employee:  7945, employer:  7945, type: 'contribution', note: '' },
        { month: '2025-08', employee:  7945, employer:  7945, type: 'contribution', note: '' },
        { month: '2025-09', employee:  7945, employer:  7945, type: 'contribution', note: '' },
        { month: '2025-10', employee:  7945, employer:  7945, type: 'contribution', note: '' },
        { month: '2025-11', employee:  7945, employer:  7945, type: 'contribution', note: '' },
        { month: '2025-12', employee:  7945, employer:  7945, type: 'contribution', note: '' },
        // FY 2026 (current)
        { month: '2026-01', employee:  7945, employer:  7945, type: 'contribution', note: '' },
        { month: '2026-02', employee:  8795, employer:  8795, type: 'contribution', note: 'Salary increment' },
        { month: '2026-03', employee:  8795, employer:  8795, type: 'contribution', note: '' },
        { month: '2026-04', employee:  8795, employer:  8795, type: 'contribution', note: '' },
      ],
    },
  ],

  _cleanNonEPFSeeds() {
    // Remove all seeded entries except EPF — runs once on migration
    const keepIds = new Set(["epf_gxs_2022"]);
    const before = AppState.investments.length;
    AppState.investments = AppState.investments.filter(i =>
      !i.seedId || keepIds.has(i.seedId)
    );
    const removed = before - AppState.investments.length;
    if (removed > 0) { AppState.save(); console.log("SeedData: removed", removed, "non-EPF entries"); }
  },

  // Stable numeric IDs for all seed entries (never change, so delete always works)
  _stableId(seedId) {
    let h = 5381;
    for (let i = 0; i < seedId.length; i++) h = ((h << 5) + h) ^ seedId.charCodeAt(i);
    return Math.abs(h) % 9000000 + 1000000; // always 7-digit positive int
  },

  // Remove unseeded duplicates so each type/ticker only appears once.
  // Called once per device (tracked by AppState._seedCleanV).
  _dedup() {
    const before = AppState.investments.length;

    // Build sets of what is seeded
    const seededTypes    = new Set(this._investments.map(s => s.type));
    const seededTickers  = new Set(this._investments.filter(s => s.type === 'Shares').map(s => s.ticker));
    const seededSIPNames = new Set(this._investments.filter(s => s.type === 'SIP').map(s => s.bankAccount));
    const seededInsNames = new Set(this._investments.filter(s => s.type === 'Insurance').map(s => s.bankAccount));

    AppState.investments = AppState.investments.filter(inv => {
      if (inv.seedId) return true;          // already seeded → keep
      const t = inv.type;
      // Single-account types: only remove if a seed exists for that type.
      // PPF has no seed entry, so user-created PPF is always preserved.
      if ((t === 'PPF' || t === 'EPF') && seededTypes.has(t)) return false;
      // Shares: remove if same ticker is seeded
      if (t === 'Shares' && seededTickers.has(inv.ticker)) return false;
      // SIP: remove if same fund name is seeded
      if (t === 'SIP' && seededSIPNames.has(inv.bankAccount)) return false;
      // Insurance: remove if same company is seeded
      if (t === 'Insurance' && seededInsNames.has(inv.bankAccount)) return false;
      return true;  // user-created entry, keep it
    });

    const removed = before - AppState.investments.length;
    if (removed > 0) console.log(`✅ SeedData: removed ${removed} duplicate unseeded entries`);
  },

  // localStorage key that remembers which seeds have been applied.
  // Entries in this set are NEVER re-inserted — even if the user deletes them.
  _APPLIED_KEY: 'athena_seeds_applied_v1',

  _loadApplied() {
    try { return new Set(JSON.parse(localStorage.getItem(this._APPLIED_KEY) || '[]')); }
    catch { return new Set(); }
  },

  _saveApplied(set) {
    try { localStorage.setItem(this._APPLIED_KEY, JSON.stringify([...set])); } catch {}
  },

  apply() {
    AppState.investments = AppState.investments || [];

    // Load the "already applied" ledger — persists across page refreshes
    const applied = this._loadApplied();

    // One-time removal of non-EPF seed entries
    if (!applied.has('__nonepf_cleaned_v1')) {
      this._cleanNonEPFSeeds();
      applied.add('__nonepf_cleaned_v1');
    }

    // ── One-time de-duplication of old unseeded duplicates ────────────
    if (!applied.has('__dedup_v2')) {
      this._dedup();
      applied.add('__dedup_v2');
      AppState.save();
    }

    // ── EPF migration: upgrade old openingBalance entry to epfLog ─────
    const epfSeed = this._investments.find(s => s.seedId === 'epf_gxs_2022');
    if (epfSeed) {
      const existingEPF = AppState.investments.find(i => i.seedId === 'epf_gxs_2022');
      if (existingEPF && (!existingEPF.epfLog || existingEPF.epfLog.length === 0)) {
        existingEPF.epfLog         = epfSeed.epfLog;
        existingEPF.openingBalance = 0;
        existingEPF.amount         = epfSeed.amount;
        console.log('SeedData: migrated EPF to monthly log');
      }
    }

    // ── Sync ledger with any seeds already in AppState (e.g. from prior sessions) ─
    AppState.investments.forEach(i => { if (i.seedId) applied.add(i.seedId); });

    // ── Insert only seeds NOT yet applied ────────────────────────────
    // Once a seedId is in applied, it is NEVER re-inserted — user deletes are final.
    let added = 0;
    for (const entry of this._investments) {
      if (applied.has(entry.seedId)) continue;
      AppState.investments.push({ id: this._stableId(entry.seedId), ...entry });
      applied.add(entry.seedId);
      added++;
    }

    if (added > 0) {
      AppState.save();
      console.log(`SeedData: inserted ${added} investment(s)`);
    }

    // Always persist the applied ledger so user deletions survive refresh
    this._saveApplied(applied);
  },
};
