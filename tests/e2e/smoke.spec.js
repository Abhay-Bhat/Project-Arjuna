// Plain web boot (no Capacitor mock) — the baseline regression guard for
// "no data lost, no component missed" across every change in this round.
const { test, expect } = require('@playwright/test');
const { gotoApp } = require('../fixtures/boot');

const TABS = ['today', 'upsc', 'finance', 'health', 'growth', 'tasks'];

test.describe('smoke: plain web boot', () => {
  test('boots with no uncaught runtime errors (true first launch, onboarding included)', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    await page.goto('/index.html');
    await page.waitForSelector('#appLoader.al-done, body:not(:has(#appLoader))', { timeout: 10000 });

    expect(pageErrors, `Uncaught JS errors: ${pageErrors.join('; ')}`).toEqual([]);
  });

  test('loader hides and .is-native is absent on plain web', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('#appLoader')).toHaveClass(/al-done/, { timeout: 10000 });

    const hasNativeClass = await page.evaluate(() => document.documentElement.classList.contains('is-native'));
    expect(hasNativeClass).toBe(false);
  });

  test('all 6 tabs exist and switching activates the matching panel', async ({ page }) => {
    await gotoApp(page);

    for (const tab of TABS) {
      await page.locator(`.tab-btn[data-tab="${tab}"]`).click();
      await expect(page.locator(`#tab-${tab}`)).toHaveClass(/active/);
      await expect(page.locator(`.tab-btn[data-tab="${tab}"]`)).toHaveClass(/active/);
    }
  });

  test('AppState persists across reload — no data lost', async ({ page }) => {
    await gotoApp(page);

    // Switching tabs calls AppState.save() (js/ui.js _bindTabNav), which
    // debounces its actual IndexedDB/localStorage write by 300ms
    // (js/state.js) — wait past that window before reloading, or the
    // reload races the pending write and this test would be flaky rather
    // than a real persistence check.
    await page.locator('.tab-btn[data-tab="tasks"]').click();
    await expect(page.locator('#tab-tasks')).toHaveClass(/active/);
    await page.waitForTimeout(500);

    await page.reload();
    await page.waitForSelector('#appLoader.al-done', { timeout: 10000 });

    await expect(page.locator('#tab-tasks')).toHaveClass(/active/);
    await expect(page.locator('.tab-btn[data-tab="tasks"]')).toHaveClass(/active/);
  });
});
