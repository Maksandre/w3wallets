"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { WagmiProvider, type State } from "wagmi";
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet, sepolia, anvil } from "@reown/appkit/networks";
import { PolkadotWalletProvider } from "@/lib/polkadot";

// WalletConnect project ID
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo";

// Define local anvil network for AppKit
const localAnvil = {
  ...anvil,
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"] as const,
    },
  },
} as const;

// Create wagmi adapter for AppKit
const wagmiAdapter = new WagmiAdapter({
  networks: [localAnvil, mainnet, sepolia],
  projectId,
  ssr: true,
});

// Create AppKit instance
createAppKit({
  adapters: [wagmiAdapter],
  networks: [localAnvil, mainnet, sepolia],
  projectId,
  metadata: {
    name: "W3Wallets Test DApp",
    description: "Test DApp for w3wallets library",
    url: "http://localhost:3001",
    icons: ["https://avatars.githubusercontent.com/u/179229932"],
  },
  features: {
    analytics: false,
  },
});

export function Providers({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: State;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider
      // @ts-expect-error - wagmiAdapter.wagmiConfig type mismatch with WagmiProvider
      config={wagmiAdapter.wagmiConfig}
      initialState={initialState}
    >
      <QueryClientProvider client={queryClient}>
        <PolkadotWalletProvider>{children}</PolkadotWalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
