import { defineConfig, devices } from "@playwright/test";
import config from "./tests/utils/config";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  // retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: config.baseURL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "retain-on-failure",
    headless: true,
    screenshot: "only-on-failure",
  },

  timeout: 120_000,

  projects: [
    {
      name: "local",
      use: { ...devices["Desktop Chrome"], headless: false },
    },
    {
      name: "ci",
      use: { ...devices["Desktop Chrome"], headless: true },
    },
  ],
});
