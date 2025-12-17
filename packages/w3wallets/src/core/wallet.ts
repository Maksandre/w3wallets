import type { Page } from "@playwright/test";
import type { IWallet } from "./types";
import { config } from "../config";

export abstract class Wallet implements IWallet {
  constructor(
    public readonly page: Page,
    protected readonly extensionId: string,
  ) {
    if (config.actionTimeout) {
      page.setDefaultTimeout(config.actionTimeout);
    }
  }

  abstract gotoOnboardPage(): Promise<void>;
  abstract approve(): Promise<void>;
  abstract deny(): Promise<void>;
}
