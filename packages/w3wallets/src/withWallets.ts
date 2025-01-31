import { sleep } from './../tests/utils/sleep';
import path from "path";
import fs from "fs";
import { test as base, type BrowserContext } from "@playwright/test";
import { chromium } from "@playwright/test";
import { Backpack } from "./backpack";
import { PolkadotJS } from "./polkadotJS"; // Example if you have a similar class
import type { NoDuplicates, WalletName } from "./types";

export function withWallets<T extends readonly WalletName[]>(test: typeof base, ...config: NoDuplicates<T>) {
  const backpackPath = path.join(process.cwd(), "wallets", "backpack");
  const polkadotJSPath = path.join(process.cwd(), "wallets", "polkadotJS");

  const withBackpack = config.find(w => w === 'backpack') ? true : false;
  const withPolkadotJS = config.find(w => w === 'polkadotJS') ? true : false;

  return test.extend<{
    context: BrowserContext;
    backpack?: Backpack;
    polkadotJS?: PolkadotJS;
  }>({
    context: async ({}, use, testInfo) => {
      const userDataDir = path.join(
        process.cwd(),
        ".w3wallets",
        testInfo.testId,
      );
      if (fs.existsSync(userDataDir)) {
        fs.rmSync(userDataDir, { recursive: true });
      }

      const extensionPaths: string[] = [];

      // Add Backpack
      if (withBackpack) {
        if (!fs.existsSync(path.join(backpackPath, "manifest.json"))) {
          throw Error(
            "Cannot find Backpack. Please download it via npx w3wallets",
          );
        }
        extensionPaths.push(backpackPath);
      }

      // Add Polkadot{.js}
      if (withPolkadotJS) {
        if (!fs.existsSync(path.join(polkadotJSPath, "manifest.json"))) {
          throw Error(
            "Cannot find Polkadot{.js} wallet. Please download it via npx w3wallets polkadotJS",
          );
        }
        extensionPaths.push(polkadotJSPath);
      }

      // Launch persistent context with all requested extensions
      const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        args: [
          `--disable-extensions-except=${extensionPaths.join(",")}`,
          `--load-extension=${extensionPaths.join(",")}`,
        ],
      });

      await context.waitForEvent('serviceworker');
      while (context.serviceWorkers().length < config.length) {
        await sleep(1000);
      }

      await use(context);
      await context.close();
    },
    backpack: async ({ context }, use) => {
      if (!withBackpack) {
        await use(undefined);
        return;
      }

      const serviceWorkers = context.serviceWorkers();

      // Identify which service worker is Backpack.
      const backpackWorker = serviceWorkers.find((worker) => {
        // TODO: Replace with a more robust test if loading multiple wallets.
        return worker.url().includes("chrome-extension://");
      });

      if (!backpackWorker) {
        throw Error("Could not find Backpack extension service worker");
      }

      const extensionId = backpackWorker.url().split("/")[2];
      if (!extensionId) {
        throw Error("Failed to parse Backpack extension ID");
      }

      // Create a dedicated page for Backpack
      const page = await context.newPage();
      const backpack = new Backpack(page, extensionId);

      // Go to the Backpack onboarding page or any other relevant page
      await page.goto(
        `chrome-extension://${extensionId}/options.html?onboarding=true`,
      );

      await use(backpack);
    },
    polkadotJS: async ({ context }, use) => {
      if (!withPolkadotJS) {
        await use(undefined);
        return;
      }

      const serviceWorkers = context.serviceWorkers();

      // Identify which service worker is Polkadot{.js}.
      const polkadotJsWorker = serviceWorkers.find((worker) =>
        // TODO: Replace with a more robust test if loading multiple wallets.
        worker.url().includes("chrome-extension://"),
      );

      if (!polkadotJsWorker) {
        throw Error("Could not find Polkadot{.js} extension service worker");
      }

      const extensionId = polkadotJsWorker.url().split("/")[2];
      if (!extensionId) {
        throw Error("Failed to parse Polkadot{.js} extension ID");
      }

      const page = await context.newPage();

      await page.goto(`chrome-extension://${extensionId}/options.html`);

      const polkadotJS = new PolkadotJS(page, extensionId);

      await use(polkadotJS);
    },
  });
}
