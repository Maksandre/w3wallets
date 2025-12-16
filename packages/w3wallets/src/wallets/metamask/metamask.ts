import { expect } from "@playwright/test";
import { Wallet } from "../../core/wallet";
import { config } from "../../config";
import type { NetworkSettings } from "./types";

export class Metamask extends Wallet {
  private defaultPassword = "TestPassword123!";

  async gotoOnboardPage() {
    await this.page.goto(`chrome-extension://${this.extensionId}/home.html`, {
      timeout: config.actionTimeout,
    });
    await expect(
      this.page.getByRole("button", { name: "I have an existing wallet" }),
    ).toBeVisible({ timeout: config.actionTimeout });
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
      .click({ timeout: config.actionTimeout });

    // Step 2: Click "Import using Secret Recovery Phrase"
    await this.page
      .getByRole("button", { name: "Import using Secret Recovery Phrase" })
      .click({ timeout: config.actionTimeout });

    // Step 3: Type mnemonic (must use keyboard.type due to security)
    const textbox = this.page.getByRole("textbox");
    await textbox.click({ timeout: config.actionTimeout });

    for (const word of mnemonic.split(" ")) {
      await this.page.keyboard.type(word);
      await this.page.keyboard.type(" ");
      await this.page.waitForTimeout(30);
    }

    // Step 4: Wait for Continue button to be enabled and click
    const continueBtn = this.page.getByTestId("import-srp-confirm");
    await continueBtn.click({ timeout: config.actionTimeout });

    // Step 5: Fill password fields
    const passwordInputs = this.page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill(pwd, { timeout: config.actionTimeout });
    await passwordInputs.nth(1).fill(pwd, { timeout: config.actionTimeout });

    // Step 6: Check the terms checkbox
    await this.page
      .getByRole("checkbox")
      .click({ timeout: config.actionTimeout });

    // Step 7: Click "Create password"
    await this.page
      .getByRole("button", { name: "Create password" })
      .click({ timeout: config.actionTimeout });

    // Step 8: Handle "Help improve MetaMask" screen
    const metametricsBtn = this.page.getByTestId("metametrics-i-agree");
    await metametricsBtn.click({ timeout: config.actionTimeout });

    // Step 9: Handle "Your wallet is ready!" screen
    const openWalletBtn = this.page.getByRole("button", {
      name: /open wallet/i,
    });
    await openWalletBtn.click({ timeout: config.actionTimeout });

    // Step 10: Navigate to sidepanel page
    await this.page.goto(
      `chrome-extension://${this.extensionId}/sidepanel.html`,
      { timeout: config.actionTimeout },
    );

    // Wait for main wallet page to be ready (account options menu visible)
    await this._waitWalletStable();
  }

  async approve() {
    // MetaMask connection flow may have multiple steps:
    // 1. "Connect" button to approve account access
    // 2. "Confirm" button for transactions

    await this.page
      .getByTestId("confirm-btn")
      .or(this.page.getByTestId("confirm-footer-button"))
      .or(this.page.getByTestId("page-container-footer-next"))
      .or(this.page.getByRole("button", { name: /confirm/i }))
      .click({ timeout: config.actionTimeout });

    await this._waitWalletStable();
  }

  async deny() {
    // Try different cancel/reject button selectors
    const cancelBtn = this.page
      .getByTestId("cancel-btn")
      .or(this.page.getByTestId("confirm-footer-cancel-button"))
      .or(this.page.getByTestId("page-container-footer-cancel"))
      .or(this.page.getByRole("button", { name: /cancel|reject/i }));

    await cancelBtn.first().click({ timeout: config.actionTimeout });
  }

  /**
   * Lock the MetaMask wallet
   */
  async lock() {
    // Navigate to home first
    await this.page
      .getByTestId("account-options-menu-button")
      .click({ timeout: config.actionTimeout });

    // Click "Lock MetaMask" menu item
    await this.page
      .locator("text=Lock MetaMask")
      .click({ timeout: config.actionTimeout });
  }

  /**
   * Unlock MetaMask with password
   */
  async unlock(password?: string) {
    const pwd = password ?? this.defaultPassword;

    const passwordInput = this.page.getByTestId("unlock-password");
    await passwordInput.fill(pwd, { timeout: config.actionTimeout });

    await this.page
      .getByTestId("unlock-submit")
      .click({ timeout: config.actionTimeout });
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
    await this.page
      .getByTestId("sort-by-networks")
      .click({ timeout: config.actionTimeout });
    if (networkType === "Custom") {
      await this.page
        .getByRole("tab", { name: "Custom" })
        .click({ timeout: config.actionTimeout });
    }
    await this.page
      .getByText(networkName)
      .click({ timeout: config.actionTimeout });

    // Wait for the network list to appear and click the desired network
    await expect(this.page.getByTestId("sort-by-networks")).toHaveText(
      networkName,
      { timeout: config.actionTimeout },
    );
  }

