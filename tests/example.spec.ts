import { test as base } from "@playwright/test";
import { withWallets } from "../src/withWallets";

const test = withWallets(base, { backpack: true });

test("has title", async ({ page, backpack }) => {
  await page.goto("https://playwright.dev/");

  await backpack.onboard(
    "4wDJd9Ds5ueTdS95ReAZGSBVkjMcNKbgZk47xcmqzpUJjCt7VoB2Cs7hqwXWRnopzXqE4mCP6BEDHCYrFttEcBw2",
  );
});
