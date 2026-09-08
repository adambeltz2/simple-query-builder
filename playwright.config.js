// @ts-check
const fs = require('fs');
const { defineConfig, devices } = require('@playwright/test');

// Some pre-provisioned sandboxes ship a pinned Chromium build outside
// Playwright's normal cache (see PLAYWRIGHT_BROWSERS_PATH), which can be
// a different build than the one `@playwright/test` expects. Prefer it
// automatically when present; PLAYWRIGHT_CHROMIUM_PATH can also override
// explicitly. Elsewhere (a normal dev machine or CI running
// `playwright install`), neither is set and Playwright resolves its own
// managed browser as usual.
const SANDBOX_CHROMIUM = '/opt/pw-browsers/chromium';
const chromiumExecutablePath =
  process.env.PLAYWRIGHT_CHROMIUM_PATH ||
  (fs.existsSync(SANDBOX_CHROMIUM) ? SANDBOX_CHROMIUM : undefined);

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'python3 -m http.server 4173',
    url: 'http://127.0.0.1:4173/index.html',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath: chromiumExecutablePath,
        },
      },
    },
  ],
});
