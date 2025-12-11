"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useAppKit } from "@reown/appkit/react";

export default function Home() {
  const { address, isConnected, chain } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">W3Wallets Test DApp</h1>

        {/* Wallet Connection Section */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Wallet Connection</h2>

          {isConnected ? (
            <div className="space-y-4">
              <div>
                <span className="text-gray-600">Status: </span>
                <span className="text-green-600 font-medium" data-testid="connection-status">
                  connected
                </span>
              </div>
              <div>
                <span className="text-gray-600">Address: </span>
                <code className="bg-gray-100 px-2 py-1 rounded" data-testid="account-address">
                  {address}
                </code>
              </div>
              <div>
                <span className="text-gray-600">Network: </span>
                <span data-testid="network-name">{chain?.name || "Unknown"}</span>
                <span className="text-gray-400 ml-2" data-testid="chain-id">
                  (ID: {chain?.id})
                </span>
              </div>
              <button
                onClick={() => disconnect()}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                data-testid="disconnect-button"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <span className="text-gray-600">Status: </span>
                <span className="text-gray-500" data-testid="connection-status">
                  disconnected
                </span>
              </div>

              {/* AppKit Modal Button */}
              <button
                onClick={() => open()}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
                data-testid="connect-button"
              >
                Connect Wallet
              </button>

              {/* Direct connector buttons */}
              <div className="flex flex-wrap gap-2 mt-4">
                {connectors.map((connector) => (
                  <button
                    key={connector.uid}
                    onClick={() => connect({ connector })}
                    className="bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300 text-sm"
                    data-testid={`connector-${connector.id}`}
                  >
                    {connector.name}
                  </button>
                ))}
              </div>
            </div>
          )}
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
