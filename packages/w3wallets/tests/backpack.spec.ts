import { test as base, expect } from "@playwright/test";
import { withWallets, backpack } from "../src";
import config from "./utils/config";

const test = withWallets(base, backpack);

test("Can connect the Backpack wallet", async ({ page, backpack }) => {
  await backpack.onboard("Ethereum", config.ethPrivateKeys[0]);
  await page.goto("http://localhost:3000");

  await page.getByRole("button", { name: "Backpack" }).click();

  await backpack.approve();

  await expect(page.getByText("status: connected")).toBeVisible();
  await expect(page.getByText("success")).toBeVisible();
});

test.skip("Can add and switch accounts", async ({ backpack }) => {
  await backpack.onboard("Ethereum", config.ethPrivateKeys[0]);
  await backpack.addAccount("Ethereum", config.ethPrivateKeys[1]);
  await backpack.addAccount("Eclipse", config.eclipsePrivateKey);

  await backpack.switchAccount(1);
  await backpack.switchAccount(3);
  await backpack.switchAccount(2);
});
