// ============================================================
// Skadi — Growth Tracker
// Career · Books · Reviews · Life Partner
// ============================================================

// ── Tech Upskilling — Compressed 76-Week Plan (~350h at 4.5h/week) ──
const DEVOPS_PLAN = [
  {
    id: 'p1', label: 'Docker Foundations',
    period: 'Wk 1–2 · Jul 13–26 · ~9h',
    color: '#0ea5e9', commitment: '4.5h/week',
    target: 'Docker for Beginners — KodeKloud',
    summary: 'Images, containers, volumes, networking, multi-stage builds.',
    chapters: [
      { id: 'p1_c1', code: '1.1', label: 'Docker Architecture — images, containers, daemon, registry', gap: 'Foundational' },
      { id: 'p1_c2', code: '1.2', label: 'Volumes & Persistent Data', gap: 'HIGH' },
      { id: 'p1_c3', code: '1.3', label: 'Docker Networking — bridge, overlay, DNS', gap: 'HIGH' },
      { id: 'p1_c4', code: '1.4', label: 'Multi-Stage Builds & Layer Optimisation', gap: 'HIGH' },
    ],
    resources: [
      { label: 'Docker for Beginners — KodeKloud', url: 'https://kodekloud.com', star: true },
    ],
  },
  {
    id: 'p2', label: 'Kubernetes Core + CKA',
    period: 'Wk 3–12 · Jul 27–Oct 4 · ~45h',
    color: '#7b42bc', commitment: '4.5h/week · CKA exam Wk 10–12',
    target: 'CKA Certification — KodeKloud + killer.sh',
    summary: 'K8s fundamentals through CKA deep prep. Mock exams and sit exam by Oct 2026.',
    chapters: [
      { id: 'p2_c1', code: '2.1', label: 'Kubernetes core concepts (Wk 3–5)', gap: 'CRITICAL' },
      { id: 'p2_c2', code: '2.2', label: 'CKA deep prep — scheduling, networking, storage (Wk 6–9)', gap: 'CRITICAL' },
      { id: 'p2_c3', code: '2.3', label: 'CKA mock exams + sit exam (Wk 10–12)', gap: 'EXAM' },
    ],
    resources: [
      { label: 'CKA Certification Course — KodeKloud', url: 'https://kodekloud.com', star: true },
      { label: 'killer.sh — CKA simulator', url: 'https://killer.sh', star: true },
    ],
  },
  {
    id: 'p3', label: 'OpenShift',
    period: 'Wk 13–18 · Oct 5–Nov 15 · ~27h',
    color: '#ef4444', commitment: '4.5h/week',
    target: 'OpenShift fundamentals + advanced — Udemy + KodeKloud',
    summary: 'OCP foundations then advanced OCP 4 topics.',
    chapters: [
      { id: 'p3_c1', code: '3.1', label: 'OpenShift fundamentals (Wk 13–15)', gap: 'BUILDING' },
      { id: 'p3_c2', code: '3.2', label: 'OpenShift 4 advanced (Wk 16–18)', gap: 'DEPTH' },
    ],
    resources: [
      { label: 'OpenShift for Absolute Beginners — Udemy', url: 'https://udemy.com', star: true },
      { label: 'OpenShift 4 — KodeKloud', url: 'https://kodekloud.com' },
    ],
  },
  {
    id: 'p4', label: 'Groovy + Jenkins + ArgoCD',
    period: 'Wk 19–30 · Nov 16–Feb 7 · ~54h',
    color: '#f59e0b', commitment: '4.5h/week',
    target: 'Groovy → Jenkins pipelines → ArgoCD GitOps',
    summary: 'CI/CD pipeline mastery: Groovy DSL, Jenkins shared libraries, ArgoCD fundamentals + advanced.',
    chapters: [
      { id: 'p4_c1', code: '4.1', label: 'Groovy language (Wk 19–21)', gap: 'HIGH' },
      { id: 'p4_c2', code: '4.2', label: 'Jenkins pipelines + shared libraries (Wk 22–24)', gap: 'CRITICAL' },
      { id: 'p4_c3', code: '4.3', label: 'ArgoCD fundamentals (Wk 25–27)', gap: 'CRITICAL' },
      { id: 'p4_c4', code: '4.4', label: 'ArgoCD advanced + hands-on project (Wk 28–30)', gap: 'DEPTH' },
    ],
    resources: [
      { label: 'Groovy for Developers — Udemy', url: 'https://udemy.com', star: true },
      { label: 'Jenkins CI/CD Pipelines w/ Groovy DSL — Udemy', url: 'https://udemy.com', star: true },
      { label: 'GitOps with ArgoCD — KodeKloud', url: 'https://kodekloud.com', star: true },
    ],
  },
  {
    id: 'p5', label: 'Terraform + AWS SAA',
    period: 'Wk 31–44 · Feb 8–May 16 · ~63h',
    color: '#00d47c', commitment: '4.5h/week · Terraform cert Wk 34–36 · AWS SAA Wk 43–44',
    target: 'Terraform Associate + AWS SAA certifications',
    summary: 'IaC with Terraform then full AWS Solutions Architect path.',
    chapters: [
      { id: 'p5_c1', code: '5.1', label: 'Terraform fundamentals (Wk 31–33)', gap: 'HIGH' },
      { id: 'p5_c2', code: '5.2', label: 'Terraform Associate prep + exam (Wk 34–36)', gap: 'EXAM' },
      { id: 'p5_c3', code: '5.3', label: 'AWS IAM, EC2, VPC (Wk 37–39)', gap: 'CRITICAL' },
      { id: 'p5_c4', code: '5.4', label: 'AWS storage, DB, HA, serverless (Wk 40–42)', gap: 'HIGH' },
      { id: 'p5_c5', code: '5.5', label: 'AWS SAA exam prep + sit exam (Wk 43–44)', gap: 'EXAM' },
    ],
    resources: [
      { label: 'AWS Workshop with Terraform — KodeKloud', url: 'https://kodekloud.com', star: true },
      { label: 'AWS SAA — KodeKloud', url: 'https://kodekloud.com', star: true },
    ],
  },
  {
    id: 'p6', label: 'Adv Python + Networking + Service Mesh',
    period: 'Wk 45–54 · May 17–Jul 25 · ~45h',
    color: '#3b82f6', commitment: '4.5h/week',
    target: 'Python DevOps → Networking → Istio + 3scale',
    summary: 'Advanced Python automation, networking fundamentals, Istio service mesh, 3scale API management.',
    chapters: [
      { id: 'p6_c1', code: '6.1', label: 'Advanced Python for DevOps (Wk 45–48)', gap: 'HIGH' },
      { id: 'p6_c2', code: '6.2', label: 'Networking fundamentals — TCP/IP, DNS, HTTP (Wk 49)', gap: 'FOUNDATIONAL' },
      { id: 'p6_c3', code: '6.3', label: 'Istio service mesh (Wk 50–52)', gap: 'HIGH' },
      { id: 'p6_c4', code: '6.4', label: '3scale + advanced mesh (Wk 53–54)', gap: 'DEPTH' },
    ],
    resources: [
      { label: 'Python for DevOps — Udemy', url: 'https://udemy.com', star: true },
      { label: 'Istio Hands-on Fundamentals — Udemy', url: 'https://udemy.com', star: true },
    ],
  },
  {
    id: 'p7', label: 'Observability + Security',
    period: 'Wk 55–63 · Jul 26–Sep 26 · ~40h',
    color: '#f97316', commitment: '4.5h/week',
    target: 'Prometheus/Grafana → Vault → Container Security',
    summary: 'Full observability stack plus secrets management and supply chain security.',
    chapters: [
      { id: 'p7_c1', code: '7.1', label: 'Prometheus + PromQL (Wk 55–57)', gap: 'HIGH' },
      { id: 'p7_c2', code: '7.2', label: 'Grafana + OpenTelemetry basics (Wk 58–59)', gap: 'HIGH' },
      { id: 'p7_c3', code: '7.3', label: 'Vault secrets management (Wk 60–62)', gap: 'HIGH' },
      { id: 'p7_c4', code: '7.4', label: 'Container scanning (Trivy) + OPA (Wk 63)', gap: 'BUILDING' },
    ],
    resources: [
      { label: 'PCA — KodeKloud', url: 'https://kodekloud.com', star: true },
      { label: 'HashiCorp Vault — Udemy', url: 'https://udemy.com', star: true },
    ],
  },
  {
    id: 'p8', label: 'System Design + GenAI + PSM I',
    period: 'Wk 64–76 · Sep 27–Dec 27 · ~58h',
    color: '#a78bfa', commitment: '4.5h/week · PSM I exam Wk 74',
    target: 'System Design → GenAI for DevOps → PSM I cert',
    summary: 'Architecture interviews, AI-augmented DevOps, and Scrum certification.',
    chapters: [
      { id: 'p8_c1', code: '8.1', label: 'System Design fundamentals (Wk 64–66)', gap: 'HIGH' },
      { id: 'p8_c2', code: '8.2', label: 'System Design mocks + portfolio (Wk 67–68)', gap: 'DEPTH' },
      { id: 'p8_c3', code: '8.3', label: 'GenAI for DevOps (Wk 69–71)', gap: 'BUILDING' },
      { id: 'p8_c4', code: '8.4', label: 'Advanced GenAI — RAG, agents (Wk 72–73)', gap: 'DEPTH' },
      { id: 'p8_c5', code: '8.5', label: 'PSM I prep + sit exam (Wk 74)', gap: 'EXAM' },
      { id: 'p8_c6', code: '8.6', label: 'Buffer / catch-up / revision (Wk 75–76)', gap: 'SUSTAINING' },
    ],
    resources: [
      { label: 'System Design Masterclass — Udemy', url: 'https://udemy.com', star: true },
      { label: 'Generative AI for DevOps Engineers — Udemy', url: 'https://udemy.com', star: true },
      { label: 'PSM I Certification Training — Udemy', url: 'https://udemy.com', star: true },
    ],
  },
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
  'Pastime: any relapses this week? (1=multiple, 5=clean week)',
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
  { id: 'pastime',    label: 'Pastime',     q: 'Total relapses? Trigger pattern identified? Environment changed?' },
  { id: 'loneliness', label: 'Loneliness',  q: 'Isolation moments? What helped? What needs changing?' },
  { id: 'personal',   label: 'Personal',    q: 'Natural contact with her? Called parents consistently?' },
  { id: 'mental',     label: 'Mental',      q: 'Burning out? Need rest day? What am I grateful for?' },
  { id: 'exit_clock', label: 'Exit Clock',  q: 'Months to Jun 1, 2027 notice date? On track for clean exit?' }
];

