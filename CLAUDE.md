# Project Arjuna — Claude Instructions

## Git workflow
- After completing any set of changes: commit, push, and merge to main automatically — no confirmation needed.
- Always develop on the designated feature branch (`claude/…`).
- Use squash merge when merging PRs.
- Bump the `?v=N` cache-busting query string on any CSS/JS file you touch.

## Stack
- Vanilla JS (no framework). No React, no bundler.
- Single-page app: `index.html` + `/js/*.js` + `/css/styles.css`.
- State lives in `AppState` (IndexedDB via `Storage`, with localStorage fallback).
- `window.ArjunaHealth` is exported by `js/health-data.js`.

## Conventions
- All new CSS variables go in `:root` / `[data-theme="light"]` blocks at the top of `styles.css`.
- Class names follow existing patterns: `pane-card`, `section-title`, `qc-*`, `ms-*`, etc.
- Never add comments explaining *what* code does; only add one-liners for non-obvious *why*.
