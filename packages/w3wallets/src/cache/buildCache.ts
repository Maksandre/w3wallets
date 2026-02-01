import path from "path";
import fs from "fs";
import crypto from "crypto";
import { chromium } from "@playwright/test";
import { CACHE_DIR } from "./constants";
import { isCachedConfig } from "./types";
import type { CachedWalletConfig } from "./types";

const W3WALLETS_DIR = ".w3wallets";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface BuildOptions {
  force?: boolean;
  headed?: boolean;
}

export function hashFilePath(filePath: string): string {
  const hash = crypto.createHash("sha256").update(filePath).digest("hex");
  return hash.slice(0, 20);
}

/**
 * Build cache for a single setup file.
 *
 * @param compiledFilePath - Path to the compiled JS file to import
 * @param originalFilePath - Path to the original source file (used for hash)
 * @param options - Build options
 */
export async function buildCacheForSetup(
  compiledFilePath: string,
  originalFilePath: string,
  options: BuildOptions = {},
): Promise<void> {
  const hash = hashFilePath(path.resolve(originalFilePath));
  const cacheDir = path.join(process.cwd(), CACHE_DIR, hash);

  if (!options.force && fs.existsSync(cacheDir)) {
    console.log(`  Cache exists: ${cacheDir} (use --force to rebuild)`);
    return;
  }

  // Import the compiled setup file
  const compiled = require(path.resolve(compiledFilePath));
  const config: CachedWalletConfig = compiled.default ?? compiled;

  if (!isCachedConfig(config)) {
    throw new Error(
      `Setup file must export a CachedWalletConfig (use prepareWallet()): ${originalFilePath}`,
    );
  }

  // Resolve extension path
  const extPath = path.join(process.cwd(), W3WALLETS_DIR, config.extensionDir);
  if (!fs.existsSync(path.join(extPath, "manifest.json"))) {
    throw new Error(
      `Extension not found at ${extPath}. Run 'npx w3wallets ${config.name}' first.`,
    );
  }

  console.log(`  Building cache for "${config.name}"...`);

  // Clean and create cache dir
  if (fs.existsSync(cacheDir)) {
    fs.rmSync(cacheDir, { recursive: true });
  }

  const context = await chromium.launchPersistentContext(cacheDir, {
    headless: !options.headed,
    channel: "chromium",
    args: [
      `--disable-extensions-except=${extPath}`,
      `--load-extension=${extPath}`,
    ],
  });

  // Wait for service worker
  while (context.serviceWorkers().length < 1) {
    await sleep(1000);
  }

  // Derive extension ID
  const worker = context.serviceWorkers()[0]!;
  const extensionId = worker.url().split("/")[2]!;

  // Create wallet instance and run setup
  const page = await context.newPage();
  const wallet = new config.WalletClass(page, extensionId);
  await config.setupFn(wallet, page);

  // Force MV3 extensions to persist chrome.storage.session data to chrome.storage.local.
  // MV3 extensions like MetaMask use chrome.storage.session (memory-only) for vault data.
  // We copy it to chrome.storage.local so it survives browser restart from cache.
  // Use a helper HTML page injected into the extension to bypass LavaMoat's scuttling.
  try {
    const extDir = path.join(
      process.cwd(),
      W3WALLETS_DIR,
      config.extensionDir,
    );
    const helperJs = path.join(extDir, "_w3wallets_helper.js");
    const helperHtml = path.join(extDir, "_w3wallets_helper.html");
    fs.writeFileSync(
      helperJs,
      `chrome.storage.session.get(null, (sessionData) => {
        const keys = Object.keys(sessionData);
        if (keys.length === 0) {
          document.title = "done:0";
          return;
        }
        // Copy session data to local, and switch storageKind to "data"
        // so MetaMask reads everything from chrome.storage.local on restart.
        chrome.storage.local.set(sessionData, () => {
          chrome.storage.local.get("meta", (result) => {
            const meta = result.meta || {};
            // "single" means all data is in chrome.storage.local
            meta.storageKind = "data";
            chrome.storage.local.set({ meta }, () => {
              document.title = "done:" + keys.length;
            });
          });
        });
      });`,
    );
    fs.writeFileSync(
      helperHtml,
      `<!DOCTYPE html><html><head><script src="_w3wallets_helper.js"></script></head><body></body></html>`,
    );

    const helperPage = await context.newPage();
    await helperPage.goto(
      `chrome-extension://${extensionId}/_w3wallets_helper.html`,
    );
    await helperPage.waitForFunction(
      () => document.title.startsWith("done:"),
      null,
      { timeout: 10000 },
    );
    const title = await helperPage.title();
    const count = title.split(":")[1];
    console.log(
      `  Persisted ${count} session storage keys to local storage`,
    );
    await helperPage.close();

    // Clean up helper files
    fs.unlinkSync(helperJs);
    fs.unlinkSync(helperHtml);
  } catch (err) {
    console.log(`  Note: could not persist session storage: ${err}`);
  }

  await sleep(2000);
  await context.close();

  // Write metadata for cache discovery at test time
  fs.writeFileSync(
    path.join(cacheDir, ".meta.json"),
    JSON.stringify({ name: config.name }),
  );

  console.log(`  Cached: ${cacheDir}`);
}

