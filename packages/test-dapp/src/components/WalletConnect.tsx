"use client";

import { useAccount, useConnect, useDisconnect, type Connector } from "wagmi";
import { useAppKit } from "@reown/appkit/react";

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();

  if (isConnected) {
    return (
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
          <span className="text-gray-600">Address: </span>
          <code
            className="bg-gray-100 px-2 py-1 rounded"
            data-testid="account-address"
          >
            {address}
          </code>
        </div>
        <button
          onClick={() => disconnect()}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          data-testid="disconnect-button"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <span className="text-gray-600">Status: </span>
        <span className="text-gray-500" data-testid="connection-status">
          disconnected
        </span>
      </div>

      <button
        onClick={() => open()}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
        data-testid="connect-button"
      >
        Connect Wallet
      </button>

      <div className="flex flex-wrap gap-2 mt-4">
        {connectors.map((connector: Connector) => (
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
  );
}
