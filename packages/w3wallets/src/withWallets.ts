import path from "path";
import fs from "fs";
import { test as base, type BrowserContext } from "@playwright/test";
import { chromium } from "@playwright/test";
import { Backpack } from "./backpack";

type Config = {
  backpack: boolean;
};

export function withWallets(test: typeof base, config: Config) {
  const backpack = path.join(process.cwd(), "extensions", "backpack");
  // const metamask = path.join(process.cwd(), "metamask");

  return test.extend<{
    context: BrowserContext;
    backpack: Backpack;
    extensionId: string;
  }>({
    backpack: async ({ context, extensionId }, use) => {
      const page = context.pages()[0];
      if (!page) throw Error("No pages in context");

      const backpack = new Backpack(page, extensionId);

      await page.goto(
        `chrome-extension://${extensionId}/options.html?onboarding=true`,
      );

      await use(backpack);
    },
    context: async ({}, use, testInfo) => {
      const userDataDir = path.join(
        process.cwd(),
        ".w3wallets",
        testInfo.testId,
      );
      if (fs.existsSync(userDataDir))
        fs.rmSync(userDataDir, { recursive: true });
      // const extensions = TODO combine specified in `config` extensions

      const backpackDownloaded = fs.existsSync(
        path.join(backpack, "manifest.json"),
      );
      if (!backpackDownloaded)
        throw Error("Cannot find Backpack. download it `npx w3wallets`");

      const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        args: [
          `--disable-extensions-except=${backpack}`,
          `--load-extension=${backpack}`,
        ],
      });

      await use(context);

      await context.close();
    },
    extensionId: async ({ context }, use) => {
      /*
      // for manifest v2:
      let [background] = context.backgroundPages()
      if (!background)
        background = await context.waitForEvent('backgroundpage')
      */

      // for manifest v3:
      let [background] = context.serviceWorkers();
      if (!background) background = await context.waitForEvent("serviceworker");

      const extensionId = background.url().split("/")[2];
      if (!extensionId) throw Error("No extension id");
      await use(extensionId);
    },
  });
}
