// Skadi Focus Guard — content script
// Bridges window.postMessage from the Skadi dashboard to chrome.runtime.sendMessage.

(function () {
  // Register this origin as a dashboard if the page identifies itself
  window.addEventListener('message', event => {
    if (!event.data || typeof event.data.type !== 'string') return;
    if (!event.data.type.startsWith('SKADI_')) return;

    const msg = event.data;

    // Inject origin so background can verify dashboard
    if (msg.type === 'SKADI_REGISTER_DASHBOARD') {
      msg.origin = event.origin;
    }

    chrome.runtime.sendMessage(msg, response => {
      if (chrome.runtime.lastError) return;
      // Echo response back to page
      window.postMessage({ type: msg.type + '_RESPONSE', ...response }, event.origin || '*');
    });
  });

  // On page load, ask background for current state and forward it to the page
  chrome.runtime.sendMessage({ type: 'SKADI_GET_STATE' }, state => {
    if (chrome.runtime.lastError || !state) return;
    window.postMessage({ type: 'SKADI_STATE_UPDATE', ...state }, '*');
  });
})();
