"use client";

import { useERC20 } from "@/hooks/useERC20";
import { useAccount } from "wagmi";

export function TokenBalance() {
  const { isConnected, address } = useAccount();
  const { balance, symbol, name, mint, isWritePending } = useERC20();

  if (!isConnected) {
    return (
      <p className="text-gray-500" data-testid="token-not-connected">
        Connect wallet to see token balance
      </p>
    );
  }

  const handleMint = async () => {
    if (!address) return;
    try {
      await mint(address, "1000");
    } catch (error) {
      console.error("Mint failed:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <span className="text-gray-600">Token: </span>
        <span className="font-medium" data-testid="token-name">
          {name ?? "Loading..."}
        </span>
        <span className="text-gray-400 ml-2" data-testid="token-symbol">
          ({symbol ?? "..."})
        </span>
      </div>
      <div>
        <span className="text-gray-600">Balance: </span>
        <span className="font-medium text-lg" data-testid="token-balance">
          {balance}
        </span>
        <span className="text-gray-400 ml-1">{symbol}</span>
      </div>
      <button
        onClick={handleMint}
        disabled={isWritePending}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        data-testid="token-mint-button"
      >
        {isWritePending ? "Minting..." : "Mint 1000 Tokens"}
      </button>
    </div>
  );
}
