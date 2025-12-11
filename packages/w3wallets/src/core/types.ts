import type { Page } from "@playwright/test";

export type WalletName = "backpack" | "polkadotJS" | "metamask";

export type NoDuplicates<
  T extends readonly unknown[],
  Acc extends readonly unknown[] = [],
> = T extends [infer Head, ...infer Tail]
  ? Head extends Acc[number]
    ? never
    : [Head, ...NoDuplicates<Tail, [...Acc, Head]>]
  : T;

export interface IWallet {
  readonly page: Page;
  gotoOnboardPage(): Promise<void>;
  approve(): Promise<void>;
  deny(): Promise<void>;
}

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
