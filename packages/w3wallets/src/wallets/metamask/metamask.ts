import { expect } from "@playwright/test";
import { Wallet } from "../../core/wallet";
import { config } from "../../config";
import type { NetworkSettings } from "./types";

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
      await this.page.keyboard.type(words[i]!, { delay: 5 });
      if (i < words.length - 1) {
        await this.page.keyboard.press("Space");
        // Wait for MetaMask to process the word and create/focus the next input
        await this.page.waitForTimeout(100);
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
  }

  /**
   * Dismiss MetaMask promotional popups (e.g., "Transaction Shield")
   * that may overlay the confirmation UI.
   */
  async dismissPopups() {
    // Detect the popup by its characteristic text content.
    const popup = this.page.getByText(/Transaction Shield|free trial/i);
    if (!(await popup.first().isVisible({ timeout: 2_000 }).catch(() => false))) {
      return;
    }

    // Try the exact data-testid for the shield modal close button first.
    const shieldClose = this.page.getByTestId("shield-entry-modal-close-button");
    if (await shieldClose.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await shieldClose.click();
      await popup
        .first()
        .waitFor({ state: "hidden", timeout: 3_000 })
        .catch(() => {});
      if (!(await popup.first().isVisible().catch(() => false))) {
        return;
      }
    }

    // Try aria-label (lowercase "close" as MetaMask uses it).
    const closeByAria = this.page.locator('button[aria-label="close"]').first();
    if (await closeByAria.isVisible({ timeout: 500 }).catch(() => false)) {
      await closeByAria.click();
      await popup
        .first()
        .waitFor({ state: "hidden", timeout: 3_000 })
        .catch(() => {});
      if (!(await popup.first().isVisible().catch(() => false))) {
        return;
      }
    }

    // Try pressing Escape
    await this.page.keyboard.press("Escape");
    await popup
      .first()
      .waitFor({ state: "hidden", timeout: 2_000 })
      .catch(() => {});
    if (!(await popup.first().isVisible().catch(() => false))) {
      return;
    }

    // Final fallback: use JavaScript to click the close button and hide the modal.
    // Wrapped in try/catch because LavaMoat may block page.evaluate() on
    // MetaMask extension pages by scuttling setInterval.
    try {
      await this.page.evaluate(() => {
        // Click the close button by data-testid
        const closeBtn = document.querySelector(
          '[data-testid="shield-entry-modal-close-button"]',
        ) as HTMLElement | null;
        if (closeBtn) {
          closeBtn.click();
          return;
        }

        // Find and hide the modal overlay
        let modal: HTMLElement | null = null;
        const walk = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
        );
        while (walk.nextNode()) {
          const text = walk.currentNode.textContent || "";
          if (
            text.includes("Transaction Shield") ||
            text.includes("free trial")
          ) {
            let el = walk.currentNode.parentElement;
            while (el && el !== document.body) {
              const style = getComputedStyle(el);
              if (
                style.position === "fixed" ||
                style.position === "absolute"
              ) {
                modal = el;
              }
              el = el.parentElement;
            }
            break;
          }
        }
        if (modal) modal.style.display = "none";
      });
    } catch {
      // LavaMoat may block evaluate; continue without it
    }
    await popup
      .first()
      .waitFor({ state: "hidden", timeout: 2_000 })
      .catch(() => {});
  }

  /**
   * Wait for a target button while handling the Transaction Shield popup.
   * Navigates to the sidepanel and retries if the confirmation
   * hasn't arrived yet (race condition with the dApp request).
   */
  private async waitAndClickButton(
    btnLocator: ReturnType<typeof this.page.getByTestId>,
  ) {
    const popup = this.page.getByText(/Transaction Shield|free trial/i);
    const sidepanelUrl = `chrome-extension://${this.extensionId}/sidepanel.html`;

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

    // Helper: handle popup then click.
    const handlePopupAndClick = async () => {
      await this.dismissPopups();
      await btnLocator
        .first()
        .waitFor({ state: "visible", timeout: 30_000 });
      await btnLocator.first().click();
    };

    // Bring MetaMask page to front so it can receive real-time state
    // updates from the service worker (background pages may not process
    // state broadcasts promptly in headless mode).
    await this.page.bringToFront();

    // Strategy 1: Wait on the CURRENT page.
    // MetaMask's React router auto-navigates to the confirmation view
    // when a pending approval is registered. Navigating away with goto()
    // can interrupt this internal routing and lose the confirmation.
    const firstResult = await waitForButtonOrPopup(10_000);

    if (firstResult === "button") {
      await btnLocator.first().click();
      return;
    }

    if (firstResult === "popup") {
      await handlePopupAndClick();
      return;
    }

    // Strategy 2: Navigate to sidepanel.html and retry.
    // This handles the case where the current page isn't a MetaMask
    // extension page (e.g., the page is on the dApp), or the service
    // worker hasn't registered the approval yet.
    // We retry up to 3 times with fresh navigations, because MetaMask's
    // service worker may not have registered the pending approval yet.
    for (let attempt = 0; attempt < 3; attempt++) {
      await this.page.goto(sidepanelUrl);

      const result = await waitForButtonOrPopup(
        attempt === 0 ? 15_000 : 10_000,
      );

      if (result === "button") {
        await btnLocator.first().click();
        return;
      }

      if (result === "popup") {
        await handlePopupAndClick();
        return;
      }
    }

    // All strategies exhausted — let Playwright's actionability checks
    // produce a clear error with the element state.
    await btnLocator.first().click({ timeout: 10_000 });
  }

  async approve() {
    const confirmBtn = this.page
      .getByTestId("confirm-btn")
      .or(this.page.getByTestId("confirm-footer-button"))
      .or(this.page.getByTestId("page-container-footer-next"))
      .or(this.page.getByRole("button", { name: /^confirm$/i }));

    await this.waitAndClickButton(confirmBtn);
  }

  async deny() {
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
    // Navigate to home.html to ensure the main wallet UI is visible.
    // Sidepanel may show notification overlays (e.g., Solana account removal)
    // that block access to the settings menu.
    await this.page.goto(
      `chrome-extension://${this.extensionId}/home.html`,
    );
    await this.page.getByTestId("account-options-menu-button").click();

    // Click "Lock MetaMask" menu item
    await this.page.locator("text=Lock MetaMask").click();
  }

  /**
   * Unlock MetaMask with password
   */
  async unlock(password?: string) {
    const pwd = password ?? this.defaultPassword;

    // Navigate to home.html to show the lock screen reliably.
    await this.page.goto(
      `chrome-extension://${this.extensionId}/home.html`,
    );

    const passwordInput = this.page.getByTestId("unlock-password");
    await passwordInput.fill(pwd);

    await this.page.getByTestId("unlock-submit").click();

    // Wait for MetaMask to finish unlocking (lock screen disappears)
    await this.page.waitForSelector('[data-testid="unlock-password"]', {
      state: "hidden",
      timeout: 30_000,
    });
  }

  /**
   * Switch to an existing network in MetaMask
   * @param networkName - Name of the network to switch to (e.g., "Ethereum Mainnet", "Sepolia")
   */
  async switchNetwork(
    networkName: string,
    networkType: "Popular" | "Custom" = "Popular",
  ) {
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
