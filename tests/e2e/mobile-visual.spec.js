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

test.describe('pane-left/pane-right render full width on mobile, not the stale 240px sidebar', () => {
  const targets = [
    { tab: 'today', selector: '#tab-today .pane-left' },
    { tab: 'today', selector: '#tab-today .pane-right' },
    { tab: 'upsc', selector: '#tab-upsc .pane-left' },
    { tab: 'finance', selector: '#tab-finance .pane-left' },
    { tab: 'health', selector: '#tab-health .pane-left' },
    { tab: 'growth', selector: '#tab-growth .pane-left' },
  ];
  for (const { tab, selector } of targets) {
    test(`${selector} at 390px`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await gotoApp(page);
      await page.click(`.tab-btn[data-tab="${tab}"]`);
      await expect(page.locator(`#tab-${tab}`)).toHaveClass(/active/);

      const width = await page.locator(selector).evaluate(el => el.getBoundingClientRect().width);
      const containerWidth = await page.locator('.app-content').evaluate(el => el.getBoundingClientRect().width);
      // 240px was the bug value; a fixed, real pane should comfortably fill
      // the container minus its own side padding, not a stuck-narrow column.
      expect(width).toBeGreaterThan(containerWidth * 0.9);
    });
  }

  test('tablet range (800px) still applies its own untouched 260px rule', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 900 });
    await gotoApp(page);
    await page.click('.tab-btn[data-tab="health"]');
    await expect(page.locator('#tab-health')).toHaveClass(/active/);
    const width = await page.locator('#tab-health .pane-left').evaluate(el => el.getBoundingClientRect().width);
    expect(width).toBeCloseTo(260, 0);
  });
});

test.describe('matrix quadrant never overflows its container, even with a long task title', () => {
  test('long title task row stays within the container width, no horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoApp(page);
    await page.click('.tab-btn[data-tab="tasks"]');
    await expect(page.locator('#tab-tasks')).toHaveClass(/active/);

    await page.fill('#qaTitle', 'Finish drafting the comprehensive quarterly compliance and risk-assessment report for the regional audit committee');
    await page.click('#qaSubmit');
    await page.waitForTimeout(300);

    const geo = await page.evaluate(() => {
      const wrap = document.querySelector('.tasks-main-wrap');
      const quadrants = Array.from(document.querySelectorAll('.matrix-quadrant'));
      return {
        wrapRight: wrap.getBoundingClientRect().right,
        quadrantRights: quadrants.map(q => q.getBoundingClientRect().right),
        docScrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
      };
    });

    for (const right of geo.quadrantRights) {
      expect(right).toBeLessThanOrEqual(geo.wrapRight + 1);
    }
    expect(geo.docScrollWidth).toBeLessThanOrEqual(geo.viewportWidth + 1);
  });
});

test.describe('tasks stats strip separation from the first quadrant card', () => {
  test('no unexplained gap between the stats strip and the first quadrant', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoApp(page);
    await page.click('.tab-btn[data-tab="tasks"]');
    await expect(page.locator('#tab-tasks')).toHaveClass(/active/);

    const geo = await page.evaluate(() => {
      const leftPane = document.querySelector('.tasks-left-pane');
      const firstQuadrant = document.querySelector('.matrix-quadrant');
      return {
        leftPaneBottom: leftPane.getBoundingClientRect().bottom,
        firstQuadrantTop: firstQuadrant.getBoundingClientRect().top,
      };
    });

    // A large gap here would indicate a real layout bug; ordinary
    // card-to-card spacing is small. This was investigated and not
    // reproduced from static CSS reads alone — this measurement is the
    // actual verification, not a guess.
    expect(geo.firstQuadrantTop - geo.leftPaneBottom).toBeLessThan(40);
  });
});