/**
 * Find the cache directory for a wallet by scanning .meta.json files.
 */
export function findCacheDir(walletName: string): string | null {
  const cacheRoot = path.join(process.cwd(), CACHE_DIR);
  if (!fs.existsSync(cacheRoot)) return null;

  const entries = fs.readdirSync(cacheRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const metaPath = path.join(cacheRoot, entry.name, ".meta.json");
    if (!fs.existsSync(metaPath)) continue;
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      if (meta.name === walletName) {
        return path.join(cacheRoot, entry.name);
      }
    } catch {
      continue;
    }
  }
  return null;
}

export async function buildAllCaches(
  directory: string,
  options: BuildOptions = {},
): Promise<void> {
  const absoluteDir = path.resolve(directory);

  if (!fs.existsSync(absoluteDir)) {
    throw new Error(`Setup directory not found: ${absoluteDir}`);
  }

  // Find setup files
  const files = fs.readdirSync(absoluteDir).filter((f) => {
    return /\.cache\.(ts|js)$/.test(f);
  });

  if (files.length === 0) {
    console.log(`No *.cache.{ts,js} files found in ${absoluteDir}`);
    return;
  }

  console.log(`Found ${files.length} setup file(s) in ${absoluteDir}`);

  // Compile TS files with tsup
  const distDir = path.join(process.cwd(), CACHE_DIR, ".dist");
  const entryPoints = files.map((f) => path.join(absoluteDir, f));

  console.log("Compiling setup files...");
  const { build } = await import("tsup");
  await build({
    entry: entryPoints,
    outDir: distDir,
    format: ["cjs"],
    clean: true,
    silent: true,
  });

  // Run each setup
  let built = 0;
  let skipped = 0;

  for (const file of files) {
    const baseName = file.replace(/\.ts$/, ".js");
    const compiledPath = path.join(distDir, baseName);
    const originalPath = path.join(absoluteDir, file);

    console.log(`\n[${file}]`);

    if (!fs.existsSync(compiledPath)) {
      console.log(`  Compiled file not found: ${compiledPath}`);
      continue;
    }

    const hash = hashFilePath(path.resolve(originalPath));
    const cacheExists = fs.existsSync(
      path.join(process.cwd(), CACHE_DIR, hash),
    );

    if (!options.force && cacheExists) {
      console.log(`  Cache exists (use --force to rebuild)`);
      skipped++;
      continue;
    }

    await buildCacheForSetup(compiledPath, originalPath, {
      ...options,
      force: true,
    });
    built++;
  }

  console.log(`\nDone: ${built} built, ${skipped} skipped`);
}
