"use client";

import React from "react";
import { EthereumWallet } from "../components/EthereumWallets";
import { PolkadotWallet } from "../components/PolkadotWallets";
import TransferForm from "@/components/TransferForm";
import Card from "@/components/Card";

function App() {
  return (
    <div className="flex">
      <Card>
        <EthereumWallet />
      </Card>
      <Card>
        <PolkadotWallet />
        <TransferForm></TransferForm>
      </Card>
    </div>
  );
}

export default App;
