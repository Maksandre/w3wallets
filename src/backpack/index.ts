import type { Page } from "@playwright/test";

export class Backpack {
  constructor(private page: Page) {}

  async onboard(privateKey: string) {
    await this.page
      .getByRole("button", { name: "I already have a wallet" })
      .click();
    await this.page
      .getByRole("button", { name: "Show advanced options" })
      .click();
    await this.page
      .getByRole("button", { name: "Import with private key" })
      .click();
    await this.page.getByPlaceholder("Enter private key").fill(privateKey);
    await this.page.getByRole("button", { name: "Import" }).click();
    await this.page
      .getByPlaceholder("Password", { exact: true })
      .fill("11111111");
    await this.page.getByPlaceholder("Confirm Password").fill("11111111");
    await this.page.getByRole("checkbox").click();
    await this.page.getByRole("button", { name: "Next" }).click();
  }
}
