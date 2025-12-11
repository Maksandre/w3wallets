export { withWallets } from "./withWallets";

// Pre-built wallet configs
export { backpack, metamask, polkadotJS } from "./wallets";
export { Backpack, Metamask, PolkadotJS } from "./wallets";

// Helper for creating custom wallet configs
export { createWallet } from "./core/types";

// Types
export type { IWallet, WalletConfig, Network } from "./core/types";
export type { NetworkSettings } from "./wallets/metamask";
