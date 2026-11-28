import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4399',
    // GitHub's ubuntu runner ships Chrome; using it avoids a browser download
    // in CI. Local runs use the bundled Chromium.
    channel: process.env.CI ? 'chrome' : undefined,
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'node web/server.cjs 4399',
    url: 'http://127.0.0.1:4399/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
