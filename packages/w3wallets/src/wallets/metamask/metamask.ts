import { expect, type Locator } from "@playwright/test";
import { Wallet } from "../../core/wallet";
import { config } from "../../config";
import type { NetworkSettings } from "./types";
import { debug } from "../../debug";
import {
  POPUP_VISIBILITY_TIMEOUT,
  SHIELD_CLOSE_TIMEOUT,
  ARIA_CLOSE_TIMEOUT,
  POPUP_HIDDEN_TIMEOUT,
  POST_UNLOCK_TIMEOUT,
  NOTIFICATION_CHECK_TIMEOUT,
  CONFIRMATION_ROUTE_TIMEOUT,
  POST_CLICK_TIMEOUT,
  BUTTON_OR_POPUP_TIMEOUT,
  LAST_RESORT_CLICK_TIMEOUT,
  LOCK_SCREEN_TIMEOUT,
  MENU_BUTTON_TIMEOUT,
  MNEMONIC_KEY_DELAY,
  MNEMONIC_WORD_DELAY,
} from "../../timeouts";

export class Metamask extends Wallet {
  private defaultPassword = "TestPassword123!";

  async gotoOnboardPage() {
    await this.page.goto(`chrome-extension://${this.extensionId}/home.html`);
    await expect(
      this.page.getByRole("button", { name: "I have an existing wallet" }),
    ).toBeVisible({ timeout: config.expectTimeout });
  }

  /**
   * Onboard MetaMask with a mnemonic phrase
   * @param mnemonic - 12 or 24 word recovery phrase
   * @param password - Optional password (defaults to TestPassword123!)
   */
  async onboard(mnemonic: string, password?: string) {
    debug("metamask.onboard: starting");
    const pwd = password ?? this.defaultPassword;
    await this.gotoOnboardPage();

    // Step 1: Click "I have an existing wallet"
    await this.page
      .getByRole("button", { name: "I have an existing wallet" })
      .click();

    // Step 2: Click "Import using Secret Recovery Phrase"
    await this.page
      .getByRole("button", { name: "Import using Secret Recovery Phrase" })
      .click();

    // Step 3: Type mnemonic into the SRP input.
    // MetaMask 13.18+ uses an SRP input that starts as a textarea and
    // transitions to individual word fields after the first Space/Enter.
    // We click the textarea to focus it, type the first word, then press
    // Space to trigger the word field creation. Subsequent words are typed
    // into the focused word field that MetaMask creates.
    const srpTextarea = this.page.getByTestId("srp-input-import__srp-note");
    await srpTextarea.click();

    const words = mnemonic.split(" ");
    for (let i = 0; i < words.length; i++) {
      await this.page.keyboard.type(words[i]!, { delay: MNEMONIC_KEY_DELAY });
      if (i < words.length - 1) {
        await this.page.keyboard.press("Space");
        // Wait for MetaMask to process the word and create/focus the next input
        await this.page.waitForTimeout(MNEMONIC_WORD_DELAY);
      }
    }

    // Step 4: Wait for Continue button to be enabled and click.
    // MetaMask validates the full mnemonic (BIP39 checksum) before enabling.
    const continueBtn = this.page.getByTestId("import-srp-confirm");
    await expect(continueBtn).toBeEnabled({ timeout: config.expectTimeout });
    await continueBtn.click();

    // Step 5: Fill password fields
    const passwordInputs = this.page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill(pwd);
    await passwordInputs.nth(1).fill(pwd);

    // Step 6: Check the terms checkbox
    await this.page.getByRole("checkbox").click();

    // Step 7: Click "Create password"
    await this.page.getByRole("button", { name: "Create password" }).click();

    // Step 8: Handle "Help improve MetaMask" screen
    const metametricsBtn = this.page.getByTestId("metametrics-i-agree");
    await metametricsBtn.click();

    // Step 9: Handle "Your wallet is ready!" screen
    const openWalletBtn = this.page.getByRole("button", {
      name: /open wallet/i,
    });
    await openWalletBtn.click();

    // Step 10: Navigate to home page to trigger full UI initialization
    // (token list fetches, network state, etc.), then to sidepanel.
    await this.page.goto(`chrome-extension://${this.extensionId}/home.html`);
    await this.page.goto(
      `chrome-extension://${this.extensionId}/sidepanel.html`,
    );
    debug("metamask.onboard: complete");
  }

