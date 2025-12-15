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

const W3WALLETS_DIR = ".w3wallets";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extends Playwright test with wallet fixtures.
 *
 * @example
 * ```ts
 * import { withWallets, metamask, backpack } from "w3wallets";
 *
 * const test = withWallets(base, metamask, backpack);
 *
 * test("can connect", async ({ metamask, backpack }) => {
 *   await metamask.onboard(mnemonic);
 * });
 * ```
 */
export function withWallets<const T extends readonly WalletConfig[]>(
  test: typeof base,
  ...wallets: T
) {
  // Validate and build extension paths
  const extensionPaths = wallets.map((w) => {
    const extPath = path.join(process.cwd(), W3WALLETS_DIR, w.extensionDir);
    ensureWalletExtensionExists(extPath, w.name);
    return extPath;
  });

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

      const context = await chromium.launchPersistentContext(userDataDir, {
        headless: testInfo.project.use.headless ?? true,
        channel: "chromium",
        args: [
          `--disable-extensions-except=${extensionPaths.join(",")}`,
          `--load-extension=${extensionPaths.join(",")}`,
        ],
      });

      // Wait for all service workers to initialize
      while (context.serviceWorkers().length < extensionPaths.length) {
        await sleep(1000);
      }

      await use(context);
      await context.close();
    },
  };

  // Add a fixture for each wallet
  for (const wallet of wallets) {
    fixtures[wallet.name] = async (
      { context }: { context: BrowserContext },
      use: (instance: IWallet) => Promise<void>,
    ) => {
      const instance = await initializeExtension(
        context,
        wallet.WalletClass,
        `${wallet.name} is not initialized`,
      );
      await use(instance);
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
 * Initializes an extension by finding its service worker and navigating to onboard page.
 */
async function initializeExtension<T extends IWallet>(
  context: BrowserContext,
  ExtensionClass: new (page: Page, extensionId: string) => T,
  notInitializedErrorMessage: string,
): Promise<T> {
  const serviceWorkers = context.serviceWorkers();
  let page = await context.newPage();

  for (const worker of serviceWorkers) {
    const extensionId = worker.url().split("/")[2];
    if (!extensionId) {
      continue;
    }

    const extension = new ExtensionClass(page, extensionId);

    try {
      await extension.gotoOnboardPage();
      return extension;
    } catch {
      await page.close();
      page = await context.newPage();
    }
  }

  throw new Error(notInitializedErrorMessage);
}
