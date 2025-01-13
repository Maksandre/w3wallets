import { test as base, expect } from "@playwright/test";
import { withWallets } from "w3wallets";

const test = withWallets(base, { backpack: true });

test("can do something", async ({ page }) => {
  await page.goto("http://localhost:3000");

  const backpack = page.getByRole("button", { name: "backpack" });
  await backpack.click();
});