  async switchAccount(accountName: string) {
    // Click the network picker button
    await this.page
      .getByTestId("account-menu-icon")
      .click({ timeout: config.actionTimeout });
    await this.page
      .getByText(accountName, { exact: true })
      .click({ timeout: config.actionTimeout });
  }

  /**
   * Add a custom network to MetaMask
   */
  async addNetwork(network: NetworkSettings) {
    await this.page.goto(
      `chrome-extension://${this.extensionId}/home.html#settings/networks/add-network`,
      { timeout: config.actionTimeout },
    );

    await this.page
      .getByTestId("network-form-network-name")
      .fill(network.name, { timeout: config.actionTimeout });
    await this.page
      .getByTestId("network-form-rpc-url")
      .fill(network.rpc, { timeout: config.actionTimeout });
    await this.page
      .getByTestId("network-form-chain-id")
      .fill(network.chainId.toString(), { timeout: config.actionTimeout });
    await this.page
      .getByTestId("network-form-ticker-input")
      .fill(network.currencySymbol, { timeout: config.actionTimeout });

    await this.page
      .getByRole("button", { name: /save/i })
      .click({ timeout: config.actionTimeout });
  }

  async addCustomNetwork(settings: NetworkSettings) {
    await this.page
      .getByTestId("account-options-menu-button")
      .click({ timeout: config.actionTimeout });
    await this.page
      .getByTestId("global-menu-networks")
      .click({ timeout: config.actionTimeout });
    await this.page
      .getByRole("button", { name: "Add a custom network" })
      .click({ timeout: config.actionTimeout });
    await this.page
      .getByTestId("network-form-network-name")
      .fill(settings.name, { timeout: config.actionTimeout });
    await this.page
      .getByTestId("network-form-chain-id")
      .fill(settings.chainId.toString(), { timeout: config.actionTimeout });
    await this.page
      .getByTestId("network-form-ticker-input")
      .fill(settings.currencySymbol, { timeout: config.actionTimeout });

    await this.page
      .getByTestId("test-add-rpc-drop-down")
      .click({ timeout: config.actionTimeout });
    await this.page
      .getByRole("button", { name: "Add RPC URL" })
      .click({ timeout: config.actionTimeout });
    await this.page
      .getByTestId("rpc-url-input-test")
      .fill(settings.rpc, { timeout: config.actionTimeout });
    await this.page
      .getByRole("button", { name: "Add URL" })
      .click({ timeout: config.actionTimeout });
    await this.page
      .getByRole("button", { name: "Save" })
      .click({ timeout: config.actionTimeout });
  }

  async enableTestNetworks() {
    await this.page
      .getByTestId("account-options-menu-button")
      .click({ timeout: config.actionTimeout });
    await this.page
      .getByTestId("global-menu-networks")
      .click({ timeout: config.actionTimeout });
    await this.page
      .locator("text=Show test networks >> xpath=following-sibling::label")
      .click({ timeout: config.actionTimeout });
    await this.page.keyboard.press("Escape");
  }

  async importAccount(privateKey: string) {
    await this.page
      .getByTestId("account-menu-icon")
      .click({ timeout: config.actionTimeout });
    await this.page
      .getByTestId("account-list-add-wallet-button")
      .click({ timeout: config.actionTimeout });
    await this.page
      .getByTestId("add-wallet-modal-import-account")
      .click({ timeout: config.actionTimeout });
    await this.page
      .locator("#private-key-box")
      .fill(privateKey, { timeout: config.actionTimeout });
    await this.page
      .getByTestId("import-account-confirm-button")
      .click({ timeout: config.actionTimeout });
    await this.page
      .getByRole("button", { name: "Back" })
      .click({ timeout: config.actionTimeout });
  }

  async accountNameIs(accountName: string) {
    await expect(this.page.getByTestId("account-menu-icon")).toContainText(
      accountName,
      { timeout: config.actionTimeout },
    );
  }

  private async _waitWalletStable() {
    await this.page
      .getByTestId("account-options-menu-button")
      .waitFor({ state: "visible", timeout: config.actionTimeout });
  }
}
