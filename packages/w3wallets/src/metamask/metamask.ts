import { expect, type Page } from "@playwright/test";
import { Wallet } from "../wallet";
import type { NetworkSettings } from "./types";
import { shortenAddress } from "../../tests/utils/address";

export class Metamask extends Wallet {
  private defaultPassword = "11111111";

  async gotoOnboardPage(): Promise<void> {
    await this.page.goto(`chrome-extension://${this.extensionId}/home.html`);
  }

  /**
   *
   * @param mnemonic 12-word mnemonic seed phrase
   */
  async onboard(mnemonic: string, password = this.defaultPassword) {
    await this.page.getByTestId("onboarding-terms-checkbox").click();
    await this.page.getByTestId("onboarding-import-wallet").click();
    await this.page.getByTestId("metametrics-i-agree").click();

    for (const [i, word] of mnemonic.split(" ").entries())
      await this.page.getByTestId(`import-srp__srp-word-${i}`).fill(word);

    await this.page.getByTestId("import-srp-confirm").click();

    await this.page.getByTestId("create-password-new").fill(password);
    await this.page.getByTestId("create-password-confirm").fill(password);
    await this.page.getByTestId("create-password-terms").click();

    await this.page.getByTestId("create-password-import").click();
    await this.page.getByTestId("onboarding-complete-done").click();

    await this.page.getByTestId("pin-extension-next").click();
    await this.page.getByTestId("pin-extension-done").click();

    // Sometimes MM uses dialogues – close them
    await this.page.waitForTimeout(1000);
    await this.clickTopRightCornerToCloseAllTheMarketingBullshit();
  }

  async switchAccount(accountName: { name: string }): Promise<void>;
  async switchAccount(accountAddress: { address: string }): Promise<void>;
  async switchAccount(
    accountNameOrAddress: { name: string } | { address: string },
  ) {
    await this.page.getByTestId("account-menu-icon").click();

    if ("name" in accountNameOrAddress) {
      await this.page
        .locator(".multichain-account-list-item__account-name")
        .getByRole("button", { name: accountNameOrAddress.name, exact: true })
        .click();
    } else {
      await this.page
        .getByTestId("account-list-address")
        .filter({ hasText: shortenAddress(accountNameOrAddress.address) })
        .click();
    }
  }

  async importAccount(privateKey: string) {
    await this.page.getByTestId("account-menu-icon").click();
    await this.page
      .getByTestId("multichain-account-menu-popover-action-button")
      .click();
    await this.page
      .getByTestId("multichain-account-menu-popover-add-imported-account")
      .click();
    await this.page.locator("#private-key-box").fill(privateKey);
    await this.page.getByTestId("import-account-confirm-button").click();
  }

  async addAccount(accountName?: string) {
    await this.page.getByTestId("account-menu-icon").click();
    await this.page
      .getByTestId("multichain-account-menu-popover-action-button")
      .click();
    await this.page
      .getByTestId("multichain-account-menu-popover-add-account")
      .click();
    if (accountName) {
      await this.page.locator("#account-name").fill(accountName);
    }
    await this.page.getByTestId("submit-add-account-with-name").click();
  }

  async getAccountName() {
    const accountSelect = this.page.getByTestId("account-menu-icon");
    await expect(accountSelect).toBeVisible();
    const text = await accountSelect.textContent();
    if (!text) throw Error("Cannot get account name");
    return text;
  }

  async connectToNetwork(networkName: string): Promise<void>;
  async connectToNetwork(settings: NetworkSettings): Promise<void>;
  async connectToNetwork(settingsOrName: NetworkSettings | string) {
    if (typeof settingsOrName !== "string") {
      await this.page.locator(".mm-picker-network").click();
      await this.page
        .getByRole("button", { name: "Add a custom network" })
        .click();
      await this.page
        .getByTestId("network-form-network-name")
        .fill(settingsOrName.name);
      await this.page
        .getByTestId("network-form-chain-id")
        .fill(settingsOrName.chainId.toString());
      await this.page
        .getByTestId("network-form-ticker-input")
        .fill(settingsOrName.currencySymbol);

      await this.page.getByTestId("test-add-rpc-drop-down").click();
      await this.page.getByRole("button", { name: "Add RPC URL" }).click();
      await this.page
        .getByTestId("rpc-url-input-test")
        .fill(settingsOrName.rpc);
      await this.page.getByRole("button", { name: "Add URL" }).click();
      await this.page.getByRole("button", { name: "Save" }).click();
    }

    await this.page.locator(".mm-picker-network").click();
    await this.page
      .locator("text=Show test networks >> xpath=following-sibling::label")
      .click();
    await this.page
      .getByTestId(
        typeof settingsOrName === "string"
          ? settingsOrName
          : settingsOrName.name,
      )
      .click();
  }

  // async approve() {
  //   return this.usingNotificationPage((p) =>
  //     p
  //       .locator(
  //         '[data-test-id="confirm-footer-button"], [data-test-id="confirm-btn"]',
  //       )
  //       .click(),
  //   );
  // }

  async approve() {
    const p = await this.page.context().newPage();
    await p.goto(`chrome-extension://${this.extensionId}/notification.html`);
    await p
      .locator(
        '[data-testid="confirm-footer-button"], [data-testid="confirm-btn"]',
      )
      .click();
    await p.close();
  }

  async deny() {
    return this.usingNotificationPage((p) =>
      p.getByTestId("cancel-btn").click(),
    );
  }

  private async usingNotificationPage(action: (p: Page) => Promise<unknown>) {
    const p = await this.page.context().newPage();
    await p.goto(`chrome-extension://${this.extensionId}/notification.html`);
    await action(p);
    await p.close();
  }

  private async clickTopRightCornerToCloseAllTheMarketingBullshit() {
    await this.page.mouse.click(1000, 10);
  }
}
