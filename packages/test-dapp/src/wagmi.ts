import { createConfig, http } from "wagmi";
import { anvil, mainnet, sepolia } from "wagmi/chains";

// No explicit connectors: wagmi discovers installed wallets via EIP-6963,
// so MetaMask shows up as its own "MetaMask" connector.
export const config = createConfig({
  chains: [anvil, mainnet, sepolia],
  transports: {
    [anvil.id]: http(),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  // Local Anvil mines instantly; poll receipts often to keep e2e tests fast.
  pollingInterval: 500,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
