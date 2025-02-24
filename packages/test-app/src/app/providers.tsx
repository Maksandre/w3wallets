"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { type State, WagmiProvider } from "wagmi";
import { getConfig } from "@/wagmi";
import { PolkadotWalletProvider } from "@/lib/polkadot";
import { PAPIProvider } from "@/lib/polkadot/PAPIProvider";

export function Providers(props: {
  children: ReactNode;
  initialState?: State;
}) {
  const [config] = useState(() => getConfig());
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config} initialState={props.initialState}>
      <PolkadotWalletProvider>
        <PAPIProvider>
          <QueryClientProvider client={queryClient}>
            {props.children}
          </QueryClientProvider>
        </PAPIProvider>
      </PolkadotWalletProvider>
    </WagmiProvider>
  );
}
