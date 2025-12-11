import type { Page } from "@playwright/test";
import type { IWallet } from "./types";

export abstract class Wallet implements IWallet {
  constructor(
    public readonly page: Page,
    protected readonly extensionId: string,
  ) {}

  abstract gotoOnboardPage(): Promise<void>;
  abstract approve(): Promise<void>;
  abstract deny(): Promise<void>;
}
