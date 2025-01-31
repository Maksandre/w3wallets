import { test as base, expect } from "@playwright/test";
import { withWallets } from "../src/withWallets";
import config from "./utils/config";

const test = withWallets(base, "polkadotJS");

test("Can connect the Polkadot{.js} wallet", async ({ page, polkadotJS }) => {
  await polkadotJS.onboard(config.substrateSeed);
  await page.goto("http://localhost:3000");

  await page.getByRole("button", { name: "Polkadot" }).click();
  await polkadotJS.selectAccount("Test");
  await polkadotJS.approve();

  await expect(page.getByText("status: connected")).toBeVisible();
});
