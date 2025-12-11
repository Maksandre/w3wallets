"use client";

import { useAccount, useSwitchChain } from "wagmi";

export function NetworkInfo() {
  const { chain, isConnected } = useAccount();
  const { chains, switchChain, isPending } = useSwitchChain();

  if (!isConnected) {
    return (
      <p className="text-gray-500" data-testid="network-not-connected">
        Connect wallet to see network info
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <span className="text-gray-600">Current Network: </span>
        <span className="font-medium" data-testid="network-name">
          {chain?.name || "Unknown"}
        </span>
        <span className="text-gray-400 ml-2" data-testid="chain-id">
          (ID: {chain?.id})
        </span>
      </div>

      <div>
        <span className="text-gray-600 block mb-2">Switch Network:</span>
        <div className="flex flex-wrap gap-2">
          {chains.map((c) => (
            <button
              key={c.id}
              onClick={() => switchChain({ chainId: c.id })}
              disabled={isPending || c.id === chain?.id}
              className={`px-3 py-1 rounded text-sm ${
                c.id === chain?.id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              } disabled:opacity-50`}
              data-testid={`network-switch-${c.id}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
