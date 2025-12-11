import { createWallet } from "../core/types";
import { Backpack } from "./backpack";
import { Metamask } from "./metamask";
import { PolkadotJS } from "./polkadot-js";

/**
 * Pre-built Backpack wallet configuration.
 */
export const backpack = createWallet({
  name: "backpack",
  extensionDir: "backpack",
  WalletClass: Backpack,
});

/**
 * Pre-built MetaMask wallet configuration.
 */
export const metamask = createWallet({
  name: "metamask",
  extensionDir: "metamask",
  WalletClass: Metamask,
});

/**
 * Pre-built Polkadot.js wallet configuration.
 */
export const polkadotJS = createWallet({
  name: "polkadotJS",
  extensionDir: "polkadotJS",
  WalletClass: PolkadotJS,
});

// Export classes for advanced usage / extending
export { Backpack, Metamask, PolkadotJS };
export type { NetworkSettings } from "./metamask";
