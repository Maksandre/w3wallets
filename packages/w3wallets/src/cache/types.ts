import type { Page } from "@playwright/test";
import type { IWallet, WalletConfig } from "../core/types";

export type SetupFn<TWallet extends IWallet> = (
  wallet: TWallet,
  page: Page,
) => Promise<void>;

export interface CachedWalletConfig<
  TName extends string = string,
  TWallet extends IWallet = IWallet,
> extends WalletConfig<TName, TWallet> {
  setupFn: SetupFn<TWallet>;
  __cached: true;
}

export function isCachedConfig(
  config: WalletConfig,
): config is CachedWalletConfig {
  return "__cached" in config && config.__cached === true;
}
