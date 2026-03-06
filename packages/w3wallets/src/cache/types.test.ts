import { describe, it, expect } from "vitest";
import { isCachedConfig } from "./types";

describe("isCachedConfig", () => {
  const base = {
    name: "test",
    extensionDir: "test-ext",
    WalletClass: class {} as never,
  };

  it("returns true for { __cached: true }", () => {
    expect(isCachedConfig({ ...base, __cached: true } as never)).toBe(true);
  });

  it("returns false without __cached", () => {
    expect(isCachedConfig(base as never)).toBe(false);
  });

  it("returns false with __cached: false", () => {
    expect(isCachedConfig({ ...base, __cached: false } as never)).toBe(false);
  });

  it("returns false with truthy-but-not-true value", () => {
    expect(isCachedConfig({ ...base, __cached: 1 } as never)).toBe(false);
  });

  it("returns false for empty object", () => {
    expect(isCachedConfig({} as never)).toBe(false);
  });
});
