import { test as base, expect } from "@playwright/test";
import { withWallets, metamask } from "../src";
import config from "./utils/config";

const test = withWallets(base, metamask);

test("Can onboard MetaMask with seed phrase", async ({ metamask }) => {
  await metamask.onboard(config.ethMnemonic);
  await metamask.accountNameIs("Account 1");
});