// ── Behavioral Round — Story Bank (real wins, STAR-ready) ─
const STORY_BANK = [
  { label: '⚙️ Technical Win',       text: '5h → 1.5h build time (70% reduction) — ZENworks macOS agent pipeline, achieved via profiling and parallelisation of Maven/Bash build stages.' },
  { label: '💡 Innovation',          text: 'Built a RAG-based documentation tool that cut new-hire onboarding from 3 weeks to 1 week. Built an LLM-powered pipeline log investigator that cut triage time by 40%.' },
  { label: '🧭 Leadership',          text: 'Built a Power Automate flow that reduced DevOps request turnaround by 63% (3.5 days → 1.3 days). Served as Scrum Master.' },
  { label: '🤝 Cross-team Impact',   text: 'Standardised code-signing across business units, cutting related incidents by 40%. Led a zero-data-loss migration of 10+ repos from GitHub to GitLab.' },
];

// ── Habit Stack Rollout — 5 stacks, 2-week implementation windows (Jul–Aug 2026) ─
// Auto-locks once a window closes if the underlying daily routine was completed
// on ≥10 of the 14 days (a "good day" = ≥70% of that day's schedule checked off).
const HABIT_STACKS = [
  { id: 'stack1', emoji: '🌅', label: 'Stack 1 — Morning Anchor', window: 'Wk 1–2 · Jul 1–14, 2026', start: '2026-07-01', end: '2026-07-14',
    desc: '6:00 AM wake → breakfast prep → set the day’s intention.' },
  { id: 'stack2', emoji: '💻', label: 'Stack 2 — Evening Tech', window: 'Wk 3–4 · Jul 15–28, 2026', start: '2026-07-15', end: '2026-07-28',
    desc: '6:00 PM tech study session — Mon / Wed / Thu.' },
  { id: 'stack3', emoji: '🍳', label: 'Stack 3 — Cooking Split', window: 'Wk 3–4 · Jul 15–28, 2026', start: '2026-07-15', end: '2026-07-28',
    desc: 'Dinner prep + cleanup, split into a repeatable routine.' },
  { id: 'stack4', emoji: '📖', label: 'Stack 4 — UPSC Anchor', window: 'Wk 5–6 · Jul 29 – Aug 11, 2026', start: '2026-07-29', end: '2026-08-11',
    desc: '8:00 PM UPSC block → break at 9:30 PM → revision until 11:30 PM.' },
  { id: 'stack5', emoji: '🗒️', label: 'Stack 5 — Weekend Review', window: 'Wk 7–8 · Aug 12–25, 2026', start: '2026-08-12', end: '2026-08-25',
    desc: 'Saturday chores + weekly review · Sunday planning for the week ahead.' },
];

