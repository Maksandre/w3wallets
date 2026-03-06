import { describe, it, expect, vi } from "vitest";
import { config } from "./config";

describe("config.actionTimeout", () => {
  it("returns undefined when env var unset", () => {
    vi.stubEnv("W3WALLETS_ACTION_TIMEOUT", "");
    expect(config.actionTimeout).toBeUndefined();
  });

  it("parses integer from env var string", () => {
    vi.stubEnv("W3WALLETS_ACTION_TIMEOUT", "5000");
    expect(config.actionTimeout).toBe(5000);
  });

  it("returns NaN for non-numeric values", () => {
    vi.stubEnv("W3WALLETS_ACTION_TIMEOUT", "abc");
    expect(config.actionTimeout).toBeNaN();
  });
});

describe("config.expectTimeout", () => {
  it("returns undefined when env var unset", () => {
    vi.stubEnv("W3WALLETS_EXPECT_TIMEOUT", "");
    expect(config.expectTimeout).toBeUndefined();
  });

  it("parses integer from env var string", () => {
    vi.stubEnv("W3WALLETS_EXPECT_TIMEOUT", "10000");
    expect(config.expectTimeout).toBe(10000);
  });

  it("returns NaN for non-numeric values", () => {
    vi.stubEnv("W3WALLETS_EXPECT_TIMEOUT", "xyz");
    expect(config.expectTimeout).toBeNaN();
  });
});
