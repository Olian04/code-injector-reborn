import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  // Specs share beforeAll fixture servers within a file; keep those serial.
  // Different files still run across workers (each launches its own browser).
  fullyParallel: false,
  workers: process.env.CI ? 2 : 4,
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
