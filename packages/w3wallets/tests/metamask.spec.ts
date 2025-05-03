import { test as base, expect } from "@playwright/test";
import { withWallets } from "../src/withWallets";
import config from "./utils/config";

const test = withWallets(base, "metamask");

test("Can connect the Metamask wallet", async ({ page, metamask }) => {
  await metamask.onboard(config.ethMnemonic);
  await page.goto("http://localhost:3000");
  await page.getByRole("button", { name: "MetaMask" }).click();
  await metamask.approve();
  await expect(page.getByText("status: connected")).toBeVisible();

  await page.getByRole("button", { name: "Disconnect" }).click();
  await expect(page.getByText("status: connected")).toBeHidden();
});

test("Can switch existing network", async ({ page, metamask }) => {
  await metamask.onboard(config.ethMnemonic);
  await metamask.connectToNetwork("Mega Testnet");
});

test("Can connect to custom network", async ({ page, metamask }) => {
  await metamask.onboard(config.ethMnemonic);
  await metamask.connectToNetwork({
    chainId: 998,
    name: "Hyper",
    rpc: "https://rpc.hyperliquid-testnet.xyz/evm",
    currencySymbol: "HYPE",
  });
});