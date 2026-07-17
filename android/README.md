# Skadi Android Wrapper

A Capacitor wrapper around the same static web app (`index.html` + `js/` + `css/`) so it can be sideloaded as a debug APK — no Play Store publishing, no separate codebase to maintain. The web app keeps working exactly as before; this is purely an additional distribution target.

## One-time Firebase console setup (required before the CI build works)

1. **Firebase Console → Project Settings → Add app → Android.**
   - Package name: `com.abhaybhat.arjuna` (must match `capacitor.config.json`'s `appId`).
   - Debug signing certificate SHA-1: `89:7C:3E:84:B8:CA:A3:13:51:FC:ED:E9:EF:86:7D:F6:E8:32:27:CA`
     (fingerprint of the committed `android/debug.keystore` — every CI build signs with this same key, so this only needs registering once. If the keystore is ever regenerated, re-derive the SHA-1 with `keytool -list -v -keystore android/debug.keystore -alias androiddebugkey -storepass android` and update this here.)
2. Download the generated `google-services.json`, then:
   ```bash
   base64 -w0 google-services.json | pbcopy   # or | xclip, or just cat it
   ```
   Save the output as a repository secret named `GOOGLE_SERVICES_JSON` (Settings → Secrets and variables → Actions).
3. Confirm the existing `FIREBASE_API_KEY` / `FIREBASE_AUTH_DOMAIN` / `FIREBASE_PROJECT_ID` / `FIREBASE_STORAGE_BUCKET` / `FIREBASE_MESSAGING_SENDER_ID` / `FIREBASE_APP_ID` secrets (already used for the web deploy) exist in the same repo — the Android build reuses them to generate `js/firebase-config.js` for the bundled web assets.
4. Enable **Google** as a sign-in provider under Firebase Console → Authentication → Sign-in method, if not already enabled (same one the web app uses).

## Building the APK

Push to `main` (with changes under `android/`, `js/`, `css/`, `index.html`, etc.) or trigger manually from the **Actions** tab → "Build Android APK" → **Run workflow**. Download `skadi-debug-apk` from the completed run's artifacts — it's a debug build, so no Play Store account or app signing key is needed to install it; just enable "install unknown apps" on the phone when sideloading.

## Why CI and not a local build

This repo's sandboxed dev environment can't reach Google's Android SDK/Maven servers (`dl.google.com`, `maven.google.com` — blocked by network policy), so `./gradlew assembleDebug` can't run here. GitHub-hosted Actions runners have full internet access and do this instead. Everything up to that final compile step — the Capacitor project scaffold, the native Java plugin, manifest, signing config — was generated and verified locally against the actual bundled Capacitor library sources.

## What's native vs. web

- `MainActivity.java`, `TaskTimerPlugin.java`, `TaskTimerForegroundService.java` — a small custom Capacitor plugin (not a published package) that keeps one task's timer accurate via a real Android foreground service + persistent notification, so it keeps running when the app is backgrounded or the screen is locked (like Forest/Yeolpumta). `js/native-timer-bridge.js` is the JS-side bridge — it's a complete no-op on the web build.
- `js/auth.js`'s `signInWithGoogle()` branches on `Platform.isNative()` (`js/platform.js`): native uses the native Google account chooser (`@capacitor-firebase/authentication`) since Google blocks OAuth popups inside embedded WebViews, then hands the resulting credential to the same Firebase Auth JS SDK the web build uses — the web sign-in path is untouched.
- Data sync is unchanged — the existing Firestore real-time listener + field-level merge (`js/sync.js`) works identically inside the WebView, so changes made on the phone and on the web show up on both within the same debounce/listener window.
- `js/platform.js` adds an `.is-native` class to `<html>` on native (used by the CSS safe-area fix below) and is the single shared `Platform.isNative()`/`Platform.isAndroid()` check every other native-gated file uses.
- The bottom nav bar and top bar grow to accommodate the device's real safe-area insets (gesture-nav bar, status bar) instead of a fixed-height box shrinking into them (`css/styles.css`'s `--topbar-safe-h`/`--navbar-safe-h` tokens) — this was the fix for the previously-reported "nav bar hidden" bug.
- `js/native-integration.js` (native-only, no-op on web) adds three things via `@capacitor/app`, `@capacitor/browser`, `@capacitor/status-bar`:
  - **Hardware back button**: closes the topmost open modal/popover if one is open, else navigates to the Today tab if elsewhere, else backgrounds the app (never hard-exits).
  - **External links**: any absolute `http(s)://` link opens in a Chrome Custom Tab instead of the embedded WebView; in-app relative links and blob: download links are untouched.
  - **Status bar theming**: icon/text contrast (`StatusBar.setStyle`) matches the app's dark/light theme and updates live when the theme is toggled.

