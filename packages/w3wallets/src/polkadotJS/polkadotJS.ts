import { expect, type Page } from "@playwright/test";

export class PolkadotJS {
  constructor(
    private page: Page,
    private extensionId: string,
  ) {}

  async gotoOnboardPage() {
    await this.page.goto(`chrome-extension://${this.extensionId}/index.html`);
    await expect(
      this.page.getByText("Before we start, just a couple of notes"),
    ).toBeVisible();
  }
}
