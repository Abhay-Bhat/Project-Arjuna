// Shared navigation helper for specs that interact with the tab nav / UI.
// A fresh browser context has no skadi_onboarding_done flag, so the
// onboarding modal auto-opens on first launch and intercepts every click
// underneath it — seed it as already-dismissed so specs test the app's
// actual tab/modal/nav behavior, not the onboarding flow itself.
async function gotoApp(page, path = '/index.html') {
  await page.addInitScript(() => {
    try { localStorage.setItem('skadi_onboarding_done', 'true'); } catch (e) {}
  });
  await page.goto(path);
  await page.waitForSelector('#appLoader.al-done', { timeout: 15000 });
}

module.exports = { gotoApp };
