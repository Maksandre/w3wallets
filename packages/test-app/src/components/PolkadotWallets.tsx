'use client';

import React from 'react';
import { usePolkadotWalletContext } from '../polkadot/PolkadotWalletProvider';

export function PolkadotWallet() {
  const {
    status,
    addresses,
    connectors,
    connect,
    disconnect,
    error,
  } = usePolkadotWalletContext();

  return (
    <div>
      <h2>Polkadot</h2>

      <div>
        <strong>Account Info:</strong>
        <br />
        Status: {status}
        <br />
        Addresses: {JSON.stringify(addresses)}
      </div>

      {status === 'connected' && (
        <button type="button" onClick={disconnect}>
          Disconnect
        </button>
      )}

      <div>
        <h3>Connect</h3>
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
        <div style={{ color: 'red' }}>{error?.message}</div>
      </div>
    </div>
  );
}
