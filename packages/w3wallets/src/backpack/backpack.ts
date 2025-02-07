import { expect } from "@playwright/test";
import type { BackPackNetwork } from "./types";
import { Wallet } from "../wallet";

export class Backpack extends Wallet {
  private defaultPassword = "11111111";

  async gotoOnboardPage() {
    await this.page.goto(
      `chrome-extension://${this.extensionId}/options.html?onboarding=true`,
    );
    await expect(this.page.getByText("Welcome to Backpack")).toBeVisible();
  }

  async onboard(network: BackPackNetwork, privateKey: string) {
    await this.page.getByRole("button", { name: "Import wallet" }).click();
    await this.page.getByRole("button", { name: network }).click();
    await this.page.getByRole("button", { name: "Import private key" }).click();
    await this.page.getByPlaceholder("Enter private key").fill(privateKey);
    await this.page.getByRole("button", { name: "Import" }).click();
    await this.page
      .getByPlaceholder("Password", { exact: true })
      .fill(this.defaultPassword);
    await this.page
      .getByPlaceholder("Confirm Password")
      .fill(this.defaultPassword);
    await this.page.getByRole("checkbox").click();
    await this.page.getByRole("button", { name: "Next" }).click();
    await expect(this.page.getByText("You're all good!")).toBeVisible();
    await this.page.goto(`chrome-extension://${this.extensionId}/popup.html`);
  }

  async unlock() {
    await this.page.getByPlaceholder("Password").fill(this.defaultPassword);
    await this.page.getByRole("button", { name: "Unlock" }).click();
  }

  async goToSettings(accountName?: string) {
    await this.page.getByRole("button", { name: accountName ?? "A1" }).click();
    await this.page.getByRole("button", { name: "Settings" }).click();
  }

  async setRPC(network: BackPackNetwork, rpc: string) {
    await this.goToSettings();
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
}
