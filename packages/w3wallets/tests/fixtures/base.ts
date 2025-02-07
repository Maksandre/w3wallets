import { withWallets } from "w3wallets";
import { test as base } from "@playwright/test";

export const test = withWallets(base, 'backpack', 'polkadotJS').extend<BaseFixture>({
  magic: (_, use) => use(42),
});

type BaseFixture = {
  magic: number;
};

export { expect } from "@playwright/test";
