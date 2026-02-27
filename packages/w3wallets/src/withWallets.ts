import path from "path";
import fs from "fs";
import {
  test as base,
  type BrowserContext,
  chromium,
  type Page,
} from "@playwright/test";
import type {
  IWallet,
  WalletConfig,
  WalletFixturesFromConfigs,
} from "./core/types";
import { isCachedConfig } from "./cache/types";
import { findCacheDir } from "./cache/buildCache";
import { CACHE_DIR } from "./cache/constants";
import { sleep, getExtensionId } from "./core/utils";

// TODO: with new CLI this directory can be overwritten with -o argument
const W3WALLETS_DIR = ".w3wallets";

/**
 * Extends Playwright test with wallet fixtures.
 *
 * @example
 * ```ts
 * import { withWallets, metamask, polkadotJS } from "w3wallets";
 *
 * const test = withWallets(base, metamask, polkadotJS);
 *
 * test("can connect", async ({ metamask, polkadotJS }) => {
 *   await metamask.onboard(mnemonic);
 * });
 * ```
 */
export function withWallets<const T extends readonly WalletConfig[]>(
  test: typeof base,
  ...wallets: T
) {
  // Check for mixed cached/non-cached wallets
  const cachedCount = wallets.filter((w) => isCachedConfig(w)).length;
  if (cachedCount > 0 && cachedCount < wallets.length) {
    throw new Error(
      "Mixing cached and non-cached wallet configs is not supported. " +
        "All wallets must be either cached (via prepareWallet) or non-cached.",
    );
  }

  const useCachedContext = cachedCount > 0;

  // Validate and build extension paths + IDs
  const extensionInfo = wallets.map((w) => {
    const extPath = path.join(process.cwd(), W3WALLETS_DIR, w.extensionDir);
    ensureWalletExtensionExists(extPath, w.name);

    // Use explicit extensionId from config, or compute from path/manifest
    const extensionId = w.extensionId ?? getExtensionId(extPath);

    return { path: extPath, id: extensionId, name: w.name };
  });

  const extensionPaths = extensionInfo.map((e) => e.path);

  type Fixtures = WalletFixturesFromConfigs<T> & { context: BrowserContext };

  const fixtures: Record<string, unknown> = {
    context: async (
      {}: Record<string, never>,
      use: (ctx: BrowserContext) => Promise<void>,
      testInfo: { testId: string; project: { use: { headless?: boolean } } },
    ) => {
      const userDataDir = path.join(
        process.cwd(),
        W3WALLETS_DIR,
        ".context",
        testInfo.testId,
      );

      cleanUserDataDir(userDataDir);

      if (useCachedContext) {
        // For cached configs, copy the cache directory as the user data dir
        // Currently only single-wallet cached configs are supported
        const wallet = wallets[0]!;
        const cacheDir = findCacheDir(wallet.name);
        if (!cacheDir) {
          throw new Error(
            `Cache not found for wallet "${wallet.name}". ` +
              `Searched in: ${path.join(process.cwd(), CACHE_DIR)}\n` +
              `Run 'npx w3wallets cache' to build the cache first.`,
          );
        }
        fs.cpSync(cacheDir, userDataDir, { recursive: true });
      }

      const context = await chromium.launchPersistentContext(userDataDir, {
        headless: testInfo.project.use.headless ?? true,
        channel: "chromium",
        args: [
          `--disable-extensions-except=${extensionPaths.join(",")}`,
          `--load-extension=${extensionPaths.join(",")}`,
        ],
      });

      // Wait for all extension service workers to initialize.
      // Use event-based waiting with a polling fallback.
      while (context.serviceWorkers().length < extensionPaths.length) {
        await Promise.race([
          context.waitForEvent("serviceworker", { timeout: 30000 }),
          sleep(500),
        ]);
      }

      await use(context);
      await context.close();
    },
  };

  // Add a fixture for each wallet
  for (let i = 0; i < wallets.length; i++) {
    const wallet = wallets[i]!;
    const info = extensionInfo[i]!;

    fixtures[wallet.name] = async (
      { context }: { context: BrowserContext },
      use: (instance: IWallet) => Promise<void>,
    ) => {
      if (isCachedConfig(wallet)) {
        // Cached wallet: find existing extension page instead of creating new one
        const instance = await findCachedExtension(
          context,
          wallet.WalletClass,
          info.id,
          wallet.name,
          wallet.homeUrl,
        );
        await use(instance);
      } else {
        const instance = await initializeExtension(
          context,
          wallet.WalletClass,
          info.id,
          wallet.name,
        );
        await use(instance);
      }
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return test.extend<Fixtures>(fixtures as any);
}

/**
 * Deletes the specified directory if it exists.
 */
function cleanUserDataDir(userDataDir: string): void {
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true });
  }
}

/**
 * Verifies that a wallet manifest file exists in the given path.
 */
function ensureWalletExtensionExists(
  walletPath: string,
  walletName: string,
): void {
  if (!fs.existsSync(path.join(walletPath, "manifest.json"))) {
    const cliAlias = walletName.toLowerCase();
    throw new Error(
      `Cannot find ${walletName}. Please download it via 'npx w3wallets ${cliAlias}'.`,
    );
  }
}

/**
 * Finds an existing extension page for a cached wallet.
 * Since the browser profile is restored from cache, the extension is already set up.
 */
async function findCachedExtension<T extends IWallet>(
  context: BrowserContext,
  ExtensionClass: new (page: Page, extensionId: string) => T,
  expectedExtensionId: string,
  walletName: string,
  homeUrl?: string,
): Promise<T> {
  const expectedUrl = `chrome-extension://${expectedExtensionId}/`;
  const worker = context
    .serviceWorkers()
    .find((w) => w.url().startsWith(expectedUrl));

  if (!worker) {
    const availableIds = context
      .serviceWorkers()
      .map((w) => w.url().split("/")[2])
      .filter(Boolean);

    throw new Error(
      `Service worker for ${walletName} (ID: ${expectedExtensionId}) not found in cached context. ` +
        `Available extension IDs: [${availableIds.join(", ")}]. ` +
        `Try rebuilding the cache with 'npx w3wallets cache --force'.`,
    );
  }

  const page = await context.newPage();
  if (homeUrl) {
    await page.goto(
      `chrome-extension://${expectedExtensionId}/${homeUrl}`,
    );
  }
  const extension = new ExtensionClass(page, expectedExtensionId);

  return extension;
}

/**
 * Initializes an extension by finding its service worker and navigating to onboard page.
 */
async function initializeExtension<T extends IWallet>(
  context: BrowserContext,
  ExtensionClass: new (page: Page, extensionId: string) => T,
  expectedExtensionId: string,
  walletName: string,
): Promise<T> {
  const expectedUrl = `chrome-extension://${expectedExtensionId}/`;
  const worker = context
    .serviceWorkers()
    .find((w) => w.url().startsWith(expectedUrl));

  if (!worker) {
    const availableIds = context
      .serviceWorkers()
      .map((w) => w.url().split("/")[2])
      .filter(Boolean);

    throw new Error(
      `Service worker for ${walletName} (ID: ${expectedExtensionId}) not found. ` +
        `Available extension IDs: [${availableIds.join(", ")}]`,
    );
  }

  const page = await context.newPage();
  const extension = new ExtensionClass(page, expectedExtensionId);

  return extension;
}
