import { useState, type FormEvent } from "react";
import { formatUnits, isAddress, parseUnits, type Address } from "viem";
import { useConnection, useReadContract, useReadContracts } from "wagmi";
import { writeContract } from "wagmi/actions";
import { Button, Field, Muted, Result } from "@/components/ui";
import { testTokenConfig } from "@/generated";
import { config } from "@/wagmi";
import { useTransaction } from "./useTransaction";

const MINT_AMOUNT = "1000";

export function Token() {
  const { address, isConnected } = useConnection();

  const { data: metadata } = useReadContracts({
    allowFailure: false,
    contracts: [
      { ...testTokenConfig, functionName: "name" },
      { ...testTokenConfig, functionName: "symbol" },
      { ...testTokenConfig, functionName: "decimals" },
    ],
  });
  const [name, symbol, decimals = 18] = metadata ?? [];

  const { data: balance } = useReadContract({
    ...testTokenConfig,
    functionName: "balanceOf",
    args: address && [address],
    query: { enabled: !!address },
  });

  const mint = useTransaction((to: Address) =>
    writeContract(config, {
      ...testTokenConfig,
      functionName: "mint",
      args: [to, parseUnits(MINT_AMOUNT, decimals)],
    }),
  );

  if (!isConnected || !address) {
    return <Muted testId="token-not-connected">Connect wallet to see token balance</Muted>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <p>
          <span className="text-gray-600">Token: </span>
          <span className="font-medium" data-testid="token-name">
            {name ?? "Loading..."}
          </span>
          <span className="ml-2 text-gray-400" data-testid="token-symbol">
            ({symbol ?? "..."})
          </span>
        </p>
        <p>
          <span className="text-gray-600">Balance: </span>
          <span className="text-lg font-medium" data-testid="token-balance">
            {formatUnits(balance ?? 0n, decimals)}
          </span>
          <span className="ml-1 text-gray-400">{symbol}</span>
        </p>
        <Button
          variant="success"
          disabled={mint.isPending}
          onClick={() => mint.mutate(address)}
          data-testid="token-mint-button"
        >
          {mint.isPending ? "Minting..." : `Mint ${MINT_AMOUNT} Tokens`}
        </Button>
      </div>

      <hr className="border-gray-200" />
      <TransferForm decimals={decimals} symbol={symbol} />

      <hr className="border-gray-200" />
      <ApproveForm owner={address} decimals={decimals} symbol={symbol} />
    </div>
  );
}

function TransferForm({ decimals, symbol }: { decimals: number; symbol?: string }) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const transfer = useTransaction(() =>
    writeContract(config, {
      ...testTokenConfig,
      functionName: "transfer",
      args: [recipient as Address, parseUnits(amount, decimals)],
    }),
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    transfer.mutate(undefined, {
      onSuccess: () => {
        setRecipient("");
        setAmount("");
      },
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h3 className="font-medium text-gray-700">Transfer Tokens</h3>
      <Field
        label="Recipient Address"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        placeholder="0x..."
        data-testid="token-transfer-recipient"
      />
      <Field
        label={`Amount (${symbol ?? ""})`}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.0"
        data-testid="token-transfer-amount"
      />
      <Button
        type="submit"
        disabled={transfer.isPending || !recipient || !amount}
        data-testid="token-transfer-submit"
      >
        {transfer.isPending ? "Transferring..." : "Transfer"}
      </Button>
      {transfer.isSuccess && (
        <Result ok testId="token-transfer-success">
          Transfer successful!
        </Result>
      )}
      {transfer.isError && (
        <Result ok={false} testId="token-transfer-error">
          Transfer failed
        </Result>
      )}
    </form>
  );
}

function ApproveForm({
  owner,
  decimals,
  symbol,
}: {
  owner: Address;
  decimals: number;
  symbol?: string;
}) {
  const [spender, setSpender] = useState("");
  const [amount, setAmount] = useState("");
  const validSpender = isAddress(spender, { strict: false }) ? spender : undefined;

  const { data: allowance } = useReadContract({
    ...testTokenConfig,
    functionName: "allowance",
    args: validSpender && [owner, validSpender],
    query: { enabled: !!validSpender },
  });

  const approve = useTransaction(() =>
    writeContract(config, {
      ...testTokenConfig,
      functionName: "approve",
      args: [spender as Address, parseUnits(amount, decimals)],
    }),
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    approve.mutate();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h3 className="font-medium text-gray-700">Approve Spender</h3>
      <Field
        label="Spender Address"
        value={spender}
        onChange={(e) => setSpender(e.target.value)}
        placeholder="0x..."
        data-testid="token-approve-spender"
      />
      <Field
        label={`Amount (${symbol ?? ""})`}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.0"
        data-testid="token-approve-amount"
      />
      {allowance !== undefined && (
        <p className="text-sm">
          <span className="text-gray-600">Current Allowance: </span>
          <span data-testid="token-allowance">{formatUnits(allowance, decimals)}</span>
          <span className="ml-1 text-gray-400">{symbol}</span>
        </p>
      )}
      <Button
        type="submit"
        variant="accent"
        disabled={approve.isPending || !spender || !amount}
        data-testid="token-approve-submit"
      >
        {approve.isPending ? "Approving..." : "Approve"}
      </Button>
      {approve.isSuccess && (
        <Result ok testId="token-approve-success">
          Approval successful!
        </Result>
      )}
      {approve.isError && (
        <Result ok={false} testId="token-approve-error">
          Approval failed
        </Result>
      )}
    </form>
  );
}
