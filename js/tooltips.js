// ============================================================
// Skadi — Info Tooltip Injector
// Adds ℹ icons next to actionable buttons across all tabs.
// ============================================================

const BUTTON_TIPS = [
  // ── Header ────────────────────────────────────────────────
  { id: 'todayBtn',        tip: 'Jump back to today\'s date and refresh the dashboard' },
  { id: 'calendarBtn',     tip: 'Open the full calendar picker to jump to any date' },
  { id: 'themeToggle',     tip: 'Switch between Dark and Light theme' },
  { id: 'dashboardToggle', tip: 'Collapse or expand the Life Dashboard overview cards' },

  // ── Today tab ─────────────────────────────────────────────
  { id: 'resetBtn',        tip: 'Reset all activity checkboxes for the selected date. Your data in other tabs stays intact.' },

  // ── Calendar nav ──────────────────────────────────────────
  // Injected dynamically — handled via data-tip on the buttons themselves

  // ── UPSC tab ──────────────────────────────────────────────
  { id: 'caAddBtn',        tip: 'Log this article/class to Current Affairs for the selected date. Marks CA as done for the day.' },

  // ── Finance tab ───────────────────────────────────────────
  { id: 'btnNRI',          tip: 'Toggle NRI Account status between Live and Pending' },
  { id: 'btnSIP',          tip: 'Toggle SIP (Systematic Investment Plan) between Active and Pending' },

  // ── Mind tab ──────────────────────────────────────────────
  { id: 'pastimeStartBtn',      tip: 'Start a new Pastime streak from today. Previous streak data is kept.' },
  { id: 'pastimeResetBtn',      tip: 'Open the reset log form to record a reset and restart the streak.' },
  { id: 'pastimeResetSubmitBtn',tip: 'Log this reset entry with the selected reason, restart streak to Day 1.' },

  // ── Growth tab ────────────────────────────────────────────
  { id: 'weeklySubmitBtn', tip: 'Submit your weekly self-review scores. Can only be submitted once per week.' },
  { id: 'monthlySubmitBtn',tip: 'Submit your monthly domain review. Updates the Growth Summary chart.' },
];

// Selectors with tips — nav items are excluded (they use title="" attributes)
const SELECTOR_TIPS = [];

function injectInfoIcon(el, tip) {
  if (!el || el.dataset.tipInjected) return;

  const parent = el.parentElement;
  // Skip nav elements — they already have title attributes for tooltips
  if (parent?.classList.contains('domains-grid') ||
      parent?.classList.contains('tab-nav') ||
      parent?.classList.contains('side-nav') ||
      parent?.id === 'domainsGrid') {
    return;
  }

  el.dataset.tipInjected = '1';
  const icon = document.createElement('span');
  icon.className = 'info-icon';
  icon.setAttribute('data-tip', tip);
  icon.textContent = 'i';

  // Inside dropdown: append inside the button so icon stays on same line
  if (parent?.classList.contains('hdr-dropdown')) {
    icon.style.marginLeft = 'auto';
    el.appendChild(icon);
  } else {
    // Wrap button + icon together so they stay inline in any flex context
    const wrapper = document.createElement('span');
    wrapper.className = 'btn-with-info';
    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);
    wrapper.appendChild(icon);
  }
}

function injectAllTooltips() {
  // By ID
  BUTTON_TIPS.forEach(({ id, tip }) => {
    injectInfoIcon(document.getElementById(id), tip);
  });

  // By selector
  SELECTOR_TIPS.forEach(({ sel, tip }) => {
    document.querySelectorAll(sel).forEach(el => injectInfoIcon(el, tip));
  });

  // Form submit buttons — inject generically
  const formBtnTips = {
    'finEntryForm':    'Save this month\'s Dubai savings entry. Updates the progress bar and transaction log.',
    'investmentForm':  'Add this investment to your portfolio tracker. Updates total corpus calculation.',
    'cholForm':        'Log this cholesterol test result. Adds a row to the history table and updates the trend chart.',
    'partnerForm':     'Log this contact interaction. Saved to the Contact Log below.',
  };
  Object.entries(formBtnTips).forEach(([formId, tip]) => {
    const form = document.getElementById(formId);
    const btn  = form?.querySelector('[type=submit], .btn-primary');
    if (btn) injectInfoIcon(btn, tip);
  });
}

// Run after first render
document.addEventListener('DOMContentLoaded', () => {
  // Initial injection
  setTimeout(injectAllTooltips, 400);
  // Re-inject when tabs switch (dynamic buttons may not exist yet)
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => setTimeout(injectAllTooltips, 300));
  });
});
