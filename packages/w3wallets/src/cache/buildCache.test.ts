import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import {
  hashFilePath,
  findCacheDir,
  writeCacheMeta,
  assertCacheMatchesExtension,
} from "./buildCache";

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

  it("throws when several caches match the same wallet name", () => {
    // A stale profile left by an old setup file must not be picked silently
    // over the fresh one — readdir order decides which one wins.
    setup();
    const cacheRoot = path.join(tmpDir, ".w3wallets", "cache");
    for (const dir of ["aaa", "bbb"]) {
      fs.mkdirSync(path.join(cacheRoot, dir), { recursive: true });
      fs.writeFileSync(
        path.join(cacheRoot, dir, ".meta.json"),
        JSON.stringify({ name: "metamask" }),
      );
    }

    expect(() => findCacheDir("metamask")).toThrow(
      /Multiple caches found for wallet "metamask"[\s\S]*aaa[\s\S]*bbb/,
    );
  });
});

describe("cache metadata", () => {
  let tmpDir: string;

  function setup() {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "w3wallets-meta-test-"));
    const extPath = path.join(tmpDir, "ext");
    const cacheDir = path.join(tmpDir, "cache");
    fs.mkdirSync(extPath);
    fs.mkdirSync(cacheDir);
    return { extPath, cacheDir };
  }

  function writeManifest(extPath: string, version: string) {
    fs.writeFileSync(
      path.join(extPath, "manifest.json"),
      JSON.stringify({ version }),
    );
  }

  function readMeta(cacheDir: string) {
    return JSON.parse(
      fs.readFileSync(path.join(cacheDir, ".meta.json"), "utf-8"),
    );
  }

  it("records the wallet name and extension version", () => {
    const { extPath, cacheDir } = setup();
    writeManifest(extPath, "13.49.0.0");

    writeCacheMeta(cacheDir, "metamask", extPath);

    expect(readMeta(cacheDir)).toEqual({
      name: "metamask",
      extensionVersion: "13.49.0.0",
    });
  });

  it("accepts a cache built with the installed extension version", () => {
    const { extPath, cacheDir } = setup();
    writeManifest(extPath, "13.49.0.0");
    writeCacheMeta(cacheDir, "metamask", extPath);

    expect(() => assertCacheMatchesExtension(cacheDir, extPath)).not.toThrow();
  });

  it("rejects a cache built with a different extension version", () => {
    const { extPath, cacheDir } = setup();
    writeManifest(extPath, "13.44.0");
    writeCacheMeta(cacheDir, "metamask", extPath);
    writeManifest(extPath, "13.49.0.0");

    expect(() => assertCacheMatchesExtension(cacheDir, extPath)).toThrow(
      /built with metamask 13\.44\.0.*installed extension is 13\.49\.0\.0[\s\S]*--force/,
    );
  });

  it("accepts a legacy cache without a recorded version", () => {
    const { extPath, cacheDir } = setup();
    writeManifest(extPath, "13.49.0.0");
    fs.writeFileSync(
      path.join(cacheDir, ".meta.json"),
      JSON.stringify({ name: "metamask" }),
    );

    expect(() => assertCacheMatchesExtension(cacheDir, extPath)).not.toThrow();
  });
});
