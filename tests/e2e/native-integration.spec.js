// Exercises every Platform.isNative()-gated native code path using the
// mocked window.Capacitor fixture — the real hardware back-button event,
// Custom Tab launch, and status-bar tint can only be proven on an actual
// Android device (see android/README.md's manual checklist), but the JS
// logic that drives all three is fully testable this way.
const { test, expect } = require('@playwright/test');
const { installCapacitorMock } = require('../fixtures/mock-capacitor');

async function boot(page) {
  await installCapacitorMock(page);
  // A fresh context has no skadi_onboarding_done flag, so the onboarding
  // modal auto-opens and would intercept every click these tests make.
  await page.addInitScript(() => {
    try { localStorage.setItem('skadi_onboarding_done', 'true'); } catch (e) {}
  });
  await page.goto('/index.html');
  await page.waitForSelector('#appLoader.al-done', { timeout: 10000 });
}

function calls(page, plugin, method) {
  return page.evaluate(({ plugin, method }) =>
    window.__capacitorCalls.filter(c => c.plugin === plugin && c.method === method),
  { plugin, method });
}

test.describe('native integration (mocked Capacitor)', () => {
  test('.is-native class and Platform.isNative() engage when Capacitor is present', async ({ page }) => {
    await boot(page);
    const hasClass = await page.evaluate(() => document.documentElement.classList.contains('is-native'));
    const isNative = await page.evaluate(() => Platform.isNative());
    expect(hasClass).toBe(true);
    expect(isNative).toBe(true);
  });

  test('status bar synced on boot and again on theme toggle', async ({ page }) => {
    await boot(page);
    const bootCalls = await calls(page, 'StatusBar', 'setStyle');
    expect(bootCalls.length).toBeGreaterThanOrEqual(1);

    await page.locator('#headerMenuBtn').click();
    await page.locator('#themeToggle').click();

    const afterToggle = await calls(page, 'StatusBar', 'setStyle');
    expect(afterToggle.length).toBeGreaterThan(bootCalls.length);
  });

  test('back button closes the topmost open modal (inline-style convention: phasesModal)', async ({ page }) => {
    await boot(page);
    await page.locator('#headerDateToggle').click();
    await expect(page.locator('#phasesModal')).toBeVisible();

    await page.evaluate(() => window.__fireBackButton());

    await expect(page.locator('#phasesModal')).toBeHidden();
    expect(await calls(page, 'App', 'minimizeApp')).toHaveLength(0);
  });

  test('back button closes a modal with real side effects (devopsGuideModal resets body scroll lock)', async ({ page }) => {
    await boot(page);
    await page.locator('.tab-btn[data-tab="growth"]').click();
    await page.locator('#openGuideBtn').click();
    await expect(page.locator('#devopsGuideModal')).toHaveClass(/is-open/);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');

    await page.evaluate(() => window.__fireBackButton());

    await expect(page.locator('#devopsGuideModal')).not.toHaveClass(/is-open/);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  });

  test('back button navigates to Today when a non-Today tab is active and nothing is open', async ({ page }) => {
    await boot(page);
    await page.locator('.tab-btn[data-tab="tasks"]').click();
    await expect(page.locator('#tab-tasks')).toHaveClass(/active/);

    await page.evaluate(() => window.__fireBackButton());

    await expect(page.locator('#tab-today')).toHaveClass(/active/);
    expect(await calls(page, 'App', 'minimizeApp')).toHaveLength(0);
  });

  test('back button minimizes the app on Today with nothing open', async ({ page }) => {
    await boot(page);
    await expect(page.locator('#tab-today')).toHaveClass(/active/);

    await page.evaluate(() => window.__fireBackButton());

    expect(await calls(page, 'App', 'minimizeApp')).toHaveLength(1);
  });

  test('external absolute link opens via Browser.open and default navigation is prevented', async ({ page }) => {
    await boot(page);
    const link = page.locator('a[href="https://github.com/abhay-bhat/project-arjuna/tree/main/extension"]');
    await link.click();

    const opened = await calls(page, 'Browser', 'open');
    expect(opened).toHaveLength(1);
    expect(opened[0].args[0].url).toContain('github.com/abhay-bhat/project-arjuna');
    expect(page.url()).toContain('/index.html'); // did not navigate away
  });

  test('relative in-app link (help.html) is NOT intercepted', async ({ page }) => {
    await boot(page);
    await page.locator('#headerMenuBtn').click();
    const link = page.locator('a[href="help.html"]');
    await expect(link).toBeVisible();
    // Only assert on Browser.open call count — actually following the link
    // in this same page/tab isn't necessary to prove non-interception.
    const before = await calls(page, 'Browser', 'open');
    await link.evaluate(el => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
    const after = await calls(page, 'Browser', 'open');
    expect(after.length).toBe(before.length);
  });

  test('blob: download links are NOT intercepted', async ({ page }) => {
    await boot(page);
    await page.evaluate(() => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob(['test'], { type: 'text/plain' }));
      a.download = 'test.txt';
      a.id = 'test-blob-link';
      a.textContent = 'download';
      document.body.appendChild(a);
    });
    const before = await calls(page, 'Browser', 'open');
    await page.locator('#test-blob-link').evaluate(el => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
    const after = await calls(page, 'Browser', 'open');
    expect(after.length).toBe(before.length);
  });

  test('native "pause" lifecycle event triggers CloudSync.flushPush() (Android background-flush reliability)', async ({ page }) => {
    await boot(page);
    const flushCallCount = await page.evaluate(() => {
      let count = 0;
      CloudSync.flushPush = () => { count++; };
      window.__firePause();
      return count;
    });
    expect(flushCallCount).toBe(1);
  });
});
