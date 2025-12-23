"use client";

import { useEffect, useState, useCallback } from "react";
import { useReadContract, useWriteContract, useAccount, usePublicClient } from "wagmi";
import { type Address, parseAbiItem } from "viem";
import { CONTRACT_ADDRESSES, TEST_NFT_ABI } from "@/config/contracts";

const NFT_ADDRESS = CONTRACT_ADDRESSES.testNFT;

export function useERC721() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending: isWritePending } = useWriteContract();
  const [ownedTokenIds, setOwnedTokenIds] = useState<bigint[]>([]);

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: NFT_ADDRESS,
    abi: TEST_NFT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: symbol } = useReadContract({
    address: NFT_ADDRESS,
    abi: TEST_NFT_ABI,
    functionName: "symbol",
  });

  const { data: name } = useReadContract({
    address: NFT_ADDRESS,
    abi: TEST_NFT_ABI,
    functionName: "name",
  });

  const fetchOwnedTokenIds = useCallback(async () => {
    if (!address || !publicClient) return;

    try {
      // Get Transfer events to this address
      const transfersTo = await publicClient.getLogs({
        address: NFT_ADDRESS,
        event: parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"),
        args: { to: address },
        fromBlock: BigInt(0),
      });

      // Get Transfer events from this address
      const transfersFrom = await publicClient.getLogs({
        address: NFT_ADDRESS,
        event: parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"),
        args: { from: address },
        fromBlock: BigInt(0),
      });

      // Calculate owned tokens
      const received = new Set(transfersTo.map((log) => log.args.tokenId!.toString()));
      const sent = new Set(transfersFrom.map((log) => log.args.tokenId!.toString()));

      const owned = [...received].filter((id) => !sent.has(id)).map((id) => BigInt(id));
      setOwnedTokenIds(owned);
    } catch (error) {
      console.error("Failed to fetch owned token IDs:", error);
    }
  }, [address, publicClient]);

  useEffect(() => {
    fetchOwnedTokenIds();
  }, [fetchOwnedTokenIds]);

  const mint = async (to: Address, uri: string) => {
    const hash = await writeContractAsync({
      address: NFT_ADDRESS,
      abi: TEST_NFT_ABI,
      functionName: "mint",
      args: [to, uri],
    });
    if (publicClient) {
      await publicClient.waitForTransactionReceipt({ hash });
    }
    await refetchBalance();
    await fetchOwnedTokenIds();
    return hash;
  };

  const transferFrom = async (from: Address, to: Address, tokenId: bigint) => {
    const hash = await writeContractAsync({
      address: NFT_ADDRESS,
      abi: TEST_NFT_ABI,
      functionName: "transferFrom",
      args: [from, to, tokenId],
    });
    if (publicClient) {
      await publicClient.waitForTransactionReceipt({ hash });
    }
    await refetchBalance();
    await fetchOwnedTokenIds();
    return hash;
  };

  return {
    balance: balance as bigint | undefined,
    symbol: symbol as string | undefined,
    name: name as string | undefined,
    ownedTokenIds,
    mint,
    transferFrom,
    refetchBalance,
    fetchOwnedTokenIds,
    isWritePending,
    nftAddress: NFT_ADDRESS,
  };
}
