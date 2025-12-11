import { http, createConfig, createStorage, cookieStorage } from "wagmi";
import { mainnet, sepolia, hardhat } from "wagmi/chains";
import { injected, coinbaseWallet, walletConnect } from "wagmi/connectors";

// WalletConnect project ID
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

// Define local hardhat chain (31337)
export const localHardhat = {
  ...hardhat,
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
    },
  },
} as const;

export const config = createConfig({
  chains: [localHardhat, mainnet, sepolia],
  connectors: [
    injected(),
    coinbaseWallet({ appName: "W3Wallets Test DApp" }),
    ...(projectId ? [walletConnect({ projectId })] : []),
  ],
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  transports: {
    [localHardhat.id]: http(),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
