// Direct regression test for the reported bug: the bottom nav bar (and,
// symmetrically, the top status-bar area) must GROW to accommodate a real
// Android safe-area inset instead of a fixed-height box shrinking into it.
// Uses Chrome DevTools Protocol's Emulation.setSafeAreaInsetsOverride to
// simulate a real device inset in headless Chromium (no Android emulator
// exists in this environment) — confirmed working against this exact
// Playwright/Chromium build during planning.
const { test, expect } = require('@playwright/test');

const INSET_BOTTOM = 48; // typical Android gesture-nav inset
const INSET_TOP = 24;    // typical Android status-bar inset

test.describe('safe-area: nav bar / status bar inset handling', () => {
  test.use({ viewport: { width: 412, height: 915 } });

  test('bottom nav bar grows to fit the inset — icons/labels stay fully visible', async ({ page, context }) => {
    const cdp = await context.newCDPSession(page);
    await page.goto('/index.html');
    await page.waitForSelector('#appLoader.al-done', { timeout: 10000 });
    await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: INSET_TOP, bottom: INSET_BOTTOM } });
    // Force a reflow so env() re-resolves against the new override.
    await page.evaluate(() => document.body.offsetHeight);

    const geometry = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const topbarH = parseFloat(root.getPropertyValue('--topbar-h'));
      const sidebar = document.getElementById('appSidebar');
      const sidebarRect = sidebar.getBoundingClientRect();
      const sidebarStyle = getComputedStyle(sidebar);
      const navItems = Array.from(document.querySelectorAll('.nav-item')).map(el => el.getBoundingClientRect());
      return {
        topbarH,
        sidebarHeight: sidebarRect.height,
        sidebarPaddingBottom: parseFloat(sidebarStyle.paddingBottom),
        sidebarBottom: sidebarRect.bottom,
        viewportHeight: window.innerHeight,
        navItems: navItems.map(r => ({ top: r.top, bottom: r.bottom, height: r.height })),
      };
    });

    // The bar's total box height must equal topbar-h PLUS the inset — not
    // just topbar-h (which was the bug: a fixed height that padding then
    // shrank into instead of growing).
    expect(geometry.sidebarHeight).toBeCloseTo(geometry.topbarH + INSET_BOTTOM, 0);
    expect(geometry.sidebarPaddingBottom).toBeCloseTo(INSET_BOTTOM, 0);
    expect(geometry.sidebarBottom).toBeCloseTo(geometry.viewportHeight, 0);

    // Every nav item's content must stay fully above the reserved inset
    // area (not clipped into it) and have real, non-squeezed height.
    for (const item of geometry.navItems) {
      expect(item.height).toBeGreaterThan(20); // squeezed-bug value would be near 0
      expect(item.bottom).toBeLessThanOrEqual(geometry.viewportHeight - INSET_BOTTOM + 1);
    }
  });

  test('top bar grows to fit the status-bar inset', async ({ page, context }) => {
    const cdp = await context.newCDPSession(page);
    await page.goto('/index.html');
    await page.waitForSelector('#appLoader.al-done', { timeout: 10000 });
    await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: INSET_TOP, bottom: INSET_BOTTOM } });
    await page.evaluate(() => document.body.offsetHeight);

    const geometry = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const topbarH = parseFloat(root.getPropertyValue('--topbar-h'));
      const topbar = document.getElementById('appTopbar');
      const rect = topbar.getBoundingClientRect();
      const style = getComputedStyle(topbar);
      return {
        topbarH,
        height: rect.height,
        paddingTop: parseFloat(style.paddingTop),
      };
    });

    expect(geometry.height).toBeCloseTo(geometry.topbarH + INSET_TOP, 0);
    expect(geometry.paddingTop).toBeCloseTo(INSET_TOP, 0);
  });

  test('with zero inset (desktop/web default), geometry is unchanged from --topbar-h', async ({ page, context }) => {
    const cdp = await context.newCDPSession(page);
    await page.goto('/index.html');
    await page.waitForSelector('#appLoader.al-done', { timeout: 10000 });
    await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 0, bottom: 0 } });
    await page.evaluate(() => document.body.offsetHeight);

    const geometry = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const topbarH = parseFloat(root.getPropertyValue('--topbar-h'));
      const sidebarHeight = document.getElementById('appSidebar').getBoundingClientRect().height;
      const topbarHeight = document.getElementById('appTopbar').getBoundingClientRect().height;
      return { topbarH, sidebarHeight, topbarHeight };
    });

    expect(geometry.sidebarHeight).toBeCloseTo(geometry.topbarH, 0);
    expect(geometry.topbarHeight).toBeCloseTo(geometry.topbarH, 0);
  });
});
