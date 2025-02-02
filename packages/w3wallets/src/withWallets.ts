import path from "path";
import fs from "fs";
import { sleep } from "../tests/utils/sleep";
import {
  test as base,
  type BrowserContext,
  chromium,
  type Page,
} from "@playwright/test";
import { Backpack } from "./backpack";
import { PolkadotJS } from "./polkadotJS";
import type { IWallet, NoDuplicates, WalletName } from "./types";

const w3walletsDir = ".w3wallets";

export function withWallets<T extends readonly WalletName[]>(
  test: typeof base,
  ...config: NoDuplicates<T>
) {
  const withBackpack = config.includes("backpack");
  const withPolkadotJS = config.includes("polkadotJS");

  // Define wallet paths
  const backpackPath = path.join(process.cwd(), w3walletsDir, "backpack");
  const polkadotJSPath = path.join(process.cwd(), w3walletsDir, "polkadotJS");

  return test.extend<{
    context: BrowserContext;
    backpack: Backpack;
    polkadotJS: PolkadotJS;
  }>({
    /**
     * Sets up a persistent browser context with the requested extensions loaded.
     */
    context: async ({}, use, testInfo) => {
      const userDataDir = path.join(
        process.cwd(),
        ".w3wallets",
        ".context",
        testInfo.testId,
      );

      cleanUserDataDir(userDataDir);

      const extensionPaths: string[] = [];

      if (withBackpack) {
        ensureWalletExtensionExists(backpackPath, "backpack");
        extensionPaths.push(backpackPath);
      }

      if (withPolkadotJS) {
        ensureWalletExtensionExists(polkadotJSPath, "polkadotJS");
        extensionPaths.push(polkadotJSPath);
      }

      console.log("launching context");

      const context = await chromium.launchPersistentContext(userDataDir, {
        // TODO: return parametrization
        headless: true,
        // headless: testInfo.project.use.headless ?? true,
        channel: "chromium",
        args: [
          `--disable-extensions-except=${extensionPaths.join(",")}`,
          `--load-extension=${extensionPaths.join(",")}`,
        ],
      });

      console.log("launched");

      // Wait until service workers appear for the loaded extensions
      await context.waitForEvent("serviceworker");

      // Depending on how quickly the extension service workers load, we poll.
      while (context.serviceWorkers().length < extensionPaths.length) {
        await sleep(1000);
        console.log("Awaiting service workers");
      }

      await use(context);
      await context.close();
    },

    backpack: async ({ context }, use) => {
      if (!withBackpack) {
        throw Error(
          "The Backpack wallet hasn't been loaded. Add it to the withWallets function.",
        );
      }

      const backpack = await initializeExtension(
        context,
        Backpack,
        "Backpack is not initialized",
      );
      await use(backpack);
    },

    polkadotJS: async ({ context }, use) => {
      if (!withPolkadotJS) {
        throw Error(
          "The Polkadot{.js} wallet hasn't been loaded. Add it to the withWallets function.",
        );
      }

      const polkadotJS = await initializeExtension(
        context,
        PolkadotJS,
        "Polkadot{.js} is not initialized",
      );
      await use(polkadotJS);
    },
  });
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
 * Throws an error if the file is missing.
 */
function ensureWalletExtensionExists(
  walletPath: string,
  walletName: WalletName,
): void {
  if (!fs.existsSync(path.join(walletPath, "manifest.json"))) {
    throw new Error(
      `Cannot find ${walletName}. Please download it via 'npx w3wallets ${walletName}'.`,
    );
  }
}

/**
 * Initializes an extension by attempting to navigate to its onboard page.
 * If initialization fails for one service worker, it tries the next.
 */
async function initializeExtension<T extends IWallet>(
  context: BrowserContext,
  ExtensionClass: new (page: Page, extensionId: string) => T,
  notInitializedErrorMessage: string,
): Promise<T> {
  const serviceWorkers = context.serviceWorkers();

  // We keep reusing a "fresh" page each time a navigation fails.
  let page = await context.newPage();

  for (const worker of serviceWorkers) {
    const extensionId = worker.url().split("/")[2];
    // If we cannot parse the extension ID, skip or throw as needed.
    if (!extensionId) {
      continue;
    }

    const extension = new ExtensionClass(page, extensionId);

    try {
      await extension.gotoOnboardPage();
      return extension;
    } catch {
      // If navigating fails, close the page and try the next service worker.
      await page.close();
      page = await context.newPage();
    }
  }

  throw new Error(notInitializedErrorMessage);
}