## Manual test checklist (run on a physical Android phone after installing the sideloaded APK)

1. Install `app-debug.apk` (enable "install unknown apps" if prompted) — confirm the app launches to the Skadi UI, no blank/white screen.
2. Tap sign-in — confirm a **native** Google account picker appears (not an embedded browser popup) and sign-in succeeds, reflected in the header same as web.
3. Start a task timer, lock the screen for 5+ minutes — confirm a persistent notification stays visible showing elapsed time; unlock and confirm the in-app timer badge reflects accurate elapsed time (not reset, not frozen).
4. Force-close the app via swipe-from-recents while a timer is running, then reopen — confirm the timer state (running task + elapsed time) recovers correctly.
5. Cross-device sync: sign into the same account on a web browser tab and the Android app at the same time; make a change on web (e.g. add a task) and confirm it appears on Android quickly, then reverse the direction.
6. The first time the foreground service starts, Android may prompt about battery optimization / "let app run in background" — confirm accepting it isn't required again on later runs.
7. Spot-check no regressions: drag-and-drop between quadrants, subtasks, the existing UPSC/Tech study timers, and all other tabs render identically to the web build.
8. **Nav bar visibility** — confirm the bottom tab bar's icons and labels are fully visible (not clipped/squeezed) with the device in gesture-navigation mode, and again after switching the device to 3-button navigation mode (Settings → System → Gestures).
9. **Status bar contrast** — confirm the status bar clock/battery/signal icons are legible against the app's topbar in both dark and light theme, and that toggling the in-app theme switch updates them immediately.
10. **Hardware back button** — press back with a modal open (e.g. Mission Phases, the DevOps guide) and confirm it closes the modal, not the app; press back again from a non-Today tab and confirm it returns to Today; press back once more from Today with nothing open and confirm the app backgrounds (visible in the recents/task switcher) rather than closing.
11. **External links** — tap a current-affairs source link or the DevOps guide's external links and confirm they open in a Chrome Custom Tab (own address bar, back arrow to return to Skadi), not inside the app's own WebView.
12. Full regression pass of steps 1–7 above to confirm nothing else broke.
13. **Phase badge on narrow phones** — on the Today tab, confirm the phase-stage badge (e.g. "🏁 Stage 1 — Settling In") stays on one line with an ellipsis if needed, never wraps or overlaps the date text / sync badge / avatar in the topbar, in both portrait orientation and after rotating to landscape.
14. **Bottom nav labels** — confirm all 6 tab labels (Today, UPSC, Finance, Health, Growth, Tasks) are fully visible (not clipped) in the bottom nav bar, in both gesture-navigation and 3-button navigation modes.
15. **Milestone banner / UPSC lag banner** — on a cold launch (force-stop the app before reopening, not just backgrounding it) confirm the first milestone chip on Today and the lag banner on UPSC (if behind schedule) render fully visible immediately below the quote strip, with no visible clipping during the first 1-2 seconds after launch. (Not reproducible in this project's automated Playwright suite — flagged for real-device confirmation only.)
16. **Tap-triggered popovers** — open the "+" add-subject/add-activity popover (Today tab, Study Timer) and confirm it stays fully on-screen, not clipped past the left edge. Then confirm the **Save/Cancel buttons are always reachable**: type a name (triggering the on-screen keyboard) and confirm the popover repositions/scrolls so Save and Cancel are visible and tappable, not hidden below the keyboard or the fold — try both the Subject and Activity pickers, and try opening the popover from lower on the screen (e.g. after scrolling down) to exercise the flip-above behavior.
17. **Pane layout on phone-width screens** — on Today, UPSC, Finance, Health, and Growth tabs, confirm the left/right content panes each render full-width (not a narrow ~65-70% column with blank space beside it) in portrait mode.
18. **Tasks tab quadrant cards** — confirm no quadrant card or task row is clipped at the screen edge, and no horizontal scroll/sliver-cut-off content appears, even for a task with a long title.
19. **Bottom padding under content** — scroll to the bottom of any tab's content and confirm the last card/row is fully visible above the bottom nav bar, not tucked under it, in both gesture-navigation and 3-button navigation modes.
20. **Header dropdown menu** — tap the hamburger/avatar menu with a small window (e.g. split-screen or a phone in landscape) and confirm all menu items (including Sync Now / Sign Out when signed in) are reachable, scrolling within the menu if needed, rather than extending off-screen.
