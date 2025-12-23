"use client";

import { usePolkadotWallet } from "@/lib/polkadot";

export default function PolkadotPage() {
  const {
    status,
    accounts,
    activeAccount,
    setActiveAccount,
    connectors,
    connect,
    disconnect,
    error,
  } = usePolkadotWallet();

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Polkadot Wallet Test</h1>

        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Wallet Connection</h2>

          {status === "connected" ? (
            <div className="space-y-4">
              <div>
                <span className="text-gray-600">Status: </span>
                <span
                  className="text-green-600 font-medium"
                  data-testid="connection-status"
                >
                  connected
                </span>
              </div>
              <div>
                <span className="text-gray-600">Active Account: </span>
                <code
                  className="bg-gray-100 px-2 py-1 rounded text-sm break-all"
                  data-testid="account-address"
                >
                  {activeAccount?.address}
                </code>
              </div>

              {accounts.length > 1 && (
                <div className="space-y-2">
                  <span className="text-gray-600">Select Account:</span>
                  <div className="flex flex-col gap-2">
                    {accounts.map((account) => (
                      <label
                        key={account.address}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="account"
                          checked={activeAccount?.address === account.address}
                          onChange={() => setActiveAccount(account)}
                          className="w-4 h-4"
                        />
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm break-all">
                          {account.address}
                        </code>
                      </label>
                    ))}
                  </div>
                </div>
              )}

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
                  {status}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {connectors.map((connector) => (
                  <button
                    key={connector.uid}
                    onClick={() => connect({ connector })}
                    disabled={!connector.installed || status === "connecting"}
                    className={`px-4 py-2 rounded ${
                      connector.installed
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                    data-testid={`connector-${connector.uid}`}
                  >
                    {connector.name}
                    {!connector.installed && " (not installed)"}
                  </button>
                ))}
              </div>

              {error && (
                <div className="text-red-500 text-sm">{error.message}</div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
