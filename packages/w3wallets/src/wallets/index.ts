import { createWallet } from "../core/types";
import { Metamask } from "./metamask";
import { PolkadotJS } from "./polkadot-js";

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
  extensionDir: "polkadotjs",
  WalletClass: PolkadotJS,
});

// Export classes for advanced usage / extending
export { Metamask, PolkadotJS };
export type { NetworkSettings } from "./metamask";
