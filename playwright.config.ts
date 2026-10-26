import { defineConfig, devices } from "@playwright/test";

// The end-to-end tests run against the production build and a mock Laravel API, so they never touch your real data.
//   npm run build && npx playwright install chromium && npm run test:e2e
const APP_PORT = 3011;
const MOCK_PORT = 8011;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    trace: "retain-on-failure",
    locale: "en-US",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    { command: `node tests/mock-api.mjs ${MOCK_PORT}`, url: `http://127.0.0.1:${MOCK_PORT}/api/cities`, reuseExistingServer: !process.env.CI },
    {
      command: `npx next start -p ${APP_PORT}`,
      url: `http://localhost:${APP_PORT}/en`,
      env: { API_INTERNAL_URL: `http://127.0.0.1:${MOCK_PORT}`, NODE_ENV: "production" },
      reuseExistingServer: !process.env.CI,
    },
  ],
});
