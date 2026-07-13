// ============================================================
// Skadi — Native Timer Bridge
// No-ops entirely on the web build. On the Android wrapper, starts
// a foreground service (persistent notification) that keeps a task
// timer's elapsed time accurate while the app is backgrounded/locked.
// ============================================================

const NativeTimerBridge = {
  isNative() {
    return Platform.isNative();
  },

  async start(taskId, title) {
    if (!this.isNative()) return;
    try {
      await window.Capacitor.Plugins.TaskTimer.start({ taskId: String(taskId), title: title || 'Task Timer' });
    } catch (e) { console.warn('NativeTimerBridge.start failed', e); }
  },

  async stop() {
    if (!this.isNative()) return null;
    try {
      return await window.Capacitor.Plugins.TaskTimer.stop();
    } catch (e) { console.warn('NativeTimerBridge.stop failed', e); return null; }
  },

  async getElapsed() {
    if (!this.isNative()) return null;
    try {
      return await window.Capacitor.Plugins.TaskTimer.getElapsed();
    } catch (e) { console.warn('NativeTimerBridge.getElapsed failed', e); return null; }
  },
};
