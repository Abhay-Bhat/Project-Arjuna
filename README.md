# Project Arjuna

A personal all-in-one dashboard for UPSC preparation, finance tracking, health monitoring, and daily productivity. Built as a single-page web app — no framework, no bundler.

## Live App

Hosted on Cloudflare Pages. Access at your configured `*.pages.dev` URL.

---

## Features

### Today
- Daily routine checklist with completion tracking
- Quick check-ins for health, mind, and habits
- Milestone countdown banner (UPSC exam + key life events)
- Motivational quote strip from UPSC toppers

### UPSC
- **Study Timer** — live start/stop session logger with subject and activity tracking
- **Forest visualization** — each completed session plants a tree; longer sessions grow bigger trees
- **Study analytics** — daily session list, weekly stacked bar chart, monthly heatmap, yearly GitHub-style heatmap
- Yearlong schedule across GS1, GS2, GS3, GS4, CSAT, Sociology, and Essay tracks
- Subject progress tracker (586 total classes across priority 1 and 2 subjects)
- Current affairs log with source tagging, notes, URL links, and file attachments (stored in IndexedDB)
- Lag banner when behind schedule

### Finance
- Savings log: AED saved + INR transferred per entry
- Investment tracker (FDs, SIPs, insurance, equity)
- Monthly expense breakdown by category
- NRI account and SIP status flags

### Health
- Daily sleep, gym, and phone usage logging
- 14-day sleep and phone usage charts (Chart.js)
- Gym heatmap (12-week GitHub-style)
- Cholesterol log with LDL/HDL/Total trend chart
- Blood markers panel (from `health-data.js`)
- Daily nutrition checklist with emoji quick-chips
- Today's meal plan (linked to weekly calendar in `health-data.js`)
- Supplement tracker

### Mind
- NoFap / discipline streak tracker with relapse logging
- Daily mental log: loneliness rating, meditation minutes, parent call
- Mind trend chart

### Growth
- Career milestone tracker
- Books log (monthly reading progress)
- Weekly and monthly review forms
- Partner connection log

### Tasks
- Bucket-based Kanban-style task manager
- Priority levels and due dates

---

## Tech Stack

| Layer | Choice |
|---|---|
| UI | Vanilla JS — no React, no framework |
| Styling | Single CSS file (`css/styles.css`) with CSS variables |
| Storage | IndexedDB (primary) via `js/storage.js`, localStorage fallback |
| Auth | Firebase Authentication (email/password) |
| Sync | Firebase Firestore — real-time listener + BroadcastChannel for cross-tab |
| Hosting | Cloudflare Pages (supports private repo + public URL) |

---

## Repository Structure

```
/
├── index.html              # Single HTML file — all tab panels here
├── css/
│   └── styles.css          # All styles, CSS variables, dark/light themes
├── js/
│   ├── state.js            # AppState — all persisted data, save/load, merge logic
│   ├── storage.js          # IndexedDB wrapper with localStorage fallback
│   ├── sync.js             # Firebase Firestore sync + BroadcastChannel cross-tab sync
│   ├── auth.js             # Firebase Authentication wrapper
│   ├── ui.js               # Main UI controller — tab rendering, milestone banner, header
│   ├── upsc.js             # UPSC schedule generation, subject progress, CA log
│   ├── study.js            # Study timer, forest visualization, analytics (day/week/month/year)
│   ├── health.js           # Health tracker — sleep, gym, cholesterol, charts
│   ├── health-data.js      # Static data: blood test reference, meal plan, supplement schedule
│   ├── finance.js          # Finance tracker
│   ├── mind.js             # Mind / discipline tracker
│   ├── growth.js           # Growth tracker — career, books, reviews
│   ├── tasks.js            # Task manager
│   ├── phases.js           # Phase/schedule manager for routine
│   ├── scheduler.js        # UPSC schedule computation helpers
│   ├── events.js           # Global DOM event bindings
│   ├── main.js             # App bootstrap — init sequence, clock, day-change detection
│   ├── backup.js           # Scheduled + manual backup manager
│   ├── tooltips.js         # Tooltip rendering
│   ├── seed-data.js        # One-time data seeding on first load
│   └── firebase-config.js  # Generated at build time from environment variables
└── build.sh                # Cloudflare Pages build script — writes firebase-config.js
```

---

## Deployment

### Cloudflare Pages

1. Connect the GitHub repository in the Cloudflare Pages dashboard.
2. Set **Production branch** to `main`.
3. Set **Build command** to `bash build.sh`.
4. Add the following environment variables in the Cloudflare Pages settings:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`
5. Every push to `main` triggers an automatic deploy.

The production URL (`<project>.pages.dev`) never changes.

### Local Development

```bash
# Any static file server works — e.g.:
npx serve .
# or
python3 -m http.server 8080
```

Firebase features (auth, sync) require the real `firebase-config.js`. Copy it manually or set environment variables and run `bash build.sh` once.

---

## Data & Privacy

- All data is stored in your browser's IndexedDB, synced to your own Firebase project.
- No third-party analytics, no ads, no data sharing.
- File attachments (CA articles) are stored locally in IndexedDB — they never leave the device.
- Export your data any time via the export button in the app.

---

## Git Workflow

- Feature branches: `claude/<feature-name>`
- All changes are committed, pushed, and squash-merged to `main` automatically.
- Cache-busting: every CSS/JS file uses a `?v=N` query string, bumped on each change.
