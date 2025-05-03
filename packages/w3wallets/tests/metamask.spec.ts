import { test as base, expect } from "@playwright/test";
import { withWallets } from "../src/withWallets";
import config from "./utils/config";

const test = withWallets(base, "metamask");

test("Can connect the Metamask wallet", async ({ page, metamask }) => {
  await metamask.onboard(config.ethMnemonic);
  await page.goto("http://localhost:3000");
  await page.getByRole("button", { name: "MetaMask" }).click();
  await metamask.approve();
  await expect(page.getByText("status: connected")).toBeVisible();

  await page.getByRole("button", { name: "Disconnect" }).click();
  await expect(page.getByText("status: connected")).toBeHidden();
});

test("Can switch network", async ({ page, metamask }) => {
  await metamask.onboard(config.ethMnemonic);
  await metamask.connectToNetwork("Mega Testnet");
  // await metamask.connectToNetwork(
  //   {
  //     chainId: 6342,
  //     currencySymbol: "ETH",
  //     name: "MEGA Testnet",
  //     rpc: "https://carrot.megaeth.com/rpc",
  //   },
  // );

  console.log("done");
});
