// Skadi Focus Guard — popup script

let state = { focusActive: false, allowlist: [], dashOrigins: [] };

function render() {
  const badge     = document.getElementById('statusBadge');
  const toggleBtn = document.getElementById('toggleBtn');
  const listEl    = document.getElementById('domainList');

  badge.textContent  = state.focusActive ? 'ON' : 'OFF';
  badge.className    = 'badge ' + (state.focusActive ? 'badge-on' : 'badge-off');
  toggleBtn.textContent = state.focusActive ? '⏹ End Focus Session' : '▶ Start Focus Session';
  toggleBtn.className   = 'toggle-btn ' + (state.focusActive ? 'active' : 'inactive');

  listEl.innerHTML = '';
  if (!state.allowlist.length) {
    listEl.innerHTML = '<li><span class="empty">No domains added yet</span></li>';
    return;
  }
  state.allowlist.forEach(host => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${host}</span><button class="rm-btn" data-host="${host}">×</button>`;
    listEl.appendChild(li);
  });
  listEl.querySelectorAll('.rm-btn').forEach(btn => {
    btn.addEventListener('click', () => removeDomain(btn.dataset.host));
  });
}

function loadState() {
  chrome.runtime.sendMessage({ type: 'SKADI_GET_STATE' }, resp => {
    if (resp) { state = resp; render(); }
  });
}

function addDomain() {
  const input = document.getElementById('domainInput');
  let host = input.value.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '');
  if (!host || state.allowlist.includes(host)) return;
  state.allowlist.push(host);
  input.value = '';
  syncAllowlist();
}

function removeDomain(host) {
  state.allowlist = state.allowlist.filter(h => h !== host);
  syncAllowlist();
}

function syncAllowlist() {
  chrome.runtime.sendMessage({ type: 'SKADI_SET_ALLOWLIST', allowlist: state.allowlist }, () => render());
}

function toggleFocus() {
  const type = state.focusActive ? 'SKADI_FOCUS_END' : 'SKADI_FOCUS_START';
  chrome.runtime.sendMessage({ type }, () => {
    state.focusActive = !state.focusActive;
    render();
  });
}

document.getElementById('addBtn').addEventListener('click', addDomain);
document.getElementById('domainInput').addEventListener('keydown', e => { if (e.key === 'Enter') addDomain(); });
document.getElementById('toggleBtn').addEventListener('click', toggleFocus);

loadState();
