import { test as base, expect } from "@playwright/test";
import { withWallets } from "w3wallets";
import config from "./utils/config";

const test = withWallets(base, 'metamask');

test("Can connect the Metamask wallet", async ({ page, metamask }) => {
  await metamask.onboard(config.ethMnemonic);
  await page.goto("http://localhost:3000");
  await page.getByRole("button", {name: "MetaMask"}).click();
  await metamask.approve();
  await expect(page.getByText("status: connected")).toBeVisible();

  await page.getByRole('button', {name: "Disconnect"}).click();
  await expect(page.getByText("status: connected")).toBeHidden();
});