  /**
   * Dismiss MetaMask promotional popups (e.g., "Transaction Shield")
   * that may overlay the confirmation UI.
   */
  async dismissPopups() {
    debug("metamask.dismissPopups: checking for popups");
    const popup = this.page.getByText(/Transaction Shield|free trial/i);
    if (
      !(await popup
        .first()
        .isVisible({ timeout: POPUP_VISIBILITY_TIMEOUT })
        .catch(() => false))
    ) {
      return;
    }

    // Strategy 1: data-testid close button
    const shieldClose = this.page.getByTestId(
      "shield-entry-modal-close-button",
    );
    if (
      await shieldClose
        .isVisible({ timeout: SHIELD_CLOSE_TIMEOUT })
        .catch(() => false)
    ) {
      await shieldClose.click();
      if (await this.waitForPopupHidden(popup)) return;
    }

    // Strategy 2: aria-label close button
    const closeByAria = this.page.locator('button[aria-label="close"]').first();
    if (
      await closeByAria
        .isVisible({ timeout: ARIA_CLOSE_TIMEOUT })
        .catch(() => false)
    ) {
      await closeByAria.click();
      if (await this.waitForPopupHidden(popup)) return;
    }

    // Strategy 3: Escape key
    await this.page.keyboard.press("Escape");
    await this.waitForPopupHidden(popup);
  }

