import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Hash } from "viem";
import { waitForTransactionReceipt } from "wagmi/actions";
import { config } from "@/wagmi";

/**
 * Send a transaction and wait until it is mined. The mutation succeeds only
 * for a successful receipt, then refetches every on-chain read.
 */
export function useTransaction<TVariables>(
  send: (variables: TVariables) => Promise<Hash>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const hash = await send(variables);
      const receipt = await waitForTransactionReceipt(config, { hash });
      if (receipt.status === "reverted") {
        throw new Error(`Transaction ${hash} reverted`);
      }
      return receipt;
    },
    onSettled: () => queryClient.invalidateQueries(),
  });
}
