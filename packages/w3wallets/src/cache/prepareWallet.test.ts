import { describe, it, expect } from "vitest";
import { prepareWallet } from "./prepareWallet";
import { isCachedConfig } from "./types";

describe("prepareWallet", () => {
  const walletConfig = {
    name: "test" as const,
    extensionDir: "test-ext",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    WalletClass: class {
      constructor(
        public page: any,
        public extensionId: string,
      ) {}
      async gotoOnboardPage() {}
      async approve() {}
      async deny() {}
    },
    homeUrl: "home.html",
  };

  const setupFn = async () => {};

  it("sets __cached: true", () => {
    const result = prepareWallet(walletConfig, setupFn);
    expect(result.__cached).toBe(true);
  });

  it("attaches setupFn", () => {
    const result = prepareWallet(walletConfig, setupFn);
    expect(result.setupFn).toBe(setupFn);
  });

  it("preserves original config properties", () => {
    const result = prepareWallet(walletConfig, setupFn);
    expect(result.name).toBe("test");
    expect(result.extensionDir).toBe("test-ext");
    expect(result.WalletClass).toBe(walletConfig.WalletClass);
    expect(result.homeUrl).toBe("home.html");
  });

  it("passes isCachedConfig guard", () => {
    const result = prepareWallet(walletConfig, setupFn);
    expect(isCachedConfig(result)).toBe(true);
  });
});
