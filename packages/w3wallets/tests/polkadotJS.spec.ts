import { test as base, expect } from "@playwright/test";
import { withWallets } from "../src/withWallets";
import config from "./utils/config";

const test = withWallets(base, "polkadotJS");

test.beforeEach(async ({ polkadotJS, page }) => {
  await polkadotJS.onboard(config.substrateSeed);
  await page.goto("http://localhost:3000");
  await page.getByRole("button", { name: "Polkadot" }).click();
  await polkadotJS.selectAccount("Test");
  await polkadotJS.approve();
});

test("Can connect the Polkadot{.js} wallet", async ({ page, polkadotJS }) => {
  await expect(page.getByText("status: connected")).toBeVisible();
});

test.skip("Can sign and send a native token transfer", async ({
  page,
  polkadotJS,
}) => {
  await page
    .getByPlaceholder("Recipient")
    .fill("5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty");
  await page.getByPlaceholder("Amount").fill("100");
  await page.getByRole("button", { name: "Send" }).click();

  await polkadotJS.enterPassword();
  await polkadotJS.approve();

  await expect(page.getByTestId("transfer-status")).toHaveText("Success");
});
