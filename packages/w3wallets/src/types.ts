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
  gotoOnboardPage(): Promise<void>;
}
