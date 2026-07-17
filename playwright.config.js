// Playwright config for Project Arjuna's zero-build vanilla-JS web app.
// No bundler/dev-server package is used — reuses the project's own
// documented local-dev command (README.md) so tests run against the
// exact same static server a developer would use.
const { defineConfig, devices } = require('@playwright/test');

// This sandbox's installed Chromium revision doesn't match what Playwright
// 1.61.1 resolves by default (headless_shell-1228 is absent; only the full
// browser at chromium-1194 exists) — set PLAYWRIGHT_EXECUTABLE_PATH to work
// around it locally. CI (GitHub Actions) has real internet access and runs
// `playwright install --with-deps chromium` fresh, so it never needs this.
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined;

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'retain-on-failure',
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'python3 -m http.server 8080',
    url: 'http://localhost:8080/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