// ── Reward System (optional, read-only) ──────────────────
const REWARD_TIERS = [
  { tier: 'Weekly',    trigger: 'Hit your weekly UPSC + tech study targets (Coach Dashboard all green).',          reward: 'A favourite meal, a movie night, or a few guilt-free hours of downtime.' },
  { tier: 'Monthly',   trigger: 'Complete the month’s syllabus slice + habit stacks on track.',                reward: 'Something small you’ve been wanting — a book, a gadget accessory, a nice coffee run.' },
  { tier: 'Quarterly', trigger: 'Complete a DevOps plan phase or UPSC subject block on schedule.',                    reward: 'A bigger treat — a day trip, a nice dinner out, a half-day off.' },
  { tier: 'Milestone', trigger: 'Major milestones — Prelims cleared, Mains written, return to India.',               reward: 'A big reward — a trip home, a meaningful purchase, real celebration.' },
];

// ── Weekly Burnout Check — traffic-light thresholds ───────
const BURNOUT_CHECKS = [
  { metric: 'Sleep avg',       green: '≥ 7 hrs',                      yellow: '6–7 hrs',              red: '< 6 hrs',                  action: 'Protect the wind-down window; cut evening screens — sleep beats one extra revision pass.' },
  { metric: 'Energy at desk',  green: 'Focused, steady',                   yellow: 'Afternoon dips',        red: 'Constant fatigue',         action: 'Take a half-day off; review workload; short walk + protein-forward meals.' },
  { metric: 'Social contact',  green: 'Regular (friends/family/partner)',  yellow: 'Occasional',            red: 'Isolated > 1 week',        action: 'Reach out today — message parents, partner, or a friend. Don’t wait to "feel like it".' },
  { metric: 'Exercise',        green: '4+ sessions/week',                  yellow: '2–3 sessions/week',     red: '0–1 sessions/week',        action: 'Re-anchor the morning habit stack; even a 15-min walk counts — restart small.' },
  { metric: 'Learning quality', green: 'Retaining & applying material',    yellow: 'Surface-level reading', red: 'Re-reading, no retention', action: 'Switch to active recall / teach-back; take a rest day rather than push through.' },
];

