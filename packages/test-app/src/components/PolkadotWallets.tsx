"use client";

import React from "react";
import { usePolkadotWalletContext } from "../lib/polkadot/PolkadotWalletProvider";
import Heading from "./ui/Heading";
import Button from "./ui/Button";
import Radio from "./ui/Radio";
import Text from "./ui/Text";

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
      <Heading level={2}>Polkadot</Heading>

      {/* Account Info Section */}
      <div className="space-y-2">
        <Text>Status: {status}</Text>
        <Text>Active Account: {activeAccount || "None"}</Text>
      </div>

      {/* Connected Accounts Section */}
      {addresses.length > 0 && (
        <div className="space-y-4">
          <Heading level={3}>Connected Accounts</Heading>
          {activeAccount && (
            <Radio
              name="account-select"
              selectedValue={activeAccount}
              onChange={(address) => setActiveAccount(address)}
              options={addresses.map((a) => ({ label: a, value: a }))}
            />
          )}

          <Button onClick={disconnect} variant="danger">
            Disconnect
          </Button>
        </div>
      )}

      {/* Connect Wallet Section */}
      <div className="space-y-4">
        <Heading level={3}>Connect a Wallet</Heading>
        <div className="flex flex-wrap gap-2">
          {connectors.map((connector) => (
            <Button
              key={connector.uid}
              onClick={() => connect({ connector })}
              disabled={!connector.installed}
            >
              {connector.name}
            </Button>
          ))}
        </div>
        {error && <Text color="danger">{error.message}</Text>}
      </div>
    </div>
  );
}
