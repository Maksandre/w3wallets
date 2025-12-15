import { test as base, expect } from "@playwright/test";
import { withWallets, metamask } from "../src";
import config from "./utils/config";

const test = withWallets(base, metamask);
const password = "TestPassword123!";

test.beforeEach(async ({ metamask }) => {
  await metamask.onboard(config.ethMnemonic, password);
});

test.describe("Metamask", () => {
  test("Can connect to dApp and approve", async ({ page, metamask }) => {
    // Go to test dApp
    await page.goto("http://localhost:3001");

    // Click MetaMask button to connect
    await page.getByRole("button", { name: "MetaMask" }).click();

    // Approve connection in MetaMask
    await metamask.approve();

    // Should be connected
    await expect(page.getByTestId("connection-status")).toHaveText("connected");
  });

  test("Can deny connection request", async ({ page, metamask }) => {
    await page.goto("http://localhost:3001");
    await page.getByRole("button", { name: "MetaMask" }).click();

    // Deny connection
    await metamask.deny();

    // Should not be connected
    await expect(page.getByText(/disconnected/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test("Can sign message and approve", async ({ page, metamask }) => {
    await page.goto("http://localhost:3001");
    await page.getByRole("button", { name: "MetaMask" }).click();
    await metamask.approve();

    await expect(page.getByTestId("connection-status")).toHaveText("connected");

    // Fill message and request signature
    await page.getByTestId("sign-message-input").fill("Hello, Web3!");
    await page.getByTestId("sign-message-submit").click();

    // Approve signature in MetaMask
    await metamask.approve();

    // Verify signature was generated
    await expect(page.getByTestId("sign-message-success")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByTestId("sign-message-signature")).toBeVisible();
  });

  test("Can deny signature request", async ({ page, metamask }) => {
    await page.goto("http://localhost:3001");
    await page.getByRole("button", { name: "MetaMask" }).click();
    await metamask.approve();

    await expect(page.getByTestId("connection-status")).toHaveText("connected");

    // Fill message and request signature
    await page.getByTestId("sign-message-input").fill("I will deny this");
    await page.getByTestId("sign-message-submit").click();

    // Deny signature in MetaMask
    await metamask.deny();

    // Verify error is shown
    await expect(page.getByTestId("sign-message-error")).toBeVisible({
      timeout: 10000,
    });
  });

  test("Can disconnect from dApp", async ({ page, metamask }) => {
    await page.goto("http://localhost:3001");
    await page.getByRole("button", { name: "MetaMask" }).click();
    await metamask.approve();

    await expect(page.getByTestId("connection-status")).toHaveText("connected");

    // Disconnect
    await page.getByTestId("disconnect-button").click();

    // Verify disconnected
    await expect(page.getByTestId("connection-status")).toHaveText(
      "disconnected",
    );
  });
});

test("Can import account and switch between accounts", async ({ metamask }) => {
  await metamask.accountNameIs("Account 1");
  await metamask.importAccount(config.ethPrivateKeys[1]);
  await metamask.accountNameIs("Imported Account");

  await metamask.switchAccount("Account 1");
  await metamask.accountNameIs("Account 1");
});

test("Can connect to existing network", async ({ metamask }) => {
  await metamask.switchNetwork("Arbitrum");
});

test("Can connect to existing testnet", async ({ metamask }) => {
  await metamask.enableTestNetworks();
  await metamask.switchNetwork("MegaETH Testnet", "Custom");
});

test("Can unlock after lock", async ({ metamask }) => {
  await metamask.lock();
  await metamask.unlock(password);

  await expect(
    metamask.page.getByTestId("account-options-menu-button"),
  ).toBeVisible();
});

test("Can add a custom network and switch account", async ({ metamask }) => {
  await metamask.addCustomNetwork({
    chainId: 123420001114,
    currencySymbol: "CAMP",
    name: "Basecamp",
    rpc: "https://rpc-campnetwork.xyz",
  });
});

test("Can add a custom network and an existing network", async ({
  metamask,
}) => {
  await metamask.addCustomNetwork({
    chainId: 123420001114,
    currencySymbol: "CAMP",
    name: "Basecamp",
    rpc: "https://rpc-campnetwork.xyz",
  });
  await metamask.enableTestNetworks();
  await metamask.switchNetwork("MegaETH Testnet", "Custom");
});
