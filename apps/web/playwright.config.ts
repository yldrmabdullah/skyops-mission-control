import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
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
