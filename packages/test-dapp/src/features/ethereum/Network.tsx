import { useChains, useConnection, useSwitchChain } from "wagmi";
import { Button, Muted } from "@/components/ui";

export function Network() {
  const { chain, chainId, isConnected } = useConnection();
  const chains = useChains();
  const switchChain = useSwitchChain();

  if (!isConnected) {
    return (
      <Muted testId="network-not-connected">Connect wallet to see network info</Muted>
    );
  }

  return (
    <div className="space-y-4">
      <p>
        <span className="text-gray-600">Current Network: </span>
        <span className="font-medium" data-testid="network-name">
          {chain?.name ?? "Unknown"}
        </span>
        <span className="ml-2 text-gray-400" data-testid="chain-id">
          (ID: {chainId})
        </span>
      </p>
      <div>
        <span className="mb-2 block text-gray-600">Switch Network:</span>
        <div className="flex flex-wrap gap-2">
          {chains.map((c) => (
            <Button
              key={c.id}
              variant={c.id === chainId ? "primary" : "neutral"}
              className="px-3 py-1 text-sm"
              disabled={switchChain.isPending || c.id === chainId}
              onClick={() => switchChain.mutate({ chainId: c.id })}
              data-testid={`network-switch-${c.id}`}
            >
              {c.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
