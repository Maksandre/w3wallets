import { test as base, expect } from "@playwright/test";
import { withWallets } from "../src/withWallets";
import config from "./utils/config";
import { sleep } from "./utils/sleep";

const test = withWallets(base, "metamask");

test.beforeEach(async ({metamask}) => {
  await metamask.onboard(config.ethMnemonic);

  // TODO: to close solana promo popup
  await metamask.page.locator(".page-container__header-close").click();
});

test("Can connect the Metamask wallet", async ({ page, metamask }) => {
  await page.goto("http://localhost:3000");
  await page.getByRole("button", { name: "MetaMask" }).click();
  await metamask.approve();
  await expect(page.getByText("status: connected")).toBeVisible();

  await page.getByRole("button", { name: "Disconnect" }).click();
  await expect(page.getByText("status: connected")).toBeHidden();
});

test("Can switch existing network", async ({ page, metamask }) => {
  await metamask.connectToNetwork("Mega Testnet");
});

test("Can connect to custom network", async ({ page, metamask }) => {
  await metamask.connectToNetwork({
    chainId: 998,
    name: "Hyper",
    rpc: "https://rpc.hyperliquid-testnet.xyz/evm",
    currencySymbol: "HYPE",
  });
});

test("Can import account and switch between accounts", async ({ metamask }) => {
  const getAccountName = async () => {
    await sleep(2000);
    return metamask.getAccountName();
  };
  const currentAccount1 = await getAccountName();

  await metamask.importAccount(config.ethPrivateKeys[1]);
  const currentAccount2 = await getAccountName();
  expect(currentAccount2).not.toEqual(currentAccount1);

  await metamask.switchAccount("Account 1");
  const currentAccount3 = await getAccountName();
  expect(currentAccount3).toEqual("Account 1");
});