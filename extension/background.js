// Skadi Focus Guard — service worker (Manifest V3)
// Blocks all tabs except allowlisted domains when a focus session is active.

const STORAGE_KEY_ACTIVE    = 'focusActive';
const STORAGE_KEY_ALLOWLIST = 'focusAllowlist';
const STORAGE_KEY_DASHBOARD = 'dashboardOrigins';
const BLOCKED_PAGE          = chrome.runtime.getURL('blocked.html');

// ── State ─────────────────────────────────────────────────────────────────

let focusActive  = false;
let allowlist    = [];  // Array<string> of hostnames e.g. ["ncert.nic.in"]
let dashOrigins  = [];  // Registered dashboard origins e.g. ["https://abhay-bhat.github.io"]

// Load persisted state on startup
chrome.storage.local.get(
  [STORAGE_KEY_ACTIVE, STORAGE_KEY_ALLOWLIST, STORAGE_KEY_DASHBOARD],
  data => {
    focusActive = !!data[STORAGE_KEY_ACTIVE];
    allowlist   = data[STORAGE_KEY_ALLOWLIST] || [];
    dashOrigins = data[STORAGE_KEY_DASHBOARD] || [];
  }
);

// ── Helpers ───────────────────────────────────────────────────────────────

function _hostname(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}

function _isAllowed(url) {
  if (!url || url.startsWith('chrome') || url.startsWith('about:') || url.startsWith(BLOCKED_PAGE)) return true;
  const host = _hostname(url);
  if (!host) return true;
  // Always allow the dashboard itself
  for (const origin of dashOrigins) {
    try { if (new URL(origin).hostname.replace(/^www\./, '') === host) return true; } catch {}
  }
  return allowlist.some(h => host === h || host.endsWith('.' + h));
}

function _persist() {
  chrome.storage.local.set({
    [STORAGE_KEY_ACTIVE]:    focusActive,
    [STORAGE_KEY_ALLOWLIST]: allowlist,
    [STORAGE_KEY_DASHBOARD]: dashOrigins,
  });
}

// ── Tab blocking ──────────────────────────────────────────────────────────

function _checkTab(tabId, url) {
  if (!focusActive || _isAllowed(url)) return;
  const blocked = `${BLOCKED_PAGE}?from=${encodeURIComponent(url)}`;
  chrome.tabs.update(tabId, { url: blocked });
}

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status === 'loading' && info.url) _checkTab(tabId, info.url);
});

chrome.webNavigation.onCommitted.addListener(details => {
  if (details.frameId === 0) _checkTab(details.tabId, details.url);
});

// When focus is newly activated, scan all existing open tabs
function _blockExistingTabs() {
  chrome.tabs.query({}, tabs => {
    tabs.forEach(t => { if (t.url) _checkTab(t.id, t.url); });
  });
}

// ── Message bridge from content.js ───────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.type) {

    case 'SKADI_FOCUS_START':
      focusActive = true;
      chrome.storage.local.set({ focusStartedAt: Date.now() });
      _persist();
      _blockExistingTabs();
      sendResponse({ ok: true });
      break;

    case 'SKADI_FOCUS_END':
      focusActive = false;
      _persist();
      sendResponse({ ok: true });
      break;

    case 'SKADI_REGISTER_DASHBOARD':
      if (msg.origin && !dashOrigins.includes(msg.origin)) {
        dashOrigins.push(msg.origin);
        _persist();
      }
      sendResponse({ ok: true });
      break;

    case 'SKADI_SET_ALLOWLIST':
      allowlist = Array.isArray(msg.allowlist) ? msg.allowlist : [];
      _persist();
      sendResponse({ ok: true });
      break;

    case 'SKADI_GET_STATE':
      sendResponse({ focusActive, allowlist, dashOrigins });
      break;

    case 'SKADI_ALLOW_TEMP': {
      // Temporarily allow a domain for 5 minutes
      const host = _hostname(msg.url);
      if (host && !allowlist.includes(host)) {
        allowlist.push(host);
        _persist();
        setTimeout(() => {
          allowlist = allowlist.filter(h => h !== host);
          _persist();
        }, 5 * 60 * 1000);
      }
      sendResponse({ ok: true });
      break;
    }

    default:
      sendResponse({ ok: false, error: 'unknown message type' });
  }
  return true; // keep channel open for async
});