test.describe('.app-content bottom padding stays safe-area-aware on mobile after v66 rescoping', () => {
  test('mobile: bottom padding derives from --navbar-safe-h, not the flat 60px desktop value', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoApp(page);
    const paddingBottom = await page.locator('.app-content').evaluate(el => getComputedStyle(el).paddingBottom);
    expect(parseFloat(paddingBottom)).not.toBeCloseTo(60, 0);
  });

  test('desktop: bottom padding is the flat 60px v66 value', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoApp(page);
    const paddingBottom = await page.locator('.app-content').evaluate(el => getComputedStyle(el).paddingBottom);
    expect(parseFloat(paddingBottom)).toBeCloseTo(60, 0);
  });
});

test.describe('sac-popover Save/Cancel stay reachable on short mobile viewports', () => {
  test('activity popover: Save button is fully on-screen and the save flow completes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    await gotoApp(page);

    const addBtns = page.locator('.sac-add-btn');
    const activityAddBtn = addBtns.nth(1); // subject is index 0, activity is index 1
    await activityAddBtn.scrollIntoViewIfNeeded();
    await activityAddBtn.click();
    await expect(page.locator('.sac-popover')).toBeVisible();

    const geo = await page.evaluate(() => {
      const saveBtn = document.querySelector('.sac-save-btn');
      const r = saveBtn.getBoundingClientRect();
      return {
        top: r.top, bottom: r.bottom, left: r.left, right: r.right,
        viewportHeight: window.innerHeight, viewportWidth: window.innerWidth,
      };
    });
    expect(geo.top).toBeGreaterThanOrEqual(0);
    expect(geo.bottom).toBeLessThanOrEqual(geo.viewportHeight);
    expect(geo.left).toBeGreaterThanOrEqual(0);
    expect(geo.right).toBeLessThanOrEqual(geo.viewportWidth);

    // Prove it end-to-end, not just geometrically: actually save.
    await page.fill('.sac-name-input', 'Playwright Test Activity');
    await page.locator('.sac-save-btn').click();
    await expect(page.locator('.sac-popover')).toHaveCount(0);
  });

  test('subject popover on an extremely short viewport: Save is reachable via internal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 350 });
    await gotoApp(page);

    const subjectAddBtn = page.locator('.sac-add-btn').first();
    await subjectAddBtn.scrollIntoViewIfNeeded();
    await subjectAddBtn.click();
    await expect(page.locator('.sac-popover')).toBeVisible();

    const noOverflow = await page.evaluate(() => {
      const pop = document.querySelector('.sac-popover');
      const r = pop.getBoundingClientRect();
      return r.top >= -1 && r.bottom <= window.innerHeight + 1;
    });
    expect(noOverflow).toBe(true);

    await page.fill('.sac-name-input', 'Extreme Short Viewport Subject');
    const saveBtn = page.locator('.sac-save-btn');
    await saveBtn.scrollIntoViewIfNeeded();
    await saveBtn.click();
    await expect(page.locator('.sac-popover')).toHaveCount(0);
  });
});

test.describe('hdr-dropdown stays within the viewport on short screens', () => {
  test('dropdown with sync/sign-out rows visible does not overflow a short viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 400 });
    await gotoApp(page);

    // Simulate the taller signed-in menu state (sync/sign-out rows shown).
    await page.evaluate(() => {
      document.getElementById('syncNowBtn').style.display = 'inline-flex';
      document.getElementById('syncStatusRow').style.display = 'flex';
      document.getElementById('signOutBtn').style.display = 'inline-flex';
    });

    await page.click('#headerMenuBtn');
    await expect(page.locator('.hdr-dropdown')).toHaveClass(/open/);

    const geo = await page.evaluate(() => {
      const dd = document.querySelector('.hdr-dropdown');
      const r = dd.getBoundingClientRect();
      return { bottom: r.bottom, viewportHeight: window.innerHeight };
    });
    expect(geo.bottom).toBeLessThanOrEqual(geo.viewportHeight + 1);
  });
});
