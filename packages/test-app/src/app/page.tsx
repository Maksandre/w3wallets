'use client';

import React from 'react';
import { EthereumWallet } from '../components/EthereumWallets';
import { PolkadotWallet } from '../components/PolkadotWallets';

function App() {
  return (
    <>
      <EthereumWallet />
      <hr />
      <PolkadotWallet />
    </>
  );
}

export default App;
