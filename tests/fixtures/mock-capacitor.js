// Injects a fake window.Capacitor before navigation, so every
// Platform.isNative()-gated code path (the .is-native class, the back-
// button handler, external-link interception, status-bar sync) actually
// engages in headless Chromium even though no real Android runtime exists
// in this environment. Plugin methods are spies: each call is recorded to
// window.__capacitorCalls so specs can assert on it.
async function installCapacitorMock(page) {
  await page.addInitScript(() => {
    window.__capacitorCalls = [];
    const record = (plugin, method) => (...args) => {
      window.__capacitorCalls.push({ plugin, method, args });
      return Promise.resolve({});
    };
    let backButtonListener = null;
    let pauseListener = null;

    window.Capacitor = {
      isNativePlatform: () => true,
      getPlatform: () => 'android',
      Plugins: {
        App: {
          addListener: (event, cb) => {
            if (event === 'backButton') backButtonListener = cb;
            if (event === 'pause') pauseListener = cb;
            return Promise.resolve({ remove: () => {} });
          },
          minimizeApp: record('App', 'minimizeApp'),
        },
        Browser: {
          open: record('Browser', 'open'),
        },
        StatusBar: {
          setStyle: record('StatusBar', 'setStyle'),
        },
      },
    };

    // Exposed so specs can simulate a real hardware back-button press
    // (the actual event can only fire from native Android, never from a
    // browser) by invoking the same listener NativeIntegration registered.
    window.__fireBackButton = () => backButtonListener && backButtonListener();
    // Same idea for the native 'pause' (app backgrounded) lifecycle event.
    window.__firePause = () => pauseListener && pauseListener();
  });
}

module.exports = { installCapacitorMock };
