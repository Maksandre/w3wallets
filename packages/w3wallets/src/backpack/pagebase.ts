import { expect, type Locator, type Page } from '@playwright/test';

export class PageBase {
    protected page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async clickOnButtonWithName(name: string): Promise<void> {
        (await this.getButtonByName(name)).click()
    }

    async getInputByPlaceholder(placeholder: string, exact?: boolean): Promise<Locator> {
        return this.page.getByPlaceholder(placeholder, { exact: exact })
    }

    async clickOnCheckbox(): Promise<void> {
        (await this.getCheckbox()).click()
    }

    async navigateTo(url: string): Promise<void> {
        this.page.goto(url);
    }

    async assertLabelDisplayed(labelText: string) {
        expect(this.page.getByText(labelText)).toBeVisible();
    }

    private async getButtonByName(name: string): Promise<Locator> {
        return this.page.getByRole("button", { name: name })
    }

    private async getCheckbox(): Promise<Locator> {
        return this.page.getByRole("checkbox")
    }
}