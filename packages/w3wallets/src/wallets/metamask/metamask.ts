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

    // Try multiple CSS selectors for the X close button.
    const closeSelectors = [
      'button[aria-label="Close"]',
      '[data-testid="popover-close"]',
      '.mm-modal-content-header button',
      'button.mm-button-icon',
    ];

    for (const selector of closeSelectors) {
      const btn = this.page.locator(selector).first();
      if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
        await btn.click();
        await popup
          .first()
          .waitFor({ state: "hidden", timeout: 3_000 })
          .catch(() => {});
        if (!(await popup.first().isVisible().catch(() => false))) {
          return;
        }
      }
    }

    // Try Playwright's accessible name locator (pierces shadow DOM).
    const closeByRole = this.page.getByRole("button", { name: /close/i });
    if (
      await closeByRole.first().isVisible({ timeout: 1_000 }).catch(() => false)
    ) {
      await closeByRole.first().click();
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

    // Final fallback: use JavaScript to find and click the close button
    // within the popup modal, or hide the popup overlay entirely.
    await this.page.evaluate(() => {
      // Find the modal root by walking up from the "Transaction Shield" text
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
            if (style.position === "fixed" || style.position === "absolute") {
              modal = el;
            }
            el = el.parentElement;
          }
          break;
        }
      }
      if (!modal) return;

      // Look for close buttons (SVG icon buttons, × text, or empty buttons)
      const buttons = modal.querySelectorAll("button");
      for (const btn of buttons) {
        const text = btn.textContent?.trim() || "";
        if (btn.querySelector("svg") || text === "×" || text === "") {
          (btn as HTMLElement).click();
          return;
        }
      }

      // If no close button found, hide the modal overlay
      modal.style.display = "none";
    });
    await popup
      .first()
      .waitFor({ state: "hidden", timeout: 2_000 })
      .catch(() => {});
  }

  /**
   * Navigate to a MetaMask page that shows pending notifications.
   * Tries notification.html first (no promotional popups), falls back
   * to sidepanel.html if the confirmation doesn't appear.
   */
  private async navigateToConfirmation(
    btnLocator: import("@playwright/test").Locator,
  ) {
    // Try notification.html first — it shows pending confirmations
    // without the Transaction Shield promotional popup.
    await this.page.goto(
      `chrome-extension://${this.extensionId}/notification.html`,
    );
    const found = await btnLocator
      .first()
      .waitFor({ state: "visible", timeout: 8_000 })
      .then(() => true)
      .catch(() => false);
    if (found) return;

    // Fall back to sidepanel.html
    await this.page.goto(
      `chrome-extension://${this.extensionId}/sidepanel.html`,
    );
    await this.dismissPopups();
    await btnLocator.first().waitFor({ state: "visible", timeout: 30_000 });
  }

  async approve() {
    // MetaMask connection flow may have multiple steps:
    // 1. "Connect" button to approve account access
    // 2. "Confirm" button for transactions
    // Use exact name match to avoid hitting confirmation queue nav buttons
    // ("Previous Confirmation" / "Next Confirmation").

    const confirmBtn = this.page
      .getByTestId("confirm-btn")
      .or(this.page.getByTestId("confirm-footer-button"))
      .or(this.page.getByTestId("page-container-footer-next"))
      .or(this.page.getByRole("button", { name: /^confirm$/i }));

    // Try the current page first — wait briefly for the notification to arrive
    // via MetaMask's service worker, avoiding a full page navigation.
    const fastVisible = await confirmBtn
      .first()
      .waitFor({ state: "visible", timeout: 3_000 })
      .then(() => true)
      .catch(() => false);

    if (fastVisible) {
      await confirmBtn.click();
      return;
    }

    // Navigate to a confirmation page.
    await this.navigateToConfirmation(confirmBtn);

    // If a popup overlay is still blocking, click via JavaScript to bypass it.
    // JS element.click() fires directly on the element regardless of overlays.
    const hasOverlay = await this.page
      .getByText(/Transaction Shield|free trial/i)
      .first()
      .isVisible()
      .catch(() => false);
    if (hasOverlay) {
      await this.page.evaluate(() => {
        const btn =
          document.querySelector<HTMLElement>(
            '[data-testid="confirm-footer-button"]',
          ) ??
          document.querySelector<HTMLElement>(
            '[data-testid="confirm-btn"]',
          ) ??
          document.querySelector<HTMLElement>(
            '[data-testid="page-container-footer-next"]',
          );
        if (btn) {
          btn.click();
          return;
        }
        // Fallback: find button by accessible text (matches getByRole pattern)
        for (const b of document.querySelectorAll("button")) {
          if (/^confirm$/i.test(b.textContent?.trim() || "")) {
            (b as HTMLElement).click();
            return;
          }
        }
      });
    } else {
      await confirmBtn.click();
    }
  }

  async deny() {
    // Try different cancel/reject button selectors
    const cancelBtn = this.page
      .getByTestId("cancel-btn")
      .or(this.page.getByTestId("confirm-footer-cancel-button"))
      .or(this.page.getByTestId("page-container-footer-cancel"))
      .or(this.page.getByRole("button", { name: /cancel|reject/i }));

    // Try the current page first — wait briefly for the notification to arrive.
    const fastVisible = await cancelBtn
      .first()
      .waitFor({ state: "visible", timeout: 3_000 })
      .then(() => true)
      .catch(() => false);

    if (fastVisible) {
      await cancelBtn.first().click();
      return;
    }

    // Navigate to notification.html first (no promotional popups),
    // fall back to sidepanel.html if needed.
    await this.page.goto(
      `chrome-extension://${this.extensionId}/notification.html`,
    );
    let found = await cancelBtn
      .first()
      .waitFor({ state: "visible", timeout: 8_000 })
      .then(() => true)
      .catch(() => false);

    if (!found) {
      await this.page.goto(
        `chrome-extension://${this.extensionId}/sidepanel.html`,
      );
      await this.dismissPopups();
      await cancelBtn.first().waitFor({ state: "visible", timeout: 30_000 });
      found = true;
    }

    // If a popup overlay is still blocking, click via JavaScript to bypass it.
    const hasOverlay = await this.page
      .getByText(/Transaction Shield|free trial/i)
      .first()
      .isVisible()
      .catch(() => false);
    if (hasOverlay) {
      await this.page.evaluate(() => {
        const btn =
          document.querySelector<HTMLElement>(
            '[data-testid="confirm-footer-cancel-button"]',
          ) ??
          document.querySelector<HTMLElement>(
            '[data-testid="cancel-btn"]',
          ) ??
          document.querySelector<HTMLElement>(
            '[data-testid="page-container-footer-cancel"]',
          );
        if (btn) {
          btn.click();
          return;
        }
        // Fallback: find button by accessible text (matches getByRole pattern)
        for (const b of document.querySelectorAll("button")) {
          if (/^(cancel|reject)$/i.test(b.textContent?.trim() || "")) {
            (b as HTMLElement).click();
            return;
          }
        }
      });
    } else {
      await cancelBtn.first().click();
    }
  }

  /**
   * Lock the MetaMask wallet
   */
  async lock() {
    // Navigate to home first
    await this.page.getByTestId("account-options-menu-button").click();

    // Click "Lock MetaMask" menu item
    await this.page.locator("text=Lock MetaMask").click();
  }

  /**
   * Unlock MetaMask with password
   */
  async unlock(password?: string) {
    const pwd = password ?? this.defaultPassword;

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
