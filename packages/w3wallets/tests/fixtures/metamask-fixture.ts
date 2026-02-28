import { test as base, expect } from "@playwright/test";
import { withWallets } from "../../src";
import cachedMetamask from "../wallets-cache/default.cache";
import { EthereumPage } from "../POM";

const metamaskTest = withWallets(base, cachedMetamask).extend<{
  ethereumPage: EthereumPage;
}>({
  metamask: async ({ metamask }, use) => {
    await metamask.unlock();
    // Wait for MetaMask to fully unlock before navigating
    await expect(
      metamask.page.getByTestId("account-options-menu-button"),
    ).toBeVisible({ timeout: 30_000 });

    // Navigate to sidepanel for MetaMask's notification/approval UI
    await metamask.page.goto(
      `chrome-extension://${metamask.extensionId}/sidepanel.html`,
    );

    // Dismiss any queued notifications (e.g., Tron account removal)
    // that MetaMask may show on first load after cache restore
    const rejectAllBtn = metamask.page.getByText("Reject all");
    if (await rejectAllBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await rejectAllBtn.click();
    }

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
