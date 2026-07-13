// Lightweight regression tripwire, not a strict native-device benchmark —
// headless Chromium timing in CI isn't representative of a real phone, so
// this only guards against the loader hanging or a gross performance
// regression, not fine-grained timing.
const { test, expect } = require('@playwright/test');
const { gotoApp } = require('../fixtures/boot');

test.describe('performance', () => {
  test('loader hides within a bounded time', async ({ page }) => {
    const start = Date.now();
    await gotoApp(page);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(15000);
  });

  test('all 6 tabs are clickable and render immediately after boot', async ({ page }) => {
    await gotoApp(page);

    const tabs = ['today', 'upsc', 'finance', 'health', 'growth', 'tasks'];
    for (const tab of tabs) {
      const start = Date.now();
      await page.locator(`.tab-btn[data-tab="${tab}"]`).click();
      await expect(page.locator(`#tab-${tab}`)).toHaveClass(/active/, { timeout: 3000 });
      expect(Date.now() - start).toBeLessThan(3000);
    }
  });
});
