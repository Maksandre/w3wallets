import type { IWallet, WalletConfig } from "../core/types";
import type { CachedWalletConfig, SetupFn } from "./types";

export function prepareWallet<
  TName extends string,
  TWallet extends IWallet,
>(
  walletConfig: WalletConfig<TName, TWallet>,
  setupFn: SetupFn<TWallet>,
): CachedWalletConfig<TName, TWallet> {
  return {
    ...walletConfig,
    setupFn,
    __cached: true,
  };
}
