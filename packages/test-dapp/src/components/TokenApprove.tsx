"use client";

import { useState } from "react";
import { useERC20 } from "@/hooks/useERC20";
import { useAccount, useReadContract } from "wagmi";
import { type Address, formatUnits } from "viem";
import { TEST_TOKEN_ABI } from "@/config/contracts";

export function TokenApprove() {
  const { isConnected, address } = useAccount();
  const { approve, symbol, decimals, isWritePending, tokenAddress } = useERC20();
  const [spender, setSpender] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: TEST_TOKEN_ABI,
    functionName: "allowance",
    args: address && spender ? [address, spender as Address] : undefined,
    query: { enabled: !!address && !!spender && spender.startsWith("0x") },
  });

  if (!isConnected) {
    return null;
  }

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spender || !amount) return;

    try {
      setStatus("idle");
      await approve(spender as Address, amount);
      setStatus("success");
      await refetchAllowance();
    } catch (error) {
      console.error("Approve failed:", error);
      setStatus("error");
    }
  };

  const formattedAllowance = allowance !== undefined && decimals !== undefined
    ? formatUnits(allowance as bigint, decimals)
    : null;

  return (
    <form onSubmit={handleApprove} className="space-y-4">
      <h3 className="font-medium text-gray-700">Approve Spender</h3>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Spender Address</label>
        <input
          type="text"
          value={spender}
          onChange={(e) => setSpender(e.target.value)}
          placeholder="0x..."
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          data-testid="token-approve-spender"
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
          data-testid="token-approve-amount"
        />
      </div>
      {formattedAllowance !== null && (
        <div className="text-sm">
          <span className="text-gray-600">Current Allowance: </span>
          <span data-testid="token-allowance">{formattedAllowance}</span>
          <span className="text-gray-400 ml-1">{symbol}</span>
        </div>
      )}
      <button
        type="submit"
        disabled={isWritePending || !spender || !amount}
        className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
        data-testid="token-approve-submit"
      >
        {isWritePending ? "Approving..." : "Approve"}
      </button>
      {status === "success" && (
        <p className="text-green-600 text-sm" data-testid="token-approve-success">
          Approval successful!
        </p>
      )}
      {status === "error" && (
        <p className="text-red-600 text-sm" data-testid="token-approve-error">
          Approval failed
        </p>
      )}
    </form>
  );
}
