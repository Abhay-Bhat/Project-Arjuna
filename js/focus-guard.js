// Skadi — Focus Guard
// Dashboard-side allowlist management and extension bridge.

const FocusGuard = (() => {

  let _extensionPresent = false;
  let _state = { focusActive: false, allowlist: [] };

  // ── Extension detection ───────────────────────────────────

  function _detect() {
    window.postMessage({ type: 'SKADI_GET_STATE' }, '*');
    setTimeout(() => {
      if (!_extensionPresent) _renderStatus('not-installed');
    }, 800);
  }

  window.addEventListener('message', e => {
    if (!e.data || !e.data.type) return;
    if (e.data.type === 'SKADI_STATE_UPDATE' || e.data.type === 'SKADI_GET_STATE_RESPONSE') {
      _extensionPresent = true;
      _state = { focusActive: e.data.focusActive, allowlist: e.data.allowlist || [] };
      _renderStatus('connected');
      _renderList();
    }
  });

  // ── Helpers ───────────────────────────────────────────────

  function _send(msg) {
    window.postMessage(msg, '*');
  }

  function _parseDomain(raw) {
    return raw.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '');
  }

  // ── Render ────────────────────────────────────────────────

  function _renderStatus(status) {
    const el = document.getElementById('fgStatus');
    if (!el) return;
    if (status === 'not-installed') {
      el.innerHTML = `<span class="fg-badge fg-badge-off">Extension not installed</span>
        <a class="fg-install-link" href="#" onclick="return false">
          Install Skadi Focus Guard for Chrome →
        </a>`;
    } else {
      const active = _state.focusActive;
      el.innerHTML = `<span class="fg-badge ${active ? 'fg-badge-on' : 'fg-badge-off'}">${active ? '🔴 Focus ON' : '⚪ Focus OFF'}</span>`;
    }
  }

  function _renderList() {
    const ul = document.getElementById('fgDomainList');
    if (!ul) return;
    ul.innerHTML = '';
    if (!_state.allowlist.length) {
      ul.innerHTML = '<li class="fg-empty">No domains added — add sites you need for studying</li>';
      return;
    }
    _state.allowlist.forEach(host => {
      const li = document.createElement('li');
      li.className = 'fg-domain-item';
      li.innerHTML = `<span class="fg-domain-name">${host}</span>
        <button class="fg-rm-btn" aria-label="Remove ${host}">✕</button>`;
      li.querySelector('.fg-rm-btn').addEventListener('click', () => _removeDomain(host));
      ul.appendChild(li);
    });
  }

  function _addDomain() {
    const input = document.getElementById('fgDomainInput');
    if (!input) return;
    const host = _parseDomain(input.value);
    if (!host || _state.allowlist.includes(host)) { input.value = ''; return; }
    _state.allowlist.push(host);
    input.value = '';
    _send({ type: 'SKADI_SET_ALLOWLIST', allowlist: _state.allowlist });
    _renderList();
  }

  function _removeDomain(host) {
    _state.allowlist = _state.allowlist.filter(h => h !== host);
    _send({ type: 'SKADI_SET_ALLOWLIST', allowlist: _state.allowlist });
    _renderList();
  }

  // ── Focus start / end (called by StudyTracker) ────────────

  function startFocus() {
    if (!_extensionPresent) return;
    _send({ type: 'SKADI_FOCUS_START' });
    _state.focusActive = true;
    _renderStatus('connected');
  }

  function endFocus() {
    if (!_extensionPresent) return;
    _send({ type: 'SKADI_FOCUS_END' });
    _state.focusActive = false;
    _renderStatus('connected');
  }

  // ── Init ──────────────────────────────────────────────────

  function init() {
    // Register this page as the dashboard
    _send({ type: 'SKADI_REGISTER_DASHBOARD' });
    _detect();

    const addBtn = document.getElementById('fgAddBtn');
    if (addBtn) addBtn.addEventListener('click', _addDomain);

    const input = document.getElementById('fgDomainInput');
    if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') _addDomain(); });
  }

  return { init, startFocus, endFocus };

})();

window.FocusGuard = FocusGuard;
