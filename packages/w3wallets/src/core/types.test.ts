import { describe, it, expect } from "vitest";
import { createWallet } from "./types";

describe("createWallet", () => {
  it("returns exact same object (referential equality)", () => {
    const config = {
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
    };
    expect(createWallet(config)).toBe(config);
  });

  it("preserves all properties including optional ones", () => {
    const config = {
      name: "myWallet" as const,
      extensionDir: "my-ext",
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
      extensionId: "custom-id",
      homeUrl: "popup.html",
    };
    const result = createWallet(config);
    expect(result.name).toBe("myWallet");
    expect(result.extensionDir).toBe("my-ext");
    expect(result.extensionId).toBe("custom-id");
    expect(result.homeUrl).toBe("popup.html");
  });
});
