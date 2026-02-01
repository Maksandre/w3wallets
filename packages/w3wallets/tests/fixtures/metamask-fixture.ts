import { test as base, expect } from "@playwright/test";
import { withWallets } from "../../src";
import cachedMetamask from "../wallets-cache/default.cache";
import { EthereumPage } from "../POM";

const metamaskTest = withWallets(base, cachedMetamask).extend<{
  ethereumPage: EthereumPage;
}>({
  metamask: async ({ metamask }, use) => {
    await metamask.unlock();
    await metamask.page
      .getByRole("button", { name: "Open wallet" })
      .click({ timeout: 10000 });
    // Navigate to sidepanel (same as onboard() does at the end)
    await metamask.page.goto(
      `chrome-extension://${metamask.extensionId}/sidepanel.html`,
    );

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

    // Show page
    await page.bringToFront();

    await use(new EthereumPage(page));
  },
});

export { metamaskTest, expect };
