import { expect } from "@playwright/test";
import type { BackPackNetwork } from "./types";
import { Wallet } from "../wallet";

export class Backpack extends Wallet {
  private defaultPassword = "11111111";
  private currentAccountId = 0;
  private maxAccountId = 0;

  async gotoOnboardPage() {
    await this.page.goto(
      `chrome-extension://${this.extensionId}/onboarding.html`,
    );
    await expect(this.page.getByText("Welcome to Backpack")).toBeVisible();
  }

  async onboard(network: BackPackNetwork, privateKey: string) {
    this.currentAccountId++;
    this.maxAccountId++;
    return this._importAccount(network, privateKey, true);
  }

  async addAccount(network: BackPackNetwork, privateKey: string) {
    this.maxAccountId++;
    this.currentAccountId = this.maxAccountId;
    await this.page.goto(
      `chrome-extension://${this.extensionId}/onboarding.html?add-user-account=true`,
    );
    await this._importAccount(network, privateKey, false);
  }

  /**
   * Switch account
   * @param id The first added account has id 1, the second – 2, and so on
   */
  async switchAccount(id: number) {
    await this.page
      .getByRole("button", { name: `A${this.currentAccountId}` })
      .click();
    await this.page.getByRole("button", { name: `Account ${id}` }).click();
    this.currentAccountId = id;
  }

  async unlock() {
    await this.page.getByPlaceholder("Password").fill(this.defaultPassword);
    await this.page.getByRole("button", { name: "Unlock" }).click();
  }

  async setRPC(network: BackPackNetwork, rpc: string) {
    await this._clickOnAccount();
    await this.page.getByRole("button", { name: "Settings" }).click();

    await this.page.getByRole("button", { name: network }).click();
    await this.page.getByRole("button", { name: "RPC Connection" }).click();
    await this.page.getByRole("button", { name: "Custom" }).click();
    await this.page.getByPlaceholder("RPC URL").fill(rpc);
    await this.page.keyboard.press("Enter");
  }

  async ignoreAndProceed() {
    const ignoreButton = this.page.getByText("Ignore and proceed anyway.");
    await ignoreButton.click();
  }

  async approve() {
    await this.page.getByText("Approve", { exact: true }).click();
  }

  async deny() {
    await this.page.getByText("Deny", { exact: true }).click();
  }

  private async _clickOnAccount() {
    return this.page
      .getByRole("button", { name: `A${this.currentAccountId}`, exact: true })
      .click();
  }

  private async _importAccount(
    network: BackPackNetwork,
    privateKey: string,
    isOnboard: boolean,
  ) {
    {
      // TODO: this is workaround of a bug in backpack
      await this.page.waitForTimeout(2000);
      if (await this.page.getByText("You're all good!").isVisible()) {
        await this.page.getByLabel("Go back").click();
      }
    }
    await this.page
      .getByRole("button", { name: "I agree to the terms" })
      .click();
    await this.page.getByText("I already have a wallet").click();
    await this.page.getByText("Show all networks").click();
    await this.page.getByText(network).click();
    await this.page.getByText("Private key").click();
    await this.page.getByPlaceholder("Private key").fill(privateKey);
    await this.page.waitForTimeout(1000);
    await this.page.getByText("Import", { exact: true }).click();

    if (isOnboard) {
      await this.page.getByRole("textbox").nth(1).fill(this.defaultPassword);
      await this.page.getByRole("textbox").nth(2).fill(this.defaultPassword);
      await this.page.getByText("Next", { exact: true }).click();
      await expect(this.page.getByText("You're all good!")).toBeVisible();
    }
    await this.page.goto(`chrome-extension://${this.extensionId}/popup.html`);
    await this.page
      .getByTestId("AccountBalanceRoundedIcon")
      .waitFor({ state: "visible" });
  }
}
