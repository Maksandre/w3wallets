"use client";

import { useChainId } from "wagmi";
import {
  WalletConnect,
  NetworkInfo,
  TokenSection,
  NftSection,
  SignMessageSection,
} from "@/components";

export default function Home() {
  const chainId = useChainId();
  const isAnvil = chainId === 31337;

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">W3Wallets Test DApp</h1>

        {/* Wallet Connection Section */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Wallet Connection</h2>
          <WalletConnect />
        </section>

        {/* Network Section */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Network</h2>
          <NetworkInfo />
        </section>

        {/* Token Sections - Only visible on Anvil */}
        {isAnvil && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* ERC-20 Section */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">
                TestToken{" "}
                <span className="text-gray-500 font-normal">(ERC-20)</span>
              </h2>
              <TokenSection />
            </section>

            {/* ERC-721 Section */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">
                TestNFT{" "}
                <span className="text-gray-500 font-normal">(ERC-721)</span>
              </h2>
              <NftSection />
            </section>
          </div>
        )}

        {/* Sign Message Section */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Sign Message</h2>
          <SignMessageSection />
        </section>
      </div>
    </main>
  );
}
