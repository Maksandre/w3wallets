"use client";

import React from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import Heading from "./ui/Heading";
import Button from "./ui/Button";
import Text from "./ui/Text";

export function EthereumWallet() {
  const account = useAccount();
  const { connectors, connect, status, error } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <div>
      <Heading level={2}>Ethereum</Heading>

      <div className="space-y-2">
        <Text>Status: {account.status}</Text>
        <Text>Addresses: {JSON.stringify(account.addresses)}</Text>
        <Text>Chain ID: {account.chainId}</Text>
      </div>

      {account.status === "connected" && (
        <Button onClick={() => disconnect()} variant="danger">
          Disconnect
        </Button>
      )}

      <div className="space-y-4">
        <Heading level={3}>Connect</Heading>
        <div className="flex flex-wrap gap-2">
          {connectors.map((connector) => (
            <Button
              key={connector.id}
              onClick={() => connect({ connector })}
              variant="primary"
            >
              {connector.name}
            </Button>
          ))}
        </div>
        <Text>Status: {status}</Text>
        {error && <Text color="danger">{error.message}</Text>}
      </div>
    </div>
  );
}
