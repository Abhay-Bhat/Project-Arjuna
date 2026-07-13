// Regression suite for the mobile overlap/clipping bugs reported from a
// real Android screenshot: phase-badge header overflow, squeezed-to-
// invisible bottom nav labels, milestone-banner/lag-banner separation
// from the sticky quote strip, and viewport-edge clamping for the
// tap-triggered subject/activity popover and hover tooltips.
const { test, expect } = require('@playwright/test');
const { gotoApp } = require('../fixtures/boot');

// Pins the app's clock to a date whose phase is a genuinely long string
// ("🏁 Stage 1 — Settling In", per js/phases.js) so these tests exercise
// the real overflow-prone content, not a shortened stand-in that would
// hide the bug.
const PINNED_DATE = new Date('2026-07-13T09:00:00');

async function gotoAppPinned(page) {
  await page.clock.install({ time: PINNED_DATE });
  await gotoApp(page);
}

test.describe('phase badge never overflows the topbar', () => {
  for (const width of [360, 390, 393, 412, 768]) {
    test(`at ${width}px viewport width`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await gotoAppPinned(page);

      const geo = await page.evaluate(() => {
        const topbar = document.getElementById('appTopbar');
        const badge = document.getElementById('phaseBadge');
        const date = document.getElementById('dateDisplay');
        const tb = topbar.getBoundingClientRect();
        const b = badge.getBoundingClientRect();
        const d = date.getBoundingClientRect();
        return {
          topbarBottom: tb.bottom, topbarRight: tb.right,
          badgeBottom: b.bottom, badgeRight: b.right, badgeHeight: b.height,
          dateBottom: d.bottom, dateRight: d.right,
        };
      });

      // The overflow bug manifested as the badge wrapping to multiple
      // lines and growing taller than the fixed-height topbar box.
      expect(geo.badgeBottom).toBeLessThanOrEqual(geo.topbarBottom + 1);
      expect(geo.dateBottom).toBeLessThanOrEqual(geo.topbarBottom + 1);
      expect(geo.badgeRight).toBeLessThanOrEqual(geo.topbarRight + 1);
      expect(geo.dateRight).toBeLessThanOrEqual(geo.topbarRight + 1);
    });
  }
});

test.describe('bottom nav labels are visible, not squeezed to nothing', () => {
  test('every label has real height and stays inside the sidebar box', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoApp(page);

    const geo = await page.evaluate(() => {
      const sidebar = document.getElementById('appSidebar');
      const sidebarRect = sidebar.getBoundingClientRect();
      const labels = Array.from(document.querySelectorAll('.nav-label')).map(el => {
        const r = el.getBoundingClientRect();
        return { text: el.textContent, top: r.top, bottom: r.bottom, height: r.height };
      });
      return { sidebarBottom: sidebarRect.bottom, labels };
    });

    expect(geo.labels.length).toBe(6);
    for (const label of geo.labels) {
      // The cascade bug shrank available height to ~3.6px of slack —
      // a real, unclipped label line-box is comfortably taller than that.
      expect(label.height, `label "${label.text}" height`).toBeGreaterThan(8);
      expect(label.bottom, `label "${label.text}" bottom vs sidebar bottom`)
        .toBeLessThanOrEqual(geo.sidebarBottom + 1);
    }
  });
});

test.describe('milestone banner / upsc lag banner separation from quote strip', () => {
  test('milestone banner does not overlap the sticky quote strip', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoAppPinned(page);
    await page.waitForTimeout(500); // catch a transient first-paint artifact, not just steady state

    const geo = await page.evaluate(() => {
      const qs = document.getElementById('quoteStrip');
      const mb = document.getElementById('milestoneBanner');
      const firstItem = mb.querySelector('.milestone-item');
      return {
        quoteStripBottom: qs.getBoundingClientRect().bottom,
        firstItemTop: firstItem ? firstItem.getBoundingClientRect().top : null,
      };
    });

    expect(geo.firstItemTop).not.toBeNull();
    expect(geo.firstItemTop).toBeGreaterThanOrEqual(geo.quoteStripBottom);
  });

  test('upsc lag banner (when shown) does not overlap the sticky quote strip', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoAppPinned(page);
    await page.click('.tab-btn[data-tab="upsc"]');
    await expect(page.locator('#tab-upsc')).toHaveClass(/active/);

    // #upscLagBanner is conditionally shown by js/upsc.js only when the
    // user is actually behind schedule — force it visible here to
    // exercise the same geometry a real lagging user would see.
    await page.evaluate(() => {
      const banner = document.getElementById('upscLagBanner');
      banner.textContent = '⚠️ Test: behind schedule';
      banner.style.display = 'block';
    });

    const geo = await page.evaluate(() => {
      const qs = document.getElementById('quoteStrip');
      const banner = document.getElementById('upscLagBanner');
      return {
        quoteStripBottom: qs.getBoundingClientRect().bottom,
        bannerTop: banner.getBoundingClientRect().top,
      };
    });

    expect(geo.bannerTop).toBeGreaterThanOrEqual(geo.quoteStripBottom);
  });
});

test.describe('sac-popover stays on-screen near the left edge', () => {
  test('opening the subject-picker popover near the left edge does not overflow', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 844 });
    await gotoApp(page);

    const addBtn = page.locator('.sac-add-btn').first();
    await addBtn.scrollIntoViewIfNeeded();
    await addBtn.click();

    const popover = page.locator('.sac-popover');
    await expect(popover).toBeVisible();
    const left = await popover.evaluate(el => el.getBoundingClientRect().left);
    expect(left).toBeGreaterThanOrEqual(0);
  });
});

test.describe('info-icon tooltip width clamp on narrow phones', () => {
  test('tooltip max-width shrinks below the base 240px on a genuinely narrow viewport', async ({ page }) => {
    // 240px (the un-clamped base max-width) already fits comfortably
    // within any real phone's 360px+ width, so the clamp is a no-op
    // there — pick a viewport narrow enough that min(240px, 100vw-32px)
    // actually engages, to make this test meaningfully detect a
    // regression rather than trivially passing regardless of the fix.
    // Reads computed style directly (no hover/scroll needed — the
    // media-query max-width applies to ::after regardless of its
    // current display state).
    await page.setViewportSize({ width: 250, height: 844 });
    await gotoApp(page);

    const maxWidthPx = await page.evaluate(() => {
      const icon = document.querySelector('.info-icon');
      const style = getComputedStyle(icon, '::after');
      return parseFloat(style.maxWidth);
    });

    expect(maxWidthPx).toBeLessThan(240);
    expect(maxWidthPx).toBeLessThanOrEqual(250 - 32 + 1);
  });
});
