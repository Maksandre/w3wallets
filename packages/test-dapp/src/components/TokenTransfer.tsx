"use client";

import { useState } from "react";
import { useERC20 } from "@/hooks/useERC20";
import { useAccount } from "wagmi";
import { type Address } from "viem";

export function TokenTransfer() {
  const { isConnected } = useAccount();
  const { transfer, symbol, isWritePending } = useERC20();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  if (!isConnected) {
    return null;
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount) return;

    try {
      setStatus("idle");
      await transfer(recipient as Address, amount);
      setStatus("success");
      setRecipient("");
      setAmount("");
    } catch (error) {
      console.error("Transfer failed:", error);
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleTransfer} className="space-y-4">
      <h3 className="font-medium text-gray-700">Transfer Tokens</h3>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Recipient Address</label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x..."
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          data-testid="token-transfer-recipient"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Amount ({symbol})</label>
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          data-testid="token-transfer-amount"
        />
      </div>
      <button
        type="submit"
        disabled={isWritePending || !recipient || !amount}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        data-testid="token-transfer-submit"
      >
        {isWritePending ? "Transferring..." : "Transfer"}
      </button>
      {status === "success" && (
        <p className="text-green-600 text-sm" data-testid="token-transfer-success">
          Transfer successful!
        </p>
      )}
      {status === "error" && (
        <p className="text-red-600 text-sm" data-testid="token-transfer-error">
          Transfer failed
        </p>
      )}
    </form>
  );
}
