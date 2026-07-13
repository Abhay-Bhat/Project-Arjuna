# Project Arjuna

A personal all-in-one dashboard for UPSC preparation, tech upskilling, finance tracking, health monitoring, and daily productivity. Built as a single-page web app — no framework, no bundler — and also shipped as a sideloadable Android app via a thin Capacitor wrapper around the same code.

## Live App

Hosted on GitHub Pages, served from the `gh-pages` branch.

---

## Features

### Today
- Daily routine checklist with completion tracking
- Phase-aware schedule (ramp-up stages → sustained cruise) with a live phase banner
- Compact study timer with domain toggle (UPSC / Tech)
- Motivational quote strip

### UPSC
- **Study Timer** — start/stop session logger (stopwatch, countdown, or Pomodoro) with subject and activity tracking
- **Forest visualization** — each completed session plants a tree; longer sessions grow bigger trees
- **Study analytics** — daily session list, weekly stacked bar chart, monthly heatmap, yearly GitHub-style heatmap
- Sequential subject schedule (19 subjects, NCERT → GS subjects → Optional → Essay) with per-subject progress tracking
- **5-phase preparation timeline** — Foundation, Mains Subject Coverage, Optional + Essay Mastery, Prelims Prep, Mains Rank Enhancer — with a horizontal timeline bar, countdowns, and subject-linked progress (derived from existing subject data, no duplicate entry)
- Current affairs log with source tagging, notes, URL links, and file attachments (stored in IndexedDB)
- Inline "+ Add" subject/activity creation with a curated icon picker (no separate management screen needed)

### Growth
- Tech upskilling tracker — a 76-week DevOps/cloud study plan (Docker → Kubernetes → Terraform → multi-cloud → interview prep), mirroring the UPSC study timer/analytics for a second domain
- Career milestone tracker, books log, weekly/monthly review forms, partner connection log

### Tasks
- **Eisenhower Matrix** — 2×2 urgent/important quadrant board (Do First / Schedule / Quick Wins / Eliminate), replacing the old bucket-based board
- Drag-and-drop between quadrants, subtasks, priority levels, due dates, filters and sort
- **Per-task timers** — start/stop a real-time timer on any task; logged time compares against its time estimate
- Tasks can link to any UPSC or Tech subject/activity for cross-referenced time tracking
- Advanced analytics: productivity gauge, task-status donut, quadrant distribution, weekly activity chart, priority breakdown, on-time rate, and estimate-vs-actual accuracy — all pure inline SVG, no chart library

### Finance
- Savings log, investment tracker (FDs, SIPs, insurance, equity), monthly expense breakdown, NRI account/SIP status

### Health
- Daily sleep, gym, and phone usage logging with 14-day trend charts
- Gym heatmap, cholesterol log with LDL/HDL/Total trend chart, blood markers panel
- Daily nutrition checklist, weekly meal plan, supplement tracker

---

## Android App

