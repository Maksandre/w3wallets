import path from "path";
import fs from "fs";
import crypto from "crypto";
import { chromium, type Page } from "@playwright/test";
import { CACHE_DIR } from "./constants";
import { isCachedConfig } from "./types";
import type { CachedWalletConfig } from "./types";
import { sleep, getExtensionId } from "../core/utils";

const W3WALLETS_DIR = ".w3wallets";

/**
 * Poll chrome.storage.local via a helper page until the key count stops changing.
 * Waits for at least 1 key to appear, then requires the count to remain the same
 * for {@link STABLE_CHECKS_REQUIRED} consecutive polls before returning.
 */
async function waitForStorageStable(
  helperPage: Page,
  helperUrl: string,
): Promise<number | null> {
  const TIMEOUT = 60000;
  const POLL_INTERVAL = 5000;
  const STABLE_CHECKS_REQUIRED = 2;
  const start = Date.now();
  let lastKeyCount = -1;
  let stableCount = 0;

  while (Date.now() - start < TIMEOUT) {
    await sleep(POLL_INTERVAL);

    await helperPage.goto(helperUrl);
    await helperPage.waitForFunction(
      () => document.title.startsWith("done:"),
      null,
      { timeout: 10000 },
    );

    const title = await helperPage.title();
    const keyCount = parseInt(title.split(":")[1]!, 10);

    // Skip until extension has written at least one key
    if (keyCount === 0) continue;

    if (keyCount === lastKeyCount) {
      stableCount++;
    } else {
      stableCount = 1;
      lastKeyCount = keyCount;
    }

    if (stableCount >= STABLE_CHECKS_REQUIRED) {
      console.log(`  Storage stabilized at ${keyCount} keys`);
      return keyCount;
    }

    console.log(
      `  Waiting for storage to stabilize: ${keyCount} keys (${stableCount}/${STABLE_CHECKS_REQUIRED})`,
    );
  }

  console.log(`  Storage stabilization timed out after ${TIMEOUT / 1000}s`);
  return null;
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

  // Derive extension ID from manifest key or path (same algorithm Chrome uses).
  const extensionId = getExtensionId(extPath);

  // Wait for the extension service worker to register (MV3).
  if (context.serviceWorkers().length < 1) {
    await Promise.race([
      context.waitForEvent("serviceworker", { timeout: 30000 }),
      (async () => {
        while (context.serviceWorkers().length < 1) {
          await sleep(500);
        }
      })(),
    ]);
  }

  // Create wallet instance and run setup.
  // The setupFn (via wallet.onboard) handles navigation and waiting for the UI.
  const page = await context.newPage();
  const wallet = new config.WalletClass(page, extensionId);
  await config.setupFn(wallet, page);

  // Wait for the extension to persist its state to chrome.storage.local.
  // MV3 extensions write to storage asynchronously after onboarding.
  // We inject a tiny helper page into the extension to read the key count,
  // then poll until it stabilizes (no new keys for 2 consecutive checks).
  try {
    const extDir = path.join(process.cwd(), W3WALLETS_DIR, config.extensionDir);
    const helperJs = path.join(extDir, "_w3wallets_helper.js");
    const helperHtml = path.join(extDir, "_w3wallets_helper.html");
    fs.writeFileSync(
      helperJs,
      `chrome.storage.local.get(null, (data) => {
        document.title = "done:" + Object.keys(data).length;
      });`,
    );
    fs.writeFileSync(
      helperHtml,
      `<!DOCTYPE html><html><head><script src="_w3wallets_helper.js"></script></head><body></body></html>`,
    );

    const helperPage = await context.newPage();
    const helperUrl = `chrome-extension://${extensionId}/_w3wallets_helper.html`;

    await waitForStorageStable(helperPage, helperUrl);

    await helperPage.close();
    fs.unlinkSync(helperJs);
    fs.unlinkSync(helperHtml);
  } catch (err) {
    console.log(`  Note: could not verify persistence: ${err}`);
  }

  // Allow Chrome to flush extension storage (LevelDB) to disk.
  // The persist check above verifies data is in chrome.storage.local (memory),
  // but the actual disk flush happens asynchronously by the browser.
  await sleep(5000);
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
