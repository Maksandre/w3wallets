import { expect } from "@playwright/test";
import { Wallet } from "../../core/wallet";

export class PolkadotJS extends Wallet {
  private defaultPassword = "11111111";

  async gotoOnboardPage() {
    await this.page.goto(`chrome-extension://${this.extensionId}/index.html`);
    await expect(
      this.page.getByText("Before we start, just a couple of notes"),
    ).toBeVisible();
  }

  async onboard(seed: string, password?: string, name?: string) {
    await this.page
      .getByRole("button", { name: "Understood, let me continue" })
      .click();
    await this.page.getByRole("button", { name: "I Understand" }).click();
    await this.page.locator(".popupToggle").first().click();
    await this.page.getByText("Import account from pre-existing seed").click();
    await this.page.locator(".seedInput").getByRole("textbox").fill(seed);
    await this.page.getByRole("button", { name: "Next" }).click();
    await this._getLabeledInput("A descriptive name for your account").fill(
      name ?? "Test",
    );
    await this._getLabeledInput("A new password for this account").fill(
      password ?? this.defaultPassword,
    );
    await this._getLabeledInput("Repeat password for verification").fill(
      password ?? this.defaultPassword,
    );
    await this.page
      .getByRole("button", { name: "Add the account with the supplied seed" })
      .click();
  }

  async selectAllAccounts() {
    await this.page.getByText("Select all").click();
  }

  async selectAccount(accountId: string) {
    await this.page
      .locator(".accountWichCheckbox")
      .filter({ hasText: accountId })
      .locator(".accountTree-checkbox")
      .locator("span")
      .check();
  }

  async enterPassword(password?: string) {
    await this._getLabeledInput("Password for this account").fill(
      password ?? this.defaultPassword,
    );
  }

  async approve() {
    const connect = this.page.getByRole("button", { name: "Connect" });
    const signTransaction = this.page.getByRole("button", {
      name: "Sign the transaction",
    });

    await connect.or(signTransaction).click();
  }

  async deny() {
    const reject = this.page.getByRole("button", { name: "Reject" });
    const cancel = this.page.getByRole("link", { name: "Cancel" });
    await reject.or(cancel).click();
  }

  private _getLabeledInput(label: string) {
    return this.page.locator(
      `//label[text()="${label}"]/following-sibling::input`,
    );
  }
}