The same web app, wrapped with [Capacitor](https://capacitorjs.com/) so it can run as a sideloaded APK — background task timers keep running (via a real Android foreground service + persistent notification) when the app is backgrounded or the phone is locked, similar to Forest/Yeolpumta. This is **not published to the Play Store**; it's a debug build for personal sideloading. The web app is unaffected and keeps working exactly as before — the Android build is a separate downloadable artifact, not a replacement.

### Downloading the APK

The APK isn't committed to the repo — it's built fresh by a GitHub Actions workflow and attached to that run as a downloadable artifact:

1. Go to the repo's **Actions** tab → **Build Android APK** workflow.
2. Open the latest run with a green checkmark (or trigger a new one via **Run workflow** if you want the freshest build).
3. Scroll to the **Artifacts** section at the bottom of the run page and download `skadi-debug-apk` (a `.zip` containing `app-debug.apk`).
4. Unzip it and transfer `app-debug.apk` to your Android phone (USB, cloud drive, email to yourself — any method works).
5. On the phone, tap the file to install. Android will prompt to allow "install unknown apps" for whatever app you opened it with (Files, Chrome, etc.) — allow it, since this is a debug build outside the Play Store.

### One-time setup before Google Sign-In works on the app

The APK builds and launches without this, but native Google Sign-In (and therefore cloud sync) needs a one-time Firebase registration — see **[`android/README.md`](android/README.md)** for the exact steps (registering the app's SHA-1 fingerprint in the Firebase console, adding the `GOOGLE_SERVICES_JSON` repo secret) plus a manual on-device test checklist to run after installing.

### Why the build runs in CI, not locally

Building an Android APK requires resolving the Android Gradle Plugin and SDK components from Google's servers. If your own machine can build Android apps already, you can build locally too — see `android/README.md` for the exact commands (`npm run android:prepare` then `cd android && ./gradlew assembleDebug`).

---

## Tech Stack

| Layer | Choice |
|---|---|
| UI | Vanilla JS — no React, no framework |
| Styling | Single CSS file (`css/styles.css`) with CSS variables, light/dark themes |
| Storage | IndexedDB (primary) via `js/storage.js`, localStorage fallback |
| Auth | Firebase Authentication — Google Sign-In (native account picker on Android, popup on web) |
| Sync | Firebase Firestore — real-time listener with field-level merge, plus BroadcastChannel for cross-tab sync |
| Hosting | GitHub Pages (`gh-pages` branch) |
| Android | [Capacitor](https://capacitorjs.com/) wrapper + a small custom native plugin for the background task timer |

---

## Repository Structure

```
/
├── index.html                    # Single HTML file — all tab panels here
├── css/
│   └── styles.css                # All styles, CSS variables, dark/light themes
├── js/
│   ├── state.js                  # AppState — all persisted data, save/load, merge logic
│   ├── storage.js                # IndexedDB wrapper with localStorage fallback
│   ├── sync.js                   # Firebase Firestore sync + BroadcastChannel cross-tab sync
│   ├── auth.js                   # Firebase Authentication (Google Sign-In, web + native)
│   ├── ui.js                     # Main UI controller — tab rendering, phase banner, header
│   ├── upsc.js                   # UPSC schedule generation, subject progress, CA log
│   ├── study.js                  # UPSC study timer, forest visualization, subject/activity data
│   ├── tech-study.js             # Tech/DevOps study timer (mirrors study.js for the Growth domain)
│   ├── study-analytics.js        # UPSC study analytics (heatmaps, trends)
│   ├── tech-study-analytics.js   # Tech study analytics
│   ├── subject-picker.js         # Inline "+ Add new subject/activity" popover + icon grid
│   ├── tasks.js                  # Eisenhower Matrix task manager, per-task timers, analytics
│   ├── native-timer-bridge.js    # Bridges task timers to the Android foreground service (no-op on web)
│   ├── matrix.js                 # Eisenhower classification helpers shared with the Today tab
│   ├── goals.js                  # Goal tracking
│   ├── health.js                 # Health tracker — sleep, gym, cholesterol, charts
│   ├── health-data.js            # Static data: blood test reference, meal plan, supplement schedule
│   ├── finance.js                # Finance tracker
│   ├── growth.js                 # Career/books/reviews + the tech upskilling plan
│   ├── coach.js                  # Coaching/projection engine
│   ├── focus-guard.js            # Focus-session guard rails
│   ├── phases.js                 # Phase/schedule manager for routine + milestones
│   ├── scheduler.js              # UPSC schedule computation helpers
│   ├── devops-guide.js           # DevOps guide modal content
│   ├── events.js                 # Global DOM event bindings
│   ├── main.js                   # App bootstrap — init sequence, clock, day-change detection
│   ├── backup.js                 # Scheduled + manual backup manager
│   ├── tooltips.js               # Tooltip rendering
│   ├── seed-data.js               # One-time data seeding on first load
│   └── firebase-config.js        # Generated at build time from environment variables
├── android/                      # Capacitor-generated native Android project
│   ├── README.md                 # Android setup, build, and manual test checklist
│   └── app/src/main/java/…       # Custom TaskTimerPlugin + TaskTimerForegroundService
├── .github/workflows/
│   └── android-build.yml         # Builds the debug APK on GitHub-hosted runners
├── scripts/
│   └── copy-web-assets.mjs       # Copies index.html/js/css/assets into www/ for the Android build
├── capacitor.config.json         # Capacitor app id, name, webDir
├── package.json                  # Capacitor CLI + Android build tooling (web app itself needs no build step)
└── build.sh                      # Writes firebase-config.js from environment variables
```

---

## Deployment

### Web (GitHub Pages)

The site is served from the `gh-pages` branch. After merging changes to `main`, publish them with:

```bash
git push origin main:gh-pages
```

`js/firebase-config.js` is generated from environment variables via `build.sh` — it is not committed (see `js/firebase-config.example.js` for the template).

### Android APK

See **[Android App](#android-app)** above and `android/README.md` for the full walkthrough.

### Local Development

```bash
# Any static file server works — e.g.:
npx serve .
# or
python3 -m http.server 8080
```

Firebase features (auth, sync) require the real `firebase-config.js`. Copy `js/firebase-config.example.js` and fill in your own project's values, or run `bash build.sh` with the environment variables set.

---

## Data & Privacy

- All data is stored in your browser's IndexedDB, synced to your own Firebase project.
- No third-party analytics, no ads, no data sharing.
- File attachments (CA articles) are stored locally in IndexedDB — they never leave the device.
- The Android app talks to the same Firebase project as the web app, so changes on either sync to both.

---

## Git Workflow

- Feature branches: `claude/<feature-name>`
- All changes are committed, pushed, and squash-merged to `main` automatically.
- Cache-busting: every CSS/JS file uses a `?v=N` query string, bumped on each change.
