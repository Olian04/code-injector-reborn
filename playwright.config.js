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
  // Extension tests use a custom persistent Chromium context from fixtures;
  // do not launch a default browser project.
  projects: [
    {
      name: 'chromium-extension',
      use: {
        // Real browser launch is owned by tests/e2e/fixtures.js
      },
    },
  ],
});
