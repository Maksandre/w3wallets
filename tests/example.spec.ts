import { test as base, expect } from "@playwright/test";
import { withExtensions } from "../src/withExtension";

const test = withExtensions(base, { backpack: true });

test("has title", async ({ page }) => {
  await page.goto("https://playwright.dev/");

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);
});
