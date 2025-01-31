import type { Page } from "@playwright/test";
import type { IWallet } from "./types";

export abstract class Wallet implements IWallet {
  constructor(
    protected page: Page,
    protected extensionId: string,
  ) {}

  abstract gotoOnboardPage(): Promise<void>;
}
