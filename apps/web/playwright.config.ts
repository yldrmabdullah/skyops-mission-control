import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 90_000,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
  },
  webServer: [
    {
      command: 'sh ../../scripts/start-e2e-api.sh',
      url: 'http://127.0.0.1:3000/api/reports/fleet-health',
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'sh ../../scripts/start-e2e-web.sh',
      url: 'http://127.0.0.1:4173',
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
