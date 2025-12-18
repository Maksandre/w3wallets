"use client";

import { useState } from "react";
import { useReadContract, useWriteContract, useAccount, usePublicClient } from "wagmi";
import { type Address, parseUnits, formatUnits } from "viem";
import { CONTRACT_ADDRESSES, TEST_TOKEN_ABI } from "@/config/contracts";

const TOKEN_ADDRESS = CONTRACT_ADDRESSES.testToken;

export function TokenSection() {
  const { isConnected, address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending: isWritePending } = useWriteContract();

  const [transferRecipient, setTransferRecipient] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferStatus, setTransferStatus] = useState<"idle" | "success" | "error">("idle");

  const [approveSpender, setApproveSpender] = useState("");
  const [approveAmount, setApproveAmount] = useState("");
  const [approveStatus, setApproveStatus] = useState<"idle" | "success" | "error">("idle");

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: TEST_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: decimals } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: TEST_TOKEN_ABI,
    functionName: "decimals",
  });

  const { data: symbol } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: TEST_TOKEN_ABI,
    functionName: "symbol",
  });

  const { data: name } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: TEST_TOKEN_ABI,
    functionName: "name",
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: TEST_TOKEN_ABI,
    functionName: "allowance",
    args: address && approveSpender ? [address, approveSpender as Address] : undefined,
    query: { enabled: !!address && !!approveSpender && approveSpender.startsWith("0x") },
  });

  const formattedBalance = balance !== undefined && decimals !== undefined
    ? formatUnits(balance as bigint, decimals as number)
    : "0";

  const formattedAllowance = allowance !== undefined && decimals !== undefined
    ? formatUnits(allowance as bigint, decimals as number)
    : null;

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
      const parsedAmount = parseUnits("1000", (decimals as number) ?? 18);
      const hash = await writeContractAsync({
        address: TOKEN_ADDRESS,
        abi: TEST_TOKEN_ABI,
        functionName: "mint",
        args: [address, parsedAmount],
      });
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
      await refetchBalance();
    } catch (error) {
      console.error("Mint failed:", error);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferRecipient || !transferAmount) return;
    try {
      setTransferStatus("idle");
      const parsedAmount = parseUnits(transferAmount, (decimals as number) ?? 18);
      const hash = await writeContractAsync({
        address: TOKEN_ADDRESS,
        abi: TEST_TOKEN_ABI,
        functionName: "transfer",
        args: [transferRecipient as Address, parsedAmount],
      });
      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status === "reverted") {
          setTransferStatus("error");
          return;
        }
      }
      await refetchBalance();
      setTransferStatus("success");
      setTransferRecipient("");
      setTransferAmount("");
    } catch (error) {
      console.error("Transfer failed:", error);
      setTransferStatus("error");
    }
  };

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveSpender || !approveAmount) return;
    try {
      setApproveStatus("idle");
      const parsedAmount = parseUnits(approveAmount, (decimals as number) ?? 18);
      const hash = await writeContractAsync({
        address: TOKEN_ADDRESS,
        abi: TEST_TOKEN_ABI,
        functionName: "approve",
        args: [approveSpender as Address, parsedAmount],
      });
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
      await refetchAllowance();
      setApproveStatus("success");
    } catch (error) {
      console.error("Approve failed:", error);
      setApproveStatus("error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Balance */}
      <div className="space-y-4">
        <div>
          <span className="text-gray-600">Token: </span>
          <span className="font-medium" data-testid="token-name">
{(name as string) ?? "Loading..."}
          </span>
          <span className="text-gray-400 ml-2" data-testid="token-symbol">
            ({(symbol as string) ?? "..."})
          </span>
        </div>
        <div>
          <span className="text-gray-600">Balance: </span>
          <span className="font-medium text-lg" data-testid="token-balance">
            {formattedBalance}
          </span>
          <span className="text-gray-400 ml-1">{(symbol as string)}</span>
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

      <hr className="border-gray-200" />

      {/* Transfer */}
      <form onSubmit={handleTransfer} className="space-y-4">
        <h3 className="font-medium text-gray-700">Transfer Tokens</h3>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Recipient Address</label>
          <input
            type="text"
            value={transferRecipient}
            onChange={(e) => setTransferRecipient(e.target.value)}
            placeholder="0x..."
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            data-testid="token-transfer-recipient"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Amount ({(symbol as string)})</label>
          <input
            type="text"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            placeholder="0.0"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            data-testid="token-transfer-amount"
          />
        </div>
        <button
          type="submit"
          disabled={isWritePending || !transferRecipient || !transferAmount}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          data-testid="token-transfer-submit"
        >
          {isWritePending ? "Transferring..." : "Transfer"}
        </button>
        {transferStatus === "success" && (
          <p className="text-green-600 text-sm" data-testid="token-transfer-success">
            Transfer successful!
          </p>
        )}
        {transferStatus === "error" && (
          <p className="text-red-600 text-sm" data-testid="token-transfer-error">
            Transfer failed
          </p>
        )}
      </form>

      <hr className="border-gray-200" />

      {/* Approve */}
      <form onSubmit={handleApprove} className="space-y-4">
        <h3 className="font-medium text-gray-700">Approve Spender</h3>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Spender Address</label>
          <input
            type="text"
            value={approveSpender}
            onChange={(e) => setApproveSpender(e.target.value)}
            placeholder="0x..."
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            data-testid="token-approve-spender"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Amount ({(symbol as string)})</label>
          <input
            type="text"
            value={approveAmount}
            onChange={(e) => setApproveAmount(e.target.value)}
            placeholder="0.0"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            data-testid="token-approve-amount"
          />
        </div>
        {formattedAllowance !== null && (
          <div className="text-sm">
            <span className="text-gray-600">Current Allowance: </span>
            <span data-testid="token-allowance">{formattedAllowance}</span>
            <span className="text-gray-400 ml-1">{(symbol as string)}</span>
          </div>
        )}
        <button
          type="submit"
          disabled={isWritePending || !approveSpender || !approveAmount}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
          data-testid="token-approve-submit"
        >
          {isWritePending ? "Approving..." : "Approve"}
        </button>
        {approveStatus === "success" && (
          <p className="text-green-600 text-sm" data-testid="token-approve-success">
            Approval successful!
          </p>
        )}
        {approveStatus === "error" && (
          <p className="text-red-600 text-sm" data-testid="token-approve-error">
            Approval failed
          </p>
        )}
      </form>
    </div>
  );
}
