// Skadi Focus Guard — popup script

const DASHBOARD_URL = 'https://abhay-bhat.github.io/Project-Arjuna/';

let state = { focusActive: false, allowlist: [], dashOrigins: [] };

function render() {
  const pill       = document.getElementById('statusPill');
  const statusText = document.getElementById('statusText');
  const toggleBtn  = document.getElementById('toggleBtn');
  const listEl     = document.getElementById('domainList');
  const countEl    = document.getElementById('domainCount');
  const dashLink   = document.getElementById('dashLink');

  // Status pill
  const active = state.focusActive;
  pill.className    = 'status-pill ' + (active ? 'active' : 'inactive');
  statusText.textContent = active ? 'FOCUS ON' : 'OFF';

  // Toggle button
  toggleBtn.className   = 'toggle-btn ' + (active ? 'will-stop' : 'will-start');
  toggleBtn.textContent = active ? '⏹  End Focus Session' : '▶  Start Focus Session';

  // Dashboard link — use first registered dashboard or default
  const dashHost = (state.dashOrigins || []).find(o => o.startsWith('https://abhay'));
  dashLink.href = dashHost ? dashHost + '/' : DASHBOARD_URL;

  // Domain count
  const n = state.allowlist.length;
  countEl.textContent = n > 0 ? `${n} site${n === 1 ? '' : 's'}` : '';

  // Domain list
  listEl.innerHTML = '';
  if (!state.allowlist.length) {
    listEl.innerHTML = '<li><div class="empty-msg">No allowed sites yet</div></li>';
    return;
  }
  state.allowlist.forEach(host => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="domain-name">${host}</span>
      <button class="rm-btn" data-host="${host}" title="Remove">×</button>`;
    li.querySelector('.rm-btn').addEventListener('click', () => removeDomain(host));
    listEl.appendChild(li);
  });
}

function loadState() {
  chrome.runtime.sendMessage({ type: 'SKADI_GET_STATE' }, resp => {
    if (resp) { state = resp; render(); }
  });
}

function addDomain() {
  const input = document.getElementById('domainInput');
  let host = input.value.trim().toLowerCase()
    .replace(/^(https?:\/\/)?(www\.)?/, '')
    .replace(/\/.*$/, '');
  if (!host || state.allowlist.includes(host)) { input.value = ''; return; }
  state.allowlist.push(host);
  input.value = '';
  sync();
}

function removeDomain(host) {
  state.allowlist = state.allowlist.filter(h => h !== host);
  sync();
}

function sync() {
  chrome.runtime.sendMessage({ type: 'SKADI_SET_ALLOWLIST', allowlist: state.allowlist }, () => render());
}

function toggleFocus() {
  const type = state.focusActive ? 'SKADI_FOCUS_END' : 'SKADI_FOCUS_START';
  chrome.runtime.sendMessage({ type }, () => {
    state.focusActive = !state.focusActive;
    render();
  });
}

// Open dashboard link in a new tab
document.getElementById('dashLink').addEventListener('click', e => {
  e.preventDefault();
  chrome.tabs.create({ url: e.currentTarget.href });
});

document.getElementById('addBtn').addEventListener('click', addDomain);
document.getElementById('domainInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') addDomain();
});
document.getElementById('toggleBtn').addEventListener('click', toggleFocus);

loadState();
