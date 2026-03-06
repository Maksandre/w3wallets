import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { hashFilePath, findCacheDir } from "./buildCache";

describe("hashFilePath", () => {
  it("returns first 20 hex chars of SHA256", () => {
    const result = hashFilePath("/some/path/file.ts");
    expect(result).toMatch(/^[0-9a-f]{20}$/);
  });

  it("is deterministic", () => {
    const a = hashFilePath("/test/path");
    const b = hashFilePath("/test/path");
    expect(a).toBe(b);
  });

  it("different inputs → different outputs", () => {
    const a = hashFilePath("/path/a");
    const b = hashFilePath("/path/b");
    expect(a).not.toBe(b);
  });
});

describe("findCacheDir", () => {
  let tmpDir: string;
  let originalCwd: string;

  function setup() {
    tmpDir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), "w3wallets-cache-test-")),
    );
    originalCwd = process.cwd();
    process.chdir(tmpDir);
  }

  afterEach(() => {
    process.chdir(originalCwd);
  });

  it("returns null when cache root missing", () => {
    setup();
    expect(findCacheDir("metamask")).toBeNull();
  });

  it("finds correct dir by wallet name", () => {
    setup();
    const cacheRoot = path.join(tmpDir, ".w3wallets", "cache");
    const subDir = path.join(cacheRoot, "abc123");
    fs.mkdirSync(subDir, { recursive: true });
    fs.writeFileSync(
      path.join(subDir, ".meta.json"),
      JSON.stringify({ name: "metamask" }),
    );

    const result = findCacheDir("metamask");
    expect(result).toBe(subDir);
  });

  it("returns null on name mismatch", () => {
    setup();
    const cacheRoot = path.join(tmpDir, ".w3wallets", "cache");
    const subDir = path.join(cacheRoot, "abc123");
    fs.mkdirSync(subDir, { recursive: true });
    fs.writeFileSync(
      path.join(subDir, ".meta.json"),
      JSON.stringify({ name: "metamask" }),
    );

    expect(findCacheDir("polkadotjs")).toBeNull();
  });

  it("skips dot-dirs", () => {
    setup();
    const cacheRoot = path.join(tmpDir, ".w3wallets", "cache");
    const dotDir = path.join(cacheRoot, ".hidden");
    fs.mkdirSync(dotDir, { recursive: true });
    fs.writeFileSync(
      path.join(dotDir, ".meta.json"),
      JSON.stringify({ name: "metamask" }),
    );

    expect(findCacheDir("metamask")).toBeNull();
  });

  it("skips non-directories", () => {
    setup();
    const cacheRoot = path.join(tmpDir, ".w3wallets", "cache");
    fs.mkdirSync(cacheRoot, { recursive: true });
    // Create a file (not a directory) in cache root
    fs.writeFileSync(path.join(cacheRoot, "notadir"), "data");

    expect(findCacheDir("metamask")).toBeNull();
  });

  it("handles malformed .meta.json gracefully", () => {
    setup();
    const cacheRoot = path.join(tmpDir, ".w3wallets", "cache");
    const subDir = path.join(cacheRoot, "abc123");
    fs.mkdirSync(subDir, { recursive: true });
    fs.writeFileSync(path.join(subDir, ".meta.json"), "not valid json{{{");

    expect(findCacheDir("metamask")).toBeNull();
  });

  it("scans multiple subdirectories", () => {
    setup();
    const cacheRoot = path.join(tmpDir, ".w3wallets", "cache");

    const dir1 = path.join(cacheRoot, "aaa");
    fs.mkdirSync(dir1, { recursive: true });
    fs.writeFileSync(
      path.join(dir1, ".meta.json"),
      JSON.stringify({ name: "metamask" }),
    );

    const dir2 = path.join(cacheRoot, "bbb");
    fs.mkdirSync(dir2, { recursive: true });
    fs.writeFileSync(
      path.join(dir2, ".meta.json"),
      JSON.stringify({ name: "polkadotjs" }),
    );

    expect(findCacheDir("polkadotjs")).toBe(dir2);
  });
});
