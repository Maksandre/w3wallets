import { test as base, expect } from "@playwright/test";
import { withWallets } from "../../src";
import cachedMetamask from "../wallets-cache/default.cache";
import { EthereumPage } from "../POM";

const metamaskTest = withWallets(base, cachedMetamask).extend<{
  ethereumPage: EthereumPage;
}>({
  metamask: async ({ metamask }, use) => {
    await metamask.unlock();

    // After cache restore, MetaMask may re-show onboarding completion screens.
    // Handle "Help improve MetaMask" (metametrics) and "Your wallet is ready!"
    // screens before expecting the main wallet UI.
    const metametricsBtn = metamask.page.getByTestId("metametrics-i-agree");
    if (
      await metametricsBtn.isVisible({ timeout: 3_000 }).catch(() => false)
    ) {
      await metametricsBtn.click();
    }

    const openWalletBtn = metamask.page.getByRole("button", {
      name: /open wallet/i,
    });
    if (
      await openWalletBtn.isVisible({ timeout: 3_000 }).catch(() => false)
    ) {
      await openWalletBtn.click();
    }

    // Navigate to home.html explicitly to ensure we reach the main wallet UI.
    // After cache restore, MetaMask may show notification screens instead of
    // the main UI. Navigating to home.html forces the wallet home view.
    await metamask.page.goto(
      `chrome-extension://${metamask.extensionId}/home.html`,
    );

    // Wait for MetaMask main UI to be ready
    await expect(
      metamask.page.getByTestId("account-options-menu-button"),
    ).toBeVisible({ timeout: 30_000 });

    // Navigate to sidepanel and pre-emptively disable the Transaction Shield popup.
    // We wait for the sidepanel to load (account-menu-icon visible) so LavaMoat
    // has time to initialize, then set the storage flag to prevent the popup from
    // appearing during approve/deny calls.
    await metamask.page.goto(
      `chrome-extension://${metamask.extensionId}/sidepanel.html`,
    );
    await expect(
      metamask.page.getByTestId("account-menu-icon"),
    ).toBeVisible({ timeout: 30_000 });
    await metamask.disableShieldPopup();

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
