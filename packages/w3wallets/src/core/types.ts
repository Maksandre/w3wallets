import type { Page } from "@playwright/test";

export interface IWallet {
  readonly page: Page;
  gotoOnboardPage(): Promise<void>;
  approve(): Promise<void>;
  deny(): Promise<void>;
}

/**
 * Configuration object for a wallet.
 */
export interface WalletConfig<
  TName extends string = string,
  TWallet extends IWallet = IWallet,
> {
  /** Unique wallet identifier, used as fixture name */
  name: TName;
  /** Directory name under .w3wallets/ where extension is stored */
  extensionDir: string;
  /** Wallet class constructor */
  WalletClass: new (page: Page, extensionId: string) => TWallet;
}

/**
 * Creates a wallet configuration object.
 *
 * @example
 * ```ts
 * const myWallet = createWallet({
 *   name: "myWallet",
 *   extensionDir: "my-wallet",
 *   WalletClass: MyWalletClass,
 * });
 * ```
 */
export function createWallet<TName extends string, TWallet extends IWallet>(
  config: WalletConfig<TName, TWallet>,
): WalletConfig<TName, TWallet> {
  return config;
}

/**
 * Extracts fixture name from a wallet config.
 */
export type WalletConfigName<T> =
  T extends WalletConfig<infer N, IWallet> ? N : never;

/**
 * Extracts wallet class instance type from a wallet config.
 */
export type WalletConfigInstance<T> =
  T extends WalletConfig<string, infer W> ? W : never;

/**
 * Builds fixture types from an array of wallet configs.
 */
export type WalletFixturesFromConfigs<T extends readonly WalletConfig[]> = {
  [K in T[number] as WalletConfigName<K>]: WalletConfigInstance<K>;
};

/**
 * Supported blockchain networks.
 * Common networks are listed for autocomplete, but any string is accepted.
 */
export type Network =
  | "Solana"
  | "Eclipse"
  | "Ethereum"
  | "Polygon"
  | "Base"
  | "Arbitrum"
  | "Optimism"
  | (string & {});
