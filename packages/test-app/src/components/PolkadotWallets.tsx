"use client";

import React from "react";
import { usePolkadotWalletContext } from "../lib/polkadot/PolkadotWalletProvider";

export function PolkadotWallet() {
  const {
    status,
    addresses,
    activeAccount,
    setActiveAccount,
    connectors,
    connect,
    disconnect,
    error,
  } = usePolkadotWalletContext();

  return (
    <div>
      <h2>Polkadot Wallet</h2>

      <div>
        <strong>Account Info:</strong>
        <p>Status: {status}</p>
        <p>Active Account: {activeAccount || "None"}</p>
      </div>

      {status === "connected" && (
        <button type="button" onClick={disconnect}>
          Disconnect
        </button>
      )}

      {addresses.length > 0 && (
        <div>
          <h3>Connected Accounts</h3>
          <div>
            <ul>
              {addresses.map((address) => (
                <li key={address} onClick={() => setActiveAccount(address)}>
                  {address}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div>
        <h3>Connect a Wallet</h3>
        <div>
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              onClick={() => connect({ connector })}
              type="button"
              disabled={!connector.installed}
            >
              {connector.name}
            </button>
          ))}
        </div>
        {error && <div>{error.message}</div>}
      </div>
    </div>
  );
}
