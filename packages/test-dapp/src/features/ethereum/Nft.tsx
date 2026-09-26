import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import type { Address } from "viem";
import { useConnection, usePublicClient, useReadContract, useReadContracts } from "wagmi";
import { writeContract } from "wagmi/actions";
import { Button, Field, Muted, Result } from "@/components/ui";
import { testNftConfig } from "@/generated";
import { config } from "@/wagmi";
import { useTransaction } from "./useTransaction";

/** Token IDs currently owned by `owner`, replayed from Transfer events. */
function useOwnedTokenIds(owner: Address | undefined) {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["nft-owned", owner],
    enabled: !!owner && !!publicClient,
    queryFn: async () => {
      const transfers = await publicClient!.getContractEvents({
        ...testNftConfig,
        eventName: "Transfer",
        fromBlock: 0n,
      });
      const ownerOf = new Map<bigint, Address>();
      for (const { args } of transfers) {
        ownerOf.set(args.tokenId!, args.to!);
      }
      return [...ownerOf]
        .filter(([, to]) => to.toLowerCase() === owner!.toLowerCase())
        .map(([id]) => id);
    },
  });
}

export function Nft() {
  const { address, isConnected } = useConnection();

  const { data: metadata } = useReadContracts({
    allowFailure: false,
    contracts: [
      { ...testNftConfig, functionName: "name" },
      { ...testNftConfig, functionName: "symbol" },
    ],
  });
  const [name, symbol] = metadata ?? [];

  const { data: balance } = useReadContract({
    ...testNftConfig,
    functionName: "balanceOf",
    args: address && [address],
    query: { enabled: !!address },
  });
  const { data: ownedTokenIds = [] } = useOwnedTokenIds(address);

  const mint = useTransaction((to: Address) =>
    writeContract(config, { ...testNftConfig, functionName: "mint", args: [to, ""] }),
  );

  if (!isConnected || !address) {
    return <Muted testId="nft-not-connected">Connect wallet to see NFT collection</Muted>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <p>
          <span className="text-gray-600">Collection: </span>
          <span className="font-medium" data-testid="nft-name">
            {name ?? "Loading..."}
          </span>
          <span className="ml-2 text-gray-400" data-testid="nft-symbol">
            ({symbol ?? "..."})
          </span>
        </p>
        <p>
          <span className="text-gray-600">Your NFTs: </span>
          <span className="text-lg font-medium" data-testid="nft-balance">
            {(balance ?? 0n).toString()}
          </span>
        </p>
        <div data-testid="nft-gallery">
          {ownedTokenIds.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {ownedTokenIds.map((id) => (
                <li
                  key={id.toString()}
                  className="rounded bg-gray-100 px-3 py-1 text-sm"
                  data-testid={`nft-item-${id}`}
                >
                  #{id.toString()}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No NFTs owned yet. Mint one below!</p>
          )}
        </div>
      </div>

      <hr className="border-gray-200" />

      <div className="space-y-4">
        <h3 className="font-medium text-gray-700">Mint NFT</h3>
        <Button
          variant="success"
          disabled={mint.isPending}
          onClick={() => mint.mutate(address)}
          data-testid="nft-mint-submit"
        >
          {mint.isPending ? "Minting..." : "Mint NFT"}
        </Button>
        {mint.isSuccess && (
          <Result ok testId="nft-mint-success">
            NFT minted successfully!
          </Result>
        )}
        {mint.isError && (
          <Result ok={false} testId="nft-mint-error">
            Mint failed
          </Result>
        )}
      </div>

      <hr className="border-gray-200" />
      <TransferForm owner={address} />
    </div>
  );
}

function TransferForm({ owner }: { owner: Address }) {
  const [tokenId, setTokenId] = useState("");
  const [recipient, setRecipient] = useState("");

  const transfer = useTransaction(() =>
    writeContract(config, {
      ...testNftConfig,
      functionName: "transferFrom",
      args: [owner, recipient as Address, BigInt(tokenId)],
    }),
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    transfer.mutate(undefined, {
      onSuccess: () => {
        setTokenId("");
        setRecipient("");
      },
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h3 className="font-medium text-gray-700">Transfer NFT</h3>
      <Field
        label="Token ID"
        value={tokenId}
        onChange={(e) => setTokenId(e.target.value)}
        placeholder="0"
        data-testid="nft-transfer-tokenid"
      />
      <Field
        label="Recipient Address"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        placeholder="0x..."
        data-testid="nft-transfer-recipient"
      />
      <Button
        type="submit"
        disabled={transfer.isPending || !recipient || !tokenId}
        data-testid="nft-transfer-submit"
      >
        {transfer.isPending ? "Transferring..." : "Transfer"}
      </Button>
      {transfer.isSuccess && (
        <Result ok testId="nft-transfer-success">
          Transfer successful!
        </Result>
      )}
      {transfer.isError && (
        <Result ok={false} testId="nft-transfer-error">
          Transfer failed
        </Result>
      )}
    </form>
  );
}
