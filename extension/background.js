// Skadi Focus Guard — service worker (Manifest V3)
// Blocks all tabs except allowlisted domains when a focus session is active.

const STORAGE_KEY_ACTIVE    = 'focusActive';
const STORAGE_KEY_ALLOWLIST = 'focusAllowlist';
const STORAGE_KEY_DASHBOARD = 'dashboardOrigins';
const BLOCKED_PAGE          = chrome.runtime.getURL('blocked.html');

// ── State ─────────────────────────────────────────────────────────────────

let focusActive  = false;
let allowlist    = [];  // Array<string> of hostnames e.g. ["ncert.nic.in"]
let dashOrigins  = [];  // Registered dashboard origins e.g. ["https://leafy-truffle-624881.netlify.app"]

// Known dashboard URLs — always allowed, always act as admin console.
// The extension communicates with these pages via the content.js bridge.
const KNOWN_DASHBOARDS = [
  'https://project-arjuna.pages.dev',
  'https://leafy-truffle-624881.netlify.app',
  'https://abhay-bhat.github.io',
  'http://localhost:8080',
  'http://localhost:3000',
];

// Resolves once persisted state has loaded. MV3 service workers are evicted
// after ~30s idle and respawn on the next event with fresh (default) module
// state — gating every state-dependent check behind this promise stops a
// cold-started worker from making a blocking decision (or answering a
// message) against the default `focusActive = false` before the real
// persisted value has loaded, which would otherwise get silently
// overwritten a moment later when the load resolves.
let _readyResolve;
const _ready = new Promise(resolve => { _readyResolve = resolve; });

// Load persisted state on startup. `data` should always be an object per the
// chrome.storage API, but if the read ever fails (lastError set — quota,
// corrupted entry, or a transient issue at cold-start) it can come back
// undefined; falling back to {} here is essential, not just defensive —
// _readyResolve() is the last line, so any unhandled throw above it would
// leave `_ready` permanently unresolved and silently hang every message
// handler and tab-block check gated behind it for the rest of this service
// worker's life.
chrome.storage.local.get(
  [STORAGE_KEY_ACTIVE, STORAGE_KEY_ALLOWLIST, STORAGE_KEY_DASHBOARD],
  data => {
    if (chrome.runtime.lastError) {
      console.warn('Skadi Focus Guard: storage load error, using defaults:', chrome.runtime.lastError.message);
    }
    data = data || {};
    focusActive = !!data[STORAGE_KEY_ACTIVE];
    allowlist   = data[STORAGE_KEY_ALLOWLIST] || [];
    // Merge known dashboards with any saved ones
    const saved = data[STORAGE_KEY_DASHBOARD] || [];
    dashOrigins = [...new Set([...KNOWN_DASHBOARDS, ...saved])];
    _readyResolve();
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
  _ready.then(() => {
    if (!focusActive || _isAllowed(url)) return;
    const blocked = `${BLOCKED_PAGE}?from=${encodeURIComponent(url)}`;
    chrome.tabs.update(tabId, { url: blocked });
  });
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

// When focus ends, restore any tabs currently sitting on blocked.html back
// to the page they were trying to reach — without this, a tab that got
// blocked while focus was on stays stuck on blocked.html forever, since
// nothing else ever re-navigates it (this was the reported bug: toggling
// focus OFF stopped new blocking but never undid existing blocks).
function _unblockExistingTabs() {
  chrome.tabs.query({}, tabs => {
    tabs.forEach(t => {
      if (!t.url || !t.url.startsWith(BLOCKED_PAGE)) return;
      const from = new URL(t.url).searchParams.get('from');
      if (from) chrome.tabs.update(t.id, { url: from });
    });
  });
}

// ── Message bridge from content.js ───────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  _ready.then(() => {
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
        _unblockExistingTabs();
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
  });
  return true; // keep channel open for async
});
