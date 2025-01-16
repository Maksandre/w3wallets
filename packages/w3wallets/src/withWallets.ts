import path from "path";
import fs from "fs";
import { test as base, type BrowserContext } from "@playwright/test";
import { chromium } from "@playwright/test";
import { Backpack } from "./backpack";

type Config = {
  backpack?: boolean;
  // metamask?: boolean;
};

export function withWallets(test: typeof base, config: Config) {
  // Paths to each extension
  const backpackPath = path.join(process.cwd(), "wallets", "backpack");
  const metamaskPath = path.join(process.cwd(), "wallets", "metamask");

  return test.extend<{
    context: BrowserContext;
    backpack: Backpack;
    extensionId: string;
  }>({
    backpack: async ({ context, extensionId }, use) => {
      const page = context.pages()[0];
      if (!page) throw Error("No pages in context");

      const backpack = new Backpack(page, extensionId);

      // Go to the Backpack onboarding page
      await page.goto(
        `chrome-extension://${extensionId}/options.html?onboarding=true`,
      );

      await use(backpack);
    },

    // Browser context fixture
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
      if (config.backpack) {
        if (!fs.existsSync(path.join(backpackPath, "manifest.json"))) {
          throw Error(
            "Cannot find Backpack. Please download it via `npx w3wallets`",
          );
        }
        extensionPaths.push(backpackPath);
      }

      // // Add Metamask
      // if (config.metamask) {
      //   if (!fs.existsSync(path.join(metamaskPath, "manifest.json"))) {
      //     throw Error(
      //       "Cannot find Metamask. Please download it via `npx w3wallets metamask`",
      //     );
      //   }
      //   extensionPaths.push(metamaskPath);
      // }

      const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        args: [
          `--disable-extensions-except=${extensionPaths.join(",")}`,
          `--load-extension=${extensionPaths.join(",")}`,
        ],
      });

      await use(context);

      await context.close();
    },

    extensionId: async ({ context }, use) => {
      // For manifest v3:
      let [background] = context.serviceWorkers();
      if (!background) {
        background = await context.waitForEvent("serviceworker");
      }

      const extensionId = background.url().split("/")[2];
      if (!extensionId) throw Error("No extension id");
      await use(extensionId);
    },
  });
}
