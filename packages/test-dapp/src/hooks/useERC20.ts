"use client";

import { useReadContract, useWriteContract, useAccount } from "wagmi";
import { parseUnits, formatUnits, type Address } from "viem";
import { CONTRACT_ADDRESSES, TEST_TOKEN_ABI } from "@/config/contracts";

const TOKEN_ADDRESS = CONTRACT_ADDRESSES.testToken;

export function useERC20() {
  const { address } = useAccount();
  const { writeContractAsync, isPending: isWritePending } = useWriteContract();

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

  const getAllowance = (spender: Address) => {
    return useReadContract({
      address: TOKEN_ADDRESS,
      abi: TEST_TOKEN_ABI,
      functionName: "allowance",
      args: address ? [address, spender] : undefined,
      query: { enabled: !!address && !!spender },
    });
  };

  const transfer = async (to: Address, amount: string) => {
    const parsedAmount = parseUnits(amount, (decimals as number) ?? 18);
    const hash = await writeContractAsync({
      address: TOKEN_ADDRESS,
      abi: TEST_TOKEN_ABI,
      functionName: "transfer",
      args: [to, parsedAmount],
    });
    await refetchBalance();
    return hash;
  };

  const approve = async (spender: Address, amount: string) => {
    const parsedAmount = parseUnits(amount, (decimals as number) ?? 18);
    const hash = await writeContractAsync({
      address: TOKEN_ADDRESS,
      abi: TEST_TOKEN_ABI,
      functionName: "approve",
      args: [spender, parsedAmount],
    });
    return hash;
  };

  const mint = async (to: Address, amount: string) => {
    const parsedAmount = parseUnits(amount, (decimals as number) ?? 18);
    const hash = await writeContractAsync({
      address: TOKEN_ADDRESS,
      abi: TEST_TOKEN_ABI,
      functionName: "mint",
      args: [to, parsedAmount],
    });
    await refetchBalance();
    return hash;
  };

  const formattedBalance = balance !== undefined && decimals !== undefined
    ? formatUnits(balance as bigint, decimals as number)
    : "0";

  return {
    balance: formattedBalance,
    rawBalance: balance as bigint | undefined,
    decimals: decimals as number | undefined,
    symbol: symbol as string | undefined,
    name: name as string | undefined,
    transfer,
    approve,
    mint,
    getAllowance,
    refetchBalance,
    isWritePending,
    tokenAddress: TOKEN_ADDRESS,
  };
}
