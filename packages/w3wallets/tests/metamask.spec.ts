import { test as base, expect } from "@playwright/test";
import { withWallets } from "../src/withWallets";
import config from "./utils/config";
import { sleep } from "./utils/sleep";

const test = withWallets(base, "metamask");

test.beforeEach(async ({ metamask }) => {
  await metamask.onboard(config.ethMnemonic);
});

test.describe("Metamask", () => {
  test("Can connect the Metamask wallet", async ({ page, metamask }) => {
    await page.goto("http://localhost:3000");
    await page.getByRole("button", { name: "MetaMask" }).click();
    await metamask.approve();
    await expect(page.getByText("status: connected")).toBeVisible();

    await page.getByRole("button", { name: "Disconnect" }).click();
    await expect(page.getByText("status: connected")).toBeHidden();
  });

  test("Can switch existing network", async ({ metamask }) => {
    await metamask.connectToNetwork("Arbitrum One");
  });

  test("Can connect to custom network", async ({ metamask }) => {
    await metamask.connectToNetwork({
      chainId: 998,
      name: "Hyper",
      rpc: "https://rpc.hyperliquid-testnet.xyz/evm",
      currencySymbol: "HYPE",
    });
  });

  test("Can import account and switch between accounts", async ({
    metamask,
  }) => {
    const getAccountName = async () => {
      await sleep(2000);
      return metamask.getAccountName();
    };
    const currentAccount1 = await getAccountName();

    await metamask.importAccount(config.ethPrivateKeys[1]);
    const currentAccount2 = await getAccountName();
    expect(currentAccount2).not.toEqual(currentAccount1);

    await metamask.switchAccount({ name: "Account 1" });
    const currentAccount3 = await getAccountName();
    expect(currentAccount3).toEqual("Account 1");
  });

  test("Can add a custom network and switch account", async ({ metamask }) => {
    await metamask.connectToNetwork({
      chainId: 123420001114,
      currencySymbol: "CAMP",
      name: "Basecamp",
      rpc: "https://rpc-campnetwork.xyz",
    });

    await metamask.importAccount(config.ethPrivateKeys[1]);
    await metamask.switchAccount({ name: "Account 1" });
  });

  test("Can switch account by address", async ({ metamask }) => {
    await metamask.importAccount(config.ethPrivateKeys[1]);
    await metamask.switchAccount({
      address: "0x5b7BDE2eF040354Ba49d9c30e492c91391B5b353",
    });
  });
});