// ── Predictable Crisis Points & Fixes ─────────────────────
const CRISIS_POINTS = [
  { crisis: 'Habit Friction',              timing: 'Month 1–2',  symptom: 'New routines feel exhausting; easy to skip "just today".',                  fix: 'Don’t add new habits until the current stack is automatic. Follow the 10/14-day rollout order — one stack at a time.' },
  { crisis: 'Learning Plateau',            timing: 'Month 3–4',  symptom: 'Hours logged but progress feels stuck — UPSC and tech both feel "stale".',    fix: 'Switch method, not subject — active recall, teach-back, past-paper questions. Revisit fundamentals before adding new material.' },
  { crisis: 'Work Chaos',                  timing: 'Month 5–6',  symptom: 'Job demands spike right before the exit/Dubai transition.',                   fix: 'Protect the UPSC block as non-negotiable. Communicate boundaries early; use leave strategically, not reactively.' },
  { crisis: 'Decision Doubt',              timing: 'Month 8–10', symptom: 'Second-guessing the UPSC path; comparing your progress to others.',          fix: 'Revisit your original why. The plan was made with the best information available. One conversation with a mentor beats a week of rumination.' },
  { crisis: 'Mock Exam Failure',           timing: 'Any time',   symptom: 'A bad mock score triggers a confidence spiral.',                              fix: 'One mock ≠ the real exam. Do error analysis, not self-judgment — log the weak areas and adjust the next cycle’s plan.' },
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
    this.renderTechPlan();
    this.renderTechSummary();
    this.renderHabitStacks();
    this.renderStoryBank();
    this.renderRewardSystem();
    this.renderBurnoutCheck();
    this.renderCrisisCard();
    this.renderBooks();
    this.renderAutoReview();
    this.renderPartnerLog();
    this.renderWeeklyReviewChart();
  },

  // ── Collapsible info-card helper — preserves open/closed state across re-renders ──
  _renderCollapsible(containerId, icon, title, bodyHtml, defaultOpen = false) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!el.dataset.built) {
      el.dataset.built = '1';
      el.classList.add('gx-card');
      if (!defaultOpen) el.classList.add('collapsed');
      el.innerHTML = `
        <div class="gx-card-hdr" data-gx-toggle>
          <span class="gx-card-title">${icon} ${esc(title)}</span>
          <span class="gx-chev">▼</span>
        </div>
        <div class="gx-card-body"></div>`;
      el.querySelector('[data-gx-toggle]').addEventListener('click', () => el.classList.toggle('collapsed'));
    }
    el.querySelector('.gx-card-body').innerHTML = bodyHtml;
  },

  _dateKey(d) {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  },

  // ── Behavioral Round — Story Bank ────────────────────────
  renderStoryBank() {
    const body = STORY_BANK.map(s => `
      <div class="story-row">
        <div class="story-label">${s.label}</div>
        <div class="story-text">${esc(s.text)}</div>
      </div>`).join('');
    this._renderCollapsible('storyBankCard', '🏆', 'Behavioral Round — Story Bank', body, false);
  },

  // ── Habit Stack Rollout ───────────────────────────────────
  renderHabitStacks() {
    const log   = AppState.habitStacks || {};
    const hist  = AppState.dailyHistory || {};
    const today = AppState.getTodayKey();

    const rows = HABIT_STACKS.map(stack => {
      let goodDays = 0;
      for (let d = new Date(stack.start + 'T00:00:00'); this._dateKey(d) <= stack.end; d.setDate(d.getDate() + 1)) {
        const rec = hist[this._dateKey(d)];
        if (rec && rec.total > 0 && (rec.completed / rec.total) >= 0.7) goodDays++;
      }
      const windowDone  = today > stack.end;
      const autoLocked  = windowDone && goodDays >= 10;
      const checked     = !!log[stack.id] || autoLocked;

      return `
        <div class="hs-row">
          <button class="tp-chk${checked ? ' on' : ''}" data-habit-stack="${esc(stack.id)}" ${autoLocked ? 'disabled' : ''}>${checked ? '✓' : ''}</button>
          <div class="hs-info">
            <div class="hs-name">${stack.emoji} ${esc(stack.label)}</div>
            <div class="hs-meta">${esc(stack.window)} — ${esc(stack.desc)}</div>
            ${windowDone ? `<div class="hs-streak">${autoLocked ? '🔒 Auto-locked · ' : ''}${goodDays}/14 good days</div>` : ''}
          </div>
        </div>`;
    }).join('');

    this._renderCollapsible('habitStackCard', '🔄', 'Habit Stack Rollout', `<div class="hs-list">${rows}</div>`, true);

    document.getElementById('habitStackCard')?.querySelectorAll('[data-habit-stack]').forEach(btn => {
      btn.addEventListener('click', () => {
        AppState.habitStacks = AppState.habitStacks || {};
        const id = btn.dataset.habitStack;
        AppState.habitStacks[id] = !AppState.habitStacks[id];
        AppState.save();
        this.renderHabitStacks();
      });
    });
  },

  // ── Reward System (optional, read-only) ─────────────────
  renderRewardSystem() {
    const rows = REWARD_TIERS.map(r => `
      <tr><td><strong>${esc(r.tier)}</strong></td><td>${esc(r.trigger)}</td><td class="notes-td">${esc(r.reward)}</td></tr>`).join('');
    const body = `<div class="data-table-wrap"><table class="data-table">
      <thead><tr><th>Tier</th><th>Trigger</th><th>Reward</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
    this._renderCollapsible('rewardSystemCard', '🎁', 'Reward System', body, false);
  },

  // ── Weekly Burnout Check ──────────────────────────────────
  renderBurnoutCheck() {
    const rows = BURNOUT_CHECKS.map(b => `
      <tr>
        <td><strong>${esc(b.metric)}</strong></td>
        <td class="good">${esc(b.green)}</td>
        <td class="warn">${esc(b.yellow)}</td>
        <td style="color:var(--accent-rose);">${esc(b.red)}</td>
        <td class="notes-td">${esc(b.action)}</td>
      </tr>`).join('');
    const body = `<div class="data-table-wrap"><table class="data-table">
      <thead><tr><th>Metric</th><th>🟢 Green</th><th>🟡 Yellow</th><th>🔴 Red</th><th>Action if Red</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
    this._renderCollapsible('burnoutCheckCard', '🛡️', 'Weekly Burnout Check', body, false);
  },

  // ── Predictable Crisis Points & Fixes ─────────────────────
  renderCrisisCard() {
    const rows = CRISIS_POINTS.map(c => `
      <tr>
        <td><strong>${esc(c.crisis)}</strong><br><span style="font-size:10px;color:var(--text-faint);">${esc(c.timing)}</span></td>
        <td class="notes-td">${esc(c.symptom)}</td>
        <td class="notes-td">${esc(c.fix)}</td>
      </tr>`).join('');
    const body = `<div class="data-table-wrap"><table class="data-table">
      <thead><tr><th>Crisis Point</th><th>Symptom</th><th>Fix</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
    this._renderCollapsible('crisisCard', '⚠️', 'Predictable Crisis Points & Fixes', body, false);
  },

  // ── DevOps Career Elevation Plan ─────────────────────────
  // Total items tracked toward phase progress = chapters.length.
  _semesterItems(sem) {
    return sem.chapters.map(c => c.id);
  },
  _semesterDone(sem, log) {
    return this._semesterItems(sem).filter(id => log[id]?.done).length;
  },

  renderTechPlan() {
    const container = document.getElementById('techPlanContainer');
    if (!container) return;
    const log = AppState.careerLog || {};

    container.innerHTML = DEVOPS_PLAN.map(sem => {
      const items = this._semesterItems(sem);
      const total = items.length;
      const done  = this._semesterDone(sem, log);
      const pct   = total ? Math.round((done / total) * 100) : 0;
      const isComplete = done === total;
      const isActive   = done > 0 && !isComplete;

      const chapterRows = sem.chapters.map(ch => {
        const s = log[ch.id] || {};
        return `<div class="tp-task${s.done ? ' tp-done' : ''}">
          <button class="tp-chk${s.done ? ' on' : ''}" data-phase-task="${esc(ch.id)}">${s.done ? '✓' : ''}</button>
          <span class="tp-tlabel"><strong style="font-family:'Space Mono',monospace;color:${sem.color}">${esc(ch.code)}</strong> ${esc(ch.label)} <span style="font-size:10px;color:var(--text-faint);">[${esc(ch.gap)}]</span></span>
          ${s.done && s.date ? `<span class="tp-tdate">${esc(s.date)}</span>` : ''}
        </div>`;
      }).join('');

      const resourceRows = (sem.resources || []).map(r => {
        const label = `${r.star ? '⭐ ' : ''}${esc(r.label)}`;
        return `<div style="font-size:12px;color:var(--text-muted);line-height:1.7;">${
          r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" style="color:var(--accent-blue);">${label}</a>` : label
        }</div>`;
      }).join('');

      return `
        <div class="tech-phase${isComplete ? ' tp-complete' : isActive ? ' tp-active' : ''}"
             style="--phase-color:${sem.color}">
          <div class="tp-head">
            <div>
              <div class="tp-label">${esc(sem.label)}</div>
              <div class="tp-meta">${esc(sem.period)} &nbsp;·&nbsp; ${esc(sem.commitment)}</div>
            </div>
            <div class="tp-score">${isComplete ? '<span class="tp-tick">✓</span>' : `${done}/${total}`}</div>
          </div>
          <div class="tp-bar"><div class="tp-fill" style="width:${pct}%;background:${sem.color}"></div></div>
          <div style="font-size:11px;color:var(--text-muted);margin:6px 0 4px;line-height:1.5;">${esc(sem.summary)}</div>
          <div style="font-size:11px;font-weight:600;color:${sem.color};margin-bottom:10px;">🎯 ${esc(sem.target)}</div>
          <div class="tp-section-label" style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-top:6px;">Chapters</div>
          <div class="tp-tasks">${chapterRows}</div>
          ${resourceRows ? `
          <div class="tp-section-label" style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-top:10px;">Resources</div>
          <div style="display:flex;flex-direction:column;gap:2px;margin-top:4px;">${resourceRows}</div>
          ` : ''}
        </div>`;
    }).join('');

    container.querySelectorAll('[data-phase-task]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.phaseTask;
        AppState.careerLog = AppState.careerLog || {};
        if (AppState.careerLog[id]?.done) {
          delete AppState.careerLog[id];
        } else {
          AppState.careerLog[id] = { done: true, date: AppState.getTodayKey() };
        }
        AppState.save();
        this.renderTechPlan();
        this.renderTechSummary();
        if (typeof UI !== 'undefined') UI.tryCompletePendingActivity('growth');
      });
    });
  },

  renderTechSummary() {
    const el = document.getElementById('techSummary');
    if (!el) return;
    const log = AppState.careerLog || {};
    el.innerHTML = DEVOPS_PLAN.map(sem => {
      const items = this._semesterItems(sem);
      const total = items.length;
      const done  = this._semesterDone(sem, log);
      const pct   = total ? Math.round((done / total) * 100) : 0;
      const shortLabel = sem.label.split('—')[1]?.trim() || sem.label;
      return `<div class="ts-row">
        <div class="ts-name" style="color:${sem.color}">${esc(shortLabel)}</div>
        <div class="ts-bar"><div class="ts-fill" style="width:${pct}%;background:${sem.color}"></div></div>
        <div class="ts-pct">${done}/${total}</div>
      </div>`;
    }).join('');
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

  // ── Auto Coach Review (replaces manual weekly/monthly forms) ─
  renderAutoReview() {
    if (typeof CoachEngine === 'undefined') return;
    const data = CoachEngine.getAutoReview();

    const cdEl = document.getElementById('coachDashboard');
    if (cdEl) {
      cdEl.innerHTML = data.tips.length
        ? `<div class="cd-tips-list">
             ${data.tips.map(t => `
               <div class="cd-tip">
                 <span class="cd-tip-icon">${t.icon}</span>
                 <div class="cd-tip-text">${t.text}</div>
                 ${t.tab ? `<button class="card-tab-link" data-goto="${t.tab}" style="margin-left:auto;flex-shrink:0;">View →</button>` : ''}
               </div>`).join('')}
           </div>
           <div class="cd-updated">Last computed: ${data.lastUpdated}</div>`
        : '<div class="empty-state">No tips right now — all systems look good.</div>';

      cdEl.querySelectorAll('.card-tab-link[data-goto]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (typeof UI !== 'undefined') UI._navigateToTab(btn.dataset.goto);
        });
      });
    }

    const mgsEl = document.getElementById('monthlyGrowthSummary');
    if (mgsEl) {
      mgsEl.innerHTML = data.domains.map(d => `
        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="font-size:13px;font-weight:600;color:var(--text);">${d.label}</span>
              ${d.tab ? `<button class="card-tab-link cd-nav" data-goto="${d.tab}" style="font-size:10px;">→</button>` : ''}
            </div>
            <span style="font-size:14px;font-weight:700;color:${d.color};">${d.score}</span>
          </div>
          <div style="background:var(--border);border-radius:4px;height:6px;overflow:hidden;">
            <div style="width:${d.score}%;height:100%;background:${d.color};border-radius:4px;transition:width 0.4s ease;"></div>
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:3px;">${d.note}</div>
        </div>`).join('');

      mgsEl.querySelectorAll('.cd-nav[data-goto]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (typeof UI !== 'undefined') UI._navigateToTab(btn.dataset.goto);
        });
      });
    }
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

  // ── Study Hours — Last 7 Days bar chart ──────────────────
  renderWeeklyReviewChart() {
    const canvas = document.getElementById('weeklyReviewChart');
    if (!canvas || typeof CoachEngine === 'undefined') return;

    const hours   = CoachEngine._studyHours(7).reverse(); // oldest first
    const today   = new Date();
    const labels  = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString('en-IN', { weekday: 'short' }));
    }

    if (window.weeklyReviewChartInstance) { window.weeklyReviewChartInstance.destroy(); }

    const isDark    = document.documentElement.getAttribute('data-theme') !== 'light';
    const textColor = isDark ? '#697098' : '#5a6380';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const goalH     = parseFloat(localStorage.getItem('skadi_study_goal') || '4');

    window.weeklyReviewChartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Hours studied',
          data: hours,
          backgroundColor: hours.map(h =>
            h >= goalH ? 'rgba(0,212,124,0.75)'
            : h >= goalH * 0.5 ? 'rgba(255,165,0,0.65)'
            : 'rgba(255,80,80,0.55)'),
          borderRadius: 4,
        }, {
          label: `Goal (${goalH}h)`,
          data: Array(7).fill(goalH),
          type: 'line',
          borderColor: 'rgba(92,128,255,0.55)',
          borderWidth: 1.5,
          borderDash: [4, 4],
          pointRadius: 0,
          fill: false,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: textColor, font: { family: 'Inter, Segoe UI, system-ui, sans-serif', size: 12 } } } },
        scales: {
          x: { ticks: { color: textColor, font: { size: 11 } }, grid: { color: gridColor } },
          y: { min: 0, suggestedMax: Math.max(goalH + 1, ...hours) + 0.5,
               ticks: { color: textColor, stepSize: 1 }, grid: { color: gridColor } }
        }
      }
    });
  },
};
