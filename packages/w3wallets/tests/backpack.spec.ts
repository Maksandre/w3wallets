import { test as base, expect } from "@playwright/test";
import { withWallets } from "../src/withWallets";
import config from "./utils/config";

const test = withWallets(base, "backpack", "polkadotJS");

test("Can connect the Backpack wallet", async ({
  page,
  backpack,
  polkadotJS,
}) => {
  await backpack!.onboard("Ethereum", config.ethPrivateKey);
  await page.goto("http://localhost:3000");

  await page.getByRole("button", { name: "Backpack" }).click();

  await backpack!.approve();

  await expect(page.getByText("status: connected")).toBeVisible();
  await expect(page.getByText("success")).toBeVisible();
});

test("Can connect the Polkadot{.js} wallet", async ({ page, polkadotJS }) => {
  await page.goto("http://localhost:3000");

  await page.getByRole("button", { name: "Polkadot" }).click();
});
