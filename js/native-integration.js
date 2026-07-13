// ============================================================
// Skadi — Native Integration
// Complete no-op on the web build (everything gated by Platform.isNative()).
// On the Android wrapper: hardware back-button handling, external links
// opened in the system browser instead of the embedded WebView, and
// status-bar icon theming to match the app's dark/light theme.
// ============================================================

const NativeIntegration = {

  // Each of the app's 11 static modals uses one of five different
  // open/close conventions, and several close actions have side effects
  // beyond hiding the element (e.g. the DevOps guide also resets
  // body.style.overflow; onboarding also persists a localStorage flag).
  // Clicking the modal's own real close control — not force-hiding it —
  // is what keeps those side effects intact.
  _MODAL_CLOSERS: {
    phasesModal:      () => document.getElementById('phasesClose')?.click(),
    calendarModal:     () => document.getElementById('calendarClose')?.click(),
    onboardingModal:   () => document.getElementById('onboardingClose')?.click(),
    glossaryModal:     () => document.getElementById('glossaryClose')?.click(),
    withdrawalModal:   () => document.getElementById('wdCancelBtn')?.click(),
    maturityModal:     () => document.getElementById('matCancelBtn')?.click(),
    editInvModal:      () => document.getElementById('editInvCancelBtn')?.click(),
    goalModal:         () => document.getElementById('goalCancelBtn')?.click(),
    manualPriceModal:  () => document.getElementById('mpCancelBtn')?.click(),
    backupModal:       () => window.BackupManager?.closeModal?.(),
    devopsGuideModal:  () => document.getElementById('guideCloseBtn')?.click(),
  },

  _topmostOpenModal() {
    return Object.keys(this._MODAL_CLOSERS).find(id => {
      const el = document.getElementById(id);
      return el && getComputedStyle(el).display !== 'none';
    });
  },

  handleBackButton() {
    const App = window.Capacitor?.Plugins?.App;
    if (!App) return;

    if (document.getElementById('authOverlay')?.classList.contains('show')) {
      App.minimizeApp();
      return;
    }
    if (document.querySelector('.sac-popover')) {
      document.querySelectorAll('.sac-popover').forEach(p => p.remove());
      return;
    }
    const openModalId = this._topmostOpenModal();
    if (openModalId) {
      this._MODAL_CLOSERS[openModalId]();
      return;
    }
    if (typeof AppState !== 'undefined' && AppState.currentTab !== 'today') {
      document.querySelector('.tab-btn[data-tab="today"]')?.click();
      return;
    }
    App.minimizeApp();
  },

  _bindBackButton() {
    window.Capacitor.Plugins.App?.addListener('backButton', () => this.handleBackButton());
  },

  // Delegated so it covers every current and future external link with no
  // per-file changes — internal '#...'/relative links and the blob: export
  // links used for downloads are untouched (only absolute http(s) hrefs match).
  _bindExternalLinks() {
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="http://"], a[href^="https://"]');
      if (!a) return;
      e.preventDefault();
      window.Capacitor.Plugins.Browser?.open({ url: a.href }).catch(() => {});
    }, true);
  },

  // Only StatusBar.setStyle() (icon/text contrast) is used — setBackgroundColor()
  // is unavailable on Android 15+ and wouldn't suit the topbar's translucent/blur
  // background anyway; the CSS safe-area fix already lets the app's own themed
  // topbar show through the edge-to-edge status-bar area.
  syncStatusBarTheme(theme) {
    const StatusBar = window.Capacitor?.Plugins?.StatusBar;
    if (!StatusBar) return;
    // Style.Dark = dark icons (used against our light theme's light topbar),
    // Style.Light = light icons (against the dark theme's dark topbar).
    // Hardcoded to the literal values Capacitor's Style enum compiles to,
    // since there's no bundler here to import the enum itself.
    StatusBar.setStyle({ style: theme === 'light' ? 'DARK' : 'LIGHT' }).catch(() => {});
  },

  init() {
    if (!Platform.isNative()) return;
    this._bindBackButton();
    this._bindExternalLinks();
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    this.syncStatusBarTheme(theme);
  },
};
window.NativeIntegration = NativeIntegration;
