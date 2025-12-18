import { test as base, expect } from "@playwright/test";
import { withWallets, metamask } from "../../src";
import config from "../utils/config";
import { EthereumPage } from "../POM";

const metamaskTest = withWallets(base, metamask).extend<{ethereumPage: EthereumPage}>({
  metamask: async ({ metamask }, use) => {
    await metamask.onboard(config.ethMnemonic);

    await use(metamask);
  },
  ethereumPage: async ({ page, metamask }, use) => {
    await page.goto("http://localhost:3001");

    // Connect to metamask
    await page.getByRole("button", { name: "MetaMask" }).click();
    await metamask.approve();

    // Approve switch to local network
    await metamask.approve();

    // Wait for connection to be established
    await expect(page.getByTestId("connection-status")).toHaveText("connected");

    // Show page
    await page.bringToFront();

    await use(new EthereumPage(page));
  },
});

export { metamaskTest, expect };
