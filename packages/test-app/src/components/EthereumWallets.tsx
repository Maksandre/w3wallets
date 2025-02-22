"use client";

import React from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export function EthereumWallet() {
  const account = useAccount();
  const { connectors, connect, status, error } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <div>
      <h2>Ethereum</h2>

      <div>
        <strong>Account Info:</strong>
        <br />
        Status: {account.status}
        <br />
        Addresses: {JSON.stringify(account.addresses)}
        <br />
        Chain ID: {account.chainId}
      </div>

      {account.status === "connected" && (
        <button type="button" onClick={() => disconnect()}>
          Disconnect
        </button>
      )}

      <div>
        <h3>Connect</h3>
        {connectors.map((connector) => (
          <button
            key={connector.id}
            onClick={() => connect({ connector })}
            type="button"
          >
            {connector.name}
          </button>
        ))}
        <div>Status: {status}</div>
        <div style={{ color: "red" }}>{error?.message}</div>
      </div>
    </div>
  );
}