  private async waitForPopupHidden(popup: Locator): Promise<boolean> {
    try {
      await popup
        .first()
        .waitFor({ state: "hidden", timeout: POPUP_HIDDEN_TIMEOUT });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * After unlock, MetaMask may show onboarding screens, queued
   * notifications, or go straight to the wallet UI. Race all possible
   * states in a single wait to avoid sequential timeout penalties.
   */
  private async stabilizePostUnlock() {
    debug("metamask.stabilizePostUnlock: racing post-unlock states");
    const metametricsBtn = this.page.getByTestId("metametrics-i-agree");
    const openWalletBtn = this.page.getByRole("button", {
      name: /open wallet/i,
    });
    const readyIndicator = this.page.getByTestId("account-options-menu-button");

    // Race: whichever post-unlock state appears first wins.
    // Includes confirmation-cancel-button to catch queued notifications
    // (Solana/Tron account removal) that ConfirmationHandler auto-routes to.
    // When there's only 1 notification, "Reject all" isn't rendered.
    const rejectAllBtn = this.page.getByText("Reject all");
    const notificationCancelBtn = this.page.getByTestId(
      "confirmation-cancel-button",
    );

    const state = await Promise.race([
      metametricsBtn
        .waitFor({ state: "visible", timeout: POST_UNLOCK_TIMEOUT })
        .then(() => "metametrics" as const),
      openWalletBtn
        .waitFor({ state: "visible", timeout: POST_UNLOCK_TIMEOUT })
        .then(() => "openWallet" as const),
      rejectAllBtn
        .waitFor({ state: "visible", timeout: POST_UNLOCK_TIMEOUT })
        .then(() => "rejectAll" as const),
      notificationCancelBtn
        .waitFor({ state: "visible", timeout: POST_UNLOCK_TIMEOUT })
        .then(() => "notification" as const),
      readyIndicator
        .waitFor({ state: "visible", timeout: POST_UNLOCK_TIMEOUT })
        .then(() => "ready" as const),
    ]).catch(() => "timeout" as const);

    debug(`metamask.stabilizePostUnlock: state=${state}`);

    if (state === "timeout") {
      debug(
        `metamask.stabilizePostUnlock: timeout after ${POST_UNLOCK_TIMEOUT}ms. ` +
          `URL: ${this.page.url()}. ` +
          `Checked: metametrics-i-agree, open-wallet button, Reject all, confirmation-cancel-button, account-options-menu-button`,
      );
    }

    if (state === "metametrics") {
      await metametricsBtn.click();
      if (
        await openWalletBtn
          .isVisible({ timeout: POPUP_HIDDEN_TIMEOUT })
          .catch(() => false)
      ) {
        await openWalletBtn.click();
      }
    }
    if (state === "openWallet") {
      await openWalletBtn.click();
    }

    // After handling onboarding screens, or if we landed on a notification,
    // dismiss all queued notifications before proceeding.
    if (state !== "ready") {
      await this.dismissQueuedNotifications();
    }
  }

  /**
   * Dismiss all queued MetaMask notifications (e.g., Solana/Tron account
   * removal). These use the templated confirmation flow at #/confirmation/...
   * If multiple are queued, "Reject all" appears; if only one, just
   * confirmation-cancel-button is available.
   */
  private async dismissQueuedNotifications() {
    const homeUrl = `chrome-extension://${this.extensionId}/home.html`;
    const readyIndicator = this.page.getByTestId("account-options-menu-button");
    const rejectAllBtn = this.page.getByText("Reject all");
    const notificationCancelBtn = this.page.getByTestId(
      "confirmation-cancel-button",
    );

    // Navigate to home to trigger ConfirmationHandler evaluation.
    await this.page.goto(homeUrl);

    // Loop: dismiss notifications one at a time until the wallet UI appears.
    for (let i = 0; i < 10; i++) {
      const state = await Promise.race([
        readyIndicator
          .waitFor({ state: "visible", timeout: NOTIFICATION_CHECK_TIMEOUT })
          .then(() => "ready" as const),
        rejectAllBtn
          .waitFor({ state: "visible", timeout: NOTIFICATION_CHECK_TIMEOUT })
          .then(() => "rejectAll" as const),
        notificationCancelBtn
          .waitFor({ state: "visible", timeout: NOTIFICATION_CHECK_TIMEOUT })
          .then(() => "notification" as const),
      ]).catch(() => "timeout" as const);

      if (state === "ready") return;

      if (state === "rejectAll") {
        await rejectAllBtn.click();
        await this.page.goto(homeUrl);
        continue;
      }

      if (state === "notification") {
        await notificationCancelBtn.click();
        await this.page.goto(homeUrl);
        continue;
      }

      // Timeout — check if we're on a confirmation route we can't see
      debug(
        `metamask.dismissQueuedNotifications: timeout at iteration ${i}. URL: ${this.page.url()}`,
      );
      break;
    }

    await expect(readyIndicator).toBeVisible({ timeout: POST_UNLOCK_TIMEOUT });
  }

  /**
   * Wait for a target button while handling the Transaction Shield popup.
   * Always navigates to sidepanel.html fresh so MetaMask's
   * ConfirmationHandler can route to the pending approval.
   */
  private async waitAndClickButton(btnLocator: Locator) {
    debug(`metamask.waitAndClickButton: navigating to sidepanel`);
    const popup = this.page.getByText(/Transaction Shield|free trial/i);
    const sidepanelUrl = `chrome-extension://${this.extensionId}/sidepanel.html`;
    // MetaMask uses HashRouter, so routes appear as #/confirm-transaction/...
    const confirmRoutePattern =
      /#\/(confirm-transaction|connect|confirmation)\b/;

    // Helper: wait for button or popup, return what appeared first.
    const waitForButtonOrPopup = (timeout: number) =>
      Promise.race([
        btnLocator
          .first()
          .waitFor({ state: "visible", timeout })
          .then(() => "button" as const),
        popup
          .first()
          .waitFor({ state: "visible", timeout })
          .then(() => "popup" as const),
      ]).catch(() => "timeout" as const);

    // Helper: handle popup then click, then wait for confirmation to complete.
    const handlePopupAndClick = async () => {
      await this.dismissPopups();
      await btnLocator
        .first()
        .waitFor({ state: "visible", timeout: BUTTON_OR_POPUP_TIMEOUT });
      await btnLocator.first().click();
    };

    // Always navigate to sidepanel.html fresh. This resets the
    // ConfirmationHandler so it re-evaluates pending approvals.
    // Without this, a stale confirmation URL from a previous approval
    // can cause us to click a leftover button that does nothing.
    await this.page.goto(sidepanelUrl);
    try {
      await this.page.waitForURL(confirmRoutePattern, {
        timeout: CONFIRMATION_ROUTE_TIMEOUT,
      });
    } catch {
      // Retry: the service worker may not have synced the pending
      // approval to the UI state store on the first load.
      console.warn(
        `[w3wallets] confirmation route not found, retrying. URL: ${this.page.url()}`,
      );
      await this.page.goto(sidepanelUrl);
      try {
        await this.page.waitForURL(confirmRoutePattern, {
          timeout: CONFIRMATION_ROUTE_TIMEOUT,
        });
      } catch {
        console.warn(
          `[w3wallets] confirmation route not found after retry. URL: ${this.page.url()}`,
        );
      }
    }

    // Now wait for the actual button or popup to appear.
    const result = await waitForButtonOrPopup(BUTTON_OR_POPUP_TIMEOUT);
    debug(
      `metamask.waitAndClickButton: result=${result}, URL=${this.page.url()}`,
    );

    if (result === "button") {
      await btnLocator.first().click();
      // Wait for MetaMask to process the approval and navigate away
      // from the confirmation route, so the next call doesn't see
      // stale state.
      await this.page
        .waitForURL((url) => !confirmRoutePattern.test(url.toString()), {
          timeout: POST_CLICK_TIMEOUT,
        })
        .catch(() => {
          console.warn(
            `[w3wallets] still on confirmation route after click. URL: ${this.page.url()}`,
          );
        });
      return;
    }

    if (result === "popup") {
      await handlePopupAndClick();
      await this.page
        .waitForURL((url) => !confirmRoutePattern.test(url.toString()), {
          timeout: POST_CLICK_TIMEOUT,
        })
        .catch(() => {
          console.warn(
            `[w3wallets] still on confirmation route after popup dismiss. URL: ${this.page.url()}`,
          );
        });
      return;
    }

    // All strategies exhausted — let Playwright's actionability checks
    // produce a clear error with the element state.
    const isOnConfirmRoute = confirmRoutePattern.test(this.page.url());
    debug(
      `metamask.waitAndClickButton: timeout after ${BUTTON_OR_POPUP_TIMEOUT}ms. ` +
        `URL: ${this.page.url()}, onConfirmRoute: ${isOnConfirmRoute}`,
    );
    console.warn(
      `[w3wallets] no button or popup found after ${BUTTON_OR_POPUP_TIMEOUT / 1000}s. URL: ${this.page.url()}`,
    );
    await btnLocator.first().click({ timeout: LAST_RESORT_CLICK_TIMEOUT });
  }

  async approve() {
    debug("metamask.approve: starting");
    const confirmBtn = this.page
      .getByTestId("confirm-btn")
      .or(this.page.getByTestId("confirm-footer-button"))
      .or(this.page.getByTestId("page-container-footer-next"))
      .or(this.page.getByRole("button", { name: /^confirm$/i }));

    await this.waitAndClickButton(confirmBtn);
  }

  async deny() {
    debug("metamask.deny: starting");
    const cancelBtn = this.page
      .getByTestId("cancel-btn")
      .or(this.page.getByTestId("confirm-footer-cancel-button"))
      .or(this.page.getByTestId("page-container-footer-cancel"))
      .or(this.page.getByRole("button", { name: /^cancel$/i }))
      .or(this.page.getByRole("button", { name: /^reject$/i }));

    await this.waitAndClickButton(cancelBtn);
  }

  /**
   * Lock the MetaMask wallet
   */
  async lock() {
    debug("metamask.lock: starting");
    // Navigate to home.html to ensure the main wallet UI is visible.
    // Sidepanel may show notification overlays (e.g., Solana account removal)
    // that block access to the settings menu.
    await this.page.goto(`chrome-extension://${this.extensionId}/home.html`);
    const menuBtn = this.page.getByTestId("account-options-menu-button");
    await menuBtn.waitFor({ state: "visible", timeout: MENU_BUTTON_TIMEOUT });
    await menuBtn.click();

    // Click "Log out" menu item (formerly "Lock MetaMask")
    await this.page.locator("text=Log out").click();
  }

  /**
   * Unlock MetaMask with password.
   * After unlocking, stabilizes the wallet UI by handling post-unlock
   * screens (metametrics, onboarding completion) and dismissing queued
   * notifications. Ends on home.html with the wallet UI ready.
   */
  async unlock(password?: string) {
    debug("metamask.unlock: starting");
    const pwd = password ?? this.defaultPassword;

    // Navigate to home.html to show the lock screen reliably.
    await this.page.goto(`chrome-extension://${this.extensionId}/home.html`);

    const passwordInput = this.page.getByTestId("unlock-password");
    await passwordInput.fill(pwd);

    await this.page.getByTestId("unlock-submit").click();

    // Wait for MetaMask to finish unlocking (lock screen disappears)
    await this.page.waitForSelector('[data-testid="unlock-password"]', {
      state: "hidden",
      timeout: LOCK_SCREEN_TIMEOUT,
    });

    // After cache restore, MetaMask may show onboarding screens,
    // queued notifications, or go straight to the wallet UI.
    // Race all possible post-unlock states to avoid sequential timeouts.
    // Ends on home.html with the wallet UI ready.
    await this.stabilizePostUnlock();
    debug("metamask.unlock: complete");
  }

  /**
   * Switch to an existing network in MetaMask
   * @param networkName - Name of the network to switch to (e.g., "Ethereum Mainnet", "Sepolia")
   */
  async switchNetwork(
    networkName: string,
    networkType: "Popular" | "Custom" = "Popular",
  ) {
    debug(`metamask.switchNetwork: ${networkName} (${networkType})`);
    // Click the network picker button
    await this.page.getByTestId("sort-by-networks").click();
    if (networkType === "Custom") {
      await this.page.getByRole("tab", { name: "Custom" }).click();
    }
    await this.page.getByText(networkName).click();

    // Wait for the network list to appear and click the desired network
    await expect(this.page.getByTestId("sort-by-networks")).toHaveText(
      networkName,
      { timeout: config.expectTimeout },
    );
  }

  async switchAccount(accountName: string) {
    // Click the network picker button
    await this.page.getByTestId("account-menu-icon").click();
    await this.page.getByText(accountName, { exact: true }).click();
  }

  /**
   * Add a custom network to MetaMask
   */
  async addNetwork(network: NetworkSettings) {
    await this.page.goto(
      `chrome-extension://${this.extensionId}/home.html#settings/networks/add-network`,
    );

    await this.page.getByTestId("network-form-network-name").fill(network.name);
    await this.page.getByTestId("network-form-rpc-url").fill(network.rpc);
    await this.page
      .getByTestId("network-form-chain-id")
      .fill(network.chainId.toString());
    await this.page
      .getByTestId("network-form-ticker-input")
      .fill(network.currencySymbol);

    await this.page.getByRole("button", { name: /save/i }).click();
  }

  async addCustomNetwork(settings: NetworkSettings) {
    await this.page.getByTestId("account-options-menu-button").click();
    await this.page.getByTestId("global-menu-networks").click();
    await this.page
      .getByRole("button", { name: "Add a custom network" })
      .click();
    await this.page
      .getByTestId("network-form-network-name")
      .fill(settings.name);
    await this.page
      .getByTestId("network-form-chain-id")
      .fill(settings.chainId.toString());
    await this.page
      .getByTestId("network-form-ticker-input")
      .fill(settings.currencySymbol);

    await this.page.getByTestId("test-add-rpc-drop-down").click();
    await this.page.getByRole("button", { name: "Add RPC URL" }).click();
    await this.page.getByTestId("rpc-url-input-test").fill(settings.rpc);
    await this.page.getByRole("button", { name: "Add URL" }).click();
    await this.page.getByRole("button", { name: "Save" }).click();
  }

  async enableTestNetworks() {
    await this.page.getByTestId("account-options-menu-button").click();
    await this.page.getByTestId("global-menu-networks").click();
    await this.page
      .locator("text=Show test networks >> xpath=following-sibling::label")
      .click();
    await this.page.keyboard.press("Escape");
  }

  async importAccount(privateKey: string) {
    debug("metamask.importAccount: starting");
    await this.page.getByTestId("account-menu-icon").click();
    await this.page.getByTestId("account-list-add-wallet-button").click();
    await this.page.getByTestId("add-wallet-modal-import-account").click();
    await this.page.locator("#private-key-box").fill(privateKey);
    await this.page.getByTestId("import-account-confirm-button").click();
    await this.page.getByRole("button", { name: "Back" }).click();
  }

  async accountNameIs(accountName: string) {
    await expect(this.page.getByTestId("account-menu-icon")).toContainText(
      accountName,
      { timeout: config.expectTimeout },
    );
  }
}
