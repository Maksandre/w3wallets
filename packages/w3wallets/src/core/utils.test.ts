import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { getExtensionId, sleep } from "./utils";

function makeTempExtension(manifest: Record<string, unknown>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "w3wallets-test-"));
  fs.writeFileSync(
    path.join(dir, "manifest.json"),
    JSON.stringify(manifest),
  );
  return dir;
}

describe("getExtensionId", () => {
  it("derives ID from manifest key when present", () => {
    // Real MetaMask key (truncated for test, but valid base64)
    const key = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA";
    const dir = makeTempExtension({ key, manifest_version: 3 });
    const id = getExtensionId(dir);
    expect(id).toMatch(/^[a-p]{32}$/);
  });

  it("derives ID from absolute path when no key field", () => {
    const dir = makeTempExtension({ manifest_version: 3 });
    const id = getExtensionId(dir);
    expect(id).toMatch(/^[a-p]{32}$/);
  });

  it("always returns 32-char string matching /^[a-p]{32}$/", () => {
    const dir = makeTempExtension({ manifest_version: 3 });
    const id = getExtensionId(dir);
    expect(id).toHaveLength(32);
    expect(id).toMatch(/^[a-p]{32}$/);
  });

  it("is deterministic (same input → same output)", () => {
    const dir = makeTempExtension({ manifest_version: 3, key: "dGVzdA==" });
    const id1 = getExtensionId(dir);
    const id2 = getExtensionId(dir);
    expect(id1).toBe(id2);
  });

  it("different paths → different IDs", () => {
    const dir1 = makeTempExtension({ manifest_version: 3 });
    const dir2 = makeTempExtension({ manifest_version: 3 });
    const id1 = getExtensionId(dir1);
    const id2 = getExtensionId(dir2);
    expect(id1).not.toBe(id2);
  });

  it("prefers key over path when key present", () => {
    const key = "dGVzdA==";
    const dir1 = makeTempExtension({ manifest_version: 3, key });
    const dir2 = makeTempExtension({ manifest_version: 3, key });
    // Same key in different dirs → same ID
    expect(getExtensionId(dir1)).toBe(getExtensionId(dir2));
  });

  it("throws when manifest.json missing", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "w3wallets-test-"));
    expect(() => getExtensionId(dir)).toThrow();
  });

  it("throws when manifest.json is invalid JSON", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "w3wallets-test-"));
    fs.writeFileSync(path.join(dir, "manifest.json"), "not json{{{");
    expect(() => getExtensionId(dir)).toThrow();
  });
});

describe("sleep", () => {
  it("resolves after approximately the correct time", async () => {
    const start = Date.now();
    await sleep(50);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(40);
    expect(elapsed).toBeLessThan(200);
  });
});
