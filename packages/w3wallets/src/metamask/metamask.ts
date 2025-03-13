import { type Page } from "@playwright/test";
import { Wallet } from "../wallet";
import type { NetworkSettings } from "./types";

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
  }

  async connectToNetwork(settings: NetworkSettings, switchNetwork = true) {
    await this.page.locator(".mm-picker-network").click();
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

    if (switchNetwork) {
      await this.page.locator(".mm-picker-network").click();
      await this.page.getByTestId(settings.name).click();
    }
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
        '[data-testid="confirm-footer-button"], [data-testid="confirm-btn"]'
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
}
