import { expect, type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for Polkadot.js Test DApp
 * URL: http://localhost:3001/polkadot
 *
 * This POM handles interactions with the Polkadot test dApp page,
 * including wallet connection, account selection, and disconnection.
 */
export class PolkadotPage {
  readonly page: Page;
  readonly locators: Record<string, Locator>;

  constructor(page: Page) {
    this.page = page;

    // Define all important locators
    this.locators = {
      // Wallet Connection Section
      connectionStatus: this.page.getByTestId("connection-status"),
      accountAddress: this.page.getByTestId("account-address"),
      disconnectButton: this.page.getByTestId("disconnect-button"),

      // Polkadot-specific connectors
      polkadotJsConnector: this.page.getByRole("button", {
        name: "Polkadot.js",
      }),

      // Transfer Section (for future skipped test)
      recipientInput: this.page.getByPlaceholder("Recipient"),
      amountInput: this.page.getByPlaceholder("Amount"),
      sendButton: this.page.getByRole("button", { name: "Send" }),
      transferStatus: this.page.getByTestId("transfer-status"),
    };
  }

  // Navigation
  async goto(): Promise<void> {
    await this.page.goto("http://localhost:3001/polkadot");
  }

  // High-level workflow methods
  /**
   * Connect wallet using Polkadot.js connector button
   */
  async connectPolkadotJs(): Promise<void> {
    await this.locators.polkadotJsConnector.click();
  }

  /**
   * Disconnect the connected wallet
   */
  async disconnectWallet(): Promise<void> {
    await this.locators.disconnectButton.click();
  }

  /**
   * Fill transfer form (for native token transfers)
   * @param recipient - Recipient address
   * @param amount - Amount to transfer
   */
  async fillTransferForm(recipient: string, amount: string): Promise<void> {
    await this.locators.recipientInput.fill(recipient);
    await this.locators.amountInput.fill(amount);
  }

  /**
   * Submit transfer transaction
   */
  async submitTransfer(): Promise<void> {
    await this.locators.sendButton.click();
  }

  /**
   * Complete transfer workflow
   * @param recipient - Recipient address
   * @param amount - Amount to transfer
   */
  async transferTokens(recipient: string, amount: string): Promise<void> {
    await this.fillTransferForm(recipient, amount);
    await this.submitTransfer();
  }

  // Assertion helpers
  /**
   * Verify wallet connection status
   * @param status - Expected status ("connected" or "disconnected")
   */
  async assertConnectionStatus(status: string): Promise<void> {
    if (status === "connected") {
      await expect(this.page.getByText("status: connected")).toBeVisible();
    } else {
      await expect(this.locators.connectionStatus).toHaveText(status);
    }
  }

  /**
   * Verify the connected account address
   * @param address - Expected address
   */
  async assertAccountAddress(address: string): Promise<void> {
    await expect(this.locators.accountAddress).toHaveText(address);
  }

  /**
   * Verify transfer was successful
   */
  async assertTransferSuccess(): Promise<void> {
    await expect(this.locators.transferStatus).toHaveText("Success");
  }

  /**
   * Get connector button for a specific connector
   * @param connectorUid - Connector unique ID (e.g., "polkadot-js")
   */
  getConnectorButton(connectorUid: string): Locator {
    return this.page.getByTestId(`connector-${connectorUid}`);
  }

  /**
   * Select a specific account from account selection UI
   * Note: This should be called in the wallet extension context, not the dApp
   * @param accountName - Name of the account to select
   */
  async selectAccountRadio(accountAddress: string): Promise<void> {
    const radio = this.page
      .locator('input[type="radio"][name="account"]')
      .filter({ has: this.page.locator(`code:has-text("${accountAddress}")`) });
    await radio.check();
  }

  /**
   * Get all account radio buttons
   */
  getAccountRadios(): Locator {
    return this.page.locator('input[type="radio"][name="account"]');
  }

  /**
   * Verify account is selected/active
   * @param accountAddress - Account address that should be active
   */
  async assertActiveAccount(accountAddress: string): Promise<void> {
    const radio = this.page
      .locator('input[type="radio"][name="account"]')
      .filter({
        has: this.page.locator(
          `code[data-testid="account-address"]:has-text("${accountAddress}")`,
        ),
      });
    await expect(radio).toBeChecked();
  }
}
