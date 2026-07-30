import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: './tests/e2e/global-setup.js',
  // Browsers are launched by tests/e2e/fixtures.js, which needs a persistent
  // profile per target; the projects only select which build to install.
  projects: [
    {
      name: 'chromium',
      use: { target: 'chromium' },
    },
    {
      name: 'firefox',
      use: { target: 'firefox' },
    },
  ],
});
