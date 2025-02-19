"use client";

import React from "react";
import { EthereumWallet } from "../components/EthereumWallets";
import { PolkadotWallet } from "../components/PolkadotWallets";
import TransferForm from "@/components/TransferForm";

function App() {
  return (
    <>
      <div>
        <EthereumWallet />
      </div>
      <div>
        <PolkadotWallet />
        <TransferForm></TransferForm>
      </div>
    </>
  );
}

export default App;
