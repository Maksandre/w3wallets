import { test as base, expect } from "@playwright/test";
import { withWallets } from "../../src";
import cachedMetamask from "../wallets-cache/default.cache";
import { EthereumPage } from "../POM";

const metamaskTest = withWallets(base, cachedMetamask).extend<{
  ethereumPage: EthereumPage;
}>({
  metamask: async ({ metamask }, use) => {
    await metamask.unlock();
    await use(metamask);
  },
  ethereumPage: async ({ page, metamask }, use) => {
    await page.goto("http://localhost:3001");

    // Connect to metamask
    await page.getByRole("button", { name: "MetaMask" }).click();
    await metamask.approve();

    // Approve switch to local network
    await metamask.approve();

    // Wait for connection to be established
    await expect(page.getByTestId("connection-status")).toHaveText("connected");

    // MetaMask 13.55+ permits a chain added via wallet_addEthereumChain
    // without attaching any accounts to it, so every signature or
    // transaction on Anvil is rejected with 4100 (unauthorized).
    // Re-requesting eth_accounts grants the account on all permitted
    // chains, including the newly added Anvil network.
    const accountsRegranted = page.evaluate(() =>
      (
        window as unknown as {
          ethereum: { request(args: unknown): Promise<unknown> };
        }
      ).ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      }),
    );
    await metamask.approve();
    await accountsRegranted;

    // Show page
    await page.bringToFront();

    await use(new EthereumPage(page));
  },
});

export { metamaskTest, expect };
