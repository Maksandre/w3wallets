"use client";

import { WalletConnect, NetworkInfo } from "@/components";

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
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

        {/* ERC-20 Section - Placeholder */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">ERC-20 Token</h2>
          <p className="text-gray-500">Coming in Phase 4...</p>
        </section>

        {/* ERC-721 Section - Placeholder */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">ERC-721 NFT</h2>
          <p className="text-gray-500">Coming in Phase 5...</p>
        </section>
      </div>
    </main>
  );
}
