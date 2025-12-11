"use client";

import { useState } from "react";
import { useERC721 } from "@/hooks/useERC721";
import { useAccount } from "wagmi";
import { type Address } from "viem";

export function NftSection() {
  const { isConnected, address } = useAccount();
  const {
    balance,
    symbol,
    name,
    ownedTokenIds,
    mint,
    transferFrom,
    isWritePending,
  } = useERC721();

  const [mintStatus, setMintStatus] = useState<"idle" | "success" | "error">("idle");
  const [transferStatus, setTransferStatus] = useState<"idle" | "success" | "error">("idle");
  const [recipient, setRecipient] = useState("");
  const [tokenId, setTokenId] = useState("");

  if (!isConnected) {
    return (
      <p className="text-gray-500" data-testid="nft-not-connected">
        Connect wallet to see NFT collection
      </p>
    );
  }

  const handleMint = async () => {
    if (!address) return;
    try {
      setMintStatus("idle");
      await mint(address, "");
      setMintStatus("success");
    } catch (error) {
      console.error("Mint failed:", error);
      setMintStatus("error");
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !recipient || !tokenId) return;
    try {
      setTransferStatus("idle");
      await transferFrom(address, recipient as Address, BigInt(tokenId));
      setTransferStatus("success");
      setRecipient("");
      setTokenId("");
    } catch (error) {
      console.error("Transfer failed:", error);
      setTransferStatus("error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Gallery */}
      <div className="space-y-4">
        <div>
          <span className="text-gray-600">Collection: </span>
          <span className="font-medium" data-testid="nft-name">
            {name ?? "Loading..."}
          </span>
          <span className="text-gray-400 ml-2" data-testid="nft-symbol">
            ({symbol ?? "..."})
          </span>
        </div>
        <div>
          <span className="text-gray-600">Your NFTs: </span>
          <span className="font-medium text-lg" data-testid="nft-balance">
            {balance?.toString() ?? "0"}
          </span>
        </div>
        <div data-testid="nft-gallery">
          {ownedTokenIds.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-2">
              {ownedTokenIds.map((id) => (
                <span
                  key={id.toString()}
                  className="bg-gray-100 px-3 py-1 rounded text-sm"
                  data-testid={`nft-item-${id}`}
                >
                  #{id.toString()}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              No NFTs owned yet. Mint one below!
            </p>
          )}
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Mint */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-700">Mint NFT</h3>
        <button
          onClick={handleMint}
          disabled={isWritePending}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          data-testid="nft-mint-submit"
        >
          {isWritePending ? "Minting..." : "Mint NFT"}
        </button>
        {mintStatus === "success" && (
          <p className="text-green-600 text-sm" data-testid="nft-mint-success">
            NFT minted successfully!
          </p>
        )}
        {mintStatus === "error" && (
          <p className="text-red-600 text-sm" data-testid="nft-mint-error">
            Mint failed
          </p>
        )}
      </div>

      <hr className="border-gray-200" />

      {/* Transfer */}
      <form onSubmit={handleTransfer} className="space-y-4">
        <h3 className="font-medium text-gray-700">Transfer NFT</h3>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Token ID</label>
          <input
            type="text"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            placeholder="0"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            data-testid="nft-transfer-tokenid"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Recipient Address</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            data-testid="nft-transfer-recipient"
          />
        </div>
        <button
          type="submit"
          disabled={isWritePending || !recipient || !tokenId}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          data-testid="nft-transfer-submit"
        >
          {isWritePending ? "Transferring..." : "Transfer"}
        </button>
        {transferStatus === "success" && (
          <p className="text-green-600 text-sm" data-testid="nft-transfer-success">
            Transfer successful!
          </p>
        )}
        {transferStatus === "error" && (
          <p className="text-red-600 text-sm" data-testid="nft-transfer-error">
            Transfer failed
          </p>
        )}
      </form>
    </div>
  );
}
