// ============================================================
// Skadi — Platform detection
// Single source of truth for "are we running inside the Capacitor
// Android wrapper, or the plain web build". Loaded synchronously,
// before any other app script, so `.is-native` is on <html> before
// first paint and `Platform` is safe to use from every other file.
// ============================================================

const Platform = {
  isNative() {
    return typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();
  },
  isAndroid() {
    return this.isNative() && window.Capacitor?.getPlatform?.() === 'android';
  },
};
window.Platform = Platform;

if (Platform.isNative()) document.documentElement.classList.add('is-native');
