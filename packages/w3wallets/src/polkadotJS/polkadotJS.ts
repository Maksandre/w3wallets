import { expect } from "@playwright/test";
import { Wallet } from "../wallet";

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
    await this.page.locator(".popupToggle").first().click();
    await this.page.getByText("Import account from pre-existing seed").click();
    await this.page.locator(".seedInput").getByRole("textbox").fill(seed);
    await this.page.getByRole("button", { name: "Next" }).click();
    await this.page
      .locator(
        '//label[text()="A descriptive name for your account"]/following-sibling::input',
      )
      .fill(name ?? "Test");
    await this.page
      .locator(
        '//label[text()="A new password for this account"]/following-sibling::input',
      )
      .fill(password ?? this.defaultPassword);
    await this.page
      .locator(
        '//label[text()="Repeat password for verification"]/following-sibling::input',
      )
      .fill(password ?? this.defaultPassword);
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

  async approve() {
    await this.page.getByRole("button", { name: "Connect" }).click();
  }

  async deny() {
    await this.page.getByRole("button", { name: "Reject" }).click();
  }
}
