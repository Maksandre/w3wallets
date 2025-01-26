import { expect, type Page } from "@playwright/test";
import type { BackPackNetwork } from "./types";
import { PageBase } from "./pagebase";

export class Backpack extends PageBase {
  private defaultPassword = "11111111";

  constructor(page: Page, private extensionId: string) {
    super(page);
  }

  async onboard(network: BackPackNetwork, privateKey: string) {
    const extensionUrl = `chrome-extension://${this.extensionId}/popup.html`;

    await this.clickOnButtonWithName("Import wallet");
    await this.clickOnButtonWithName(network);
    await this.clickOnButtonWithName("Import private key");
    await this.enterValueInPrivateKeyInput(privateKey);
    await this.clickOnButtonWithName("Import");
    await this.enterValueInPasswordInput(this.defaultPassword);
    await this.enterValueInConfirmPasswordInput(this.defaultPassword);
    await this.clickOnCheckbox();
    await this.clickOnButtonWithName("Next");
    await this.assertLabelDisplayed("You're all good!");
    await this.navigateTo(extensionUrl)
  }

  async enterValueInPrivateKeyInput(value: string) {
    (await this.getInputByPlaceholder("Enter private key")).fill(value)
  }

  async enterValueInPasswordInput(value: string) {
    (await this.getInputByPlaceholder("Password", true)).fill(value)
  }

  async enterValueInConfirmPasswordInput(value: string) {
    (await this.getInputByPlaceholder("Confirm Password")).fill(value)
  }

  async unlock() {
    await this.page.getByPlaceholder("Password").fill(this.defaultPassword);
    await this.clickOnButtonWithName("Unlock");
  }

  async goToSettings(accountName?: string) {
    await this.clickOnButtonWithName(accountName ?? "A1");
    await this.clickOnButtonWithName("Settings");
  }

  async setRPC(network: BackPackNetwork, rpc: string) {
    await this.goToSettings();
    await this.clickOnButtonWithName(network);
    await this.clickOnButtonWithName("RPC Connection");
    await this.clickOnButtonWithName("Custom");
    (await this.getInputByPlaceholder("RPC URL")).fill(rpc);
    await this.page.keyboard.press("Enter");
  }

  async ignoreAndProceed() {
    this.clickOnButtonWithName("Ignore and proceed anyway.");
  }

  async approve() {
    await this.page.getByText("Approve").click();
  }

  async deny() {
    await this.page.getByText("Deny").click();
  }
}
