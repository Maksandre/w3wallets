import path from "path";
import { test as base, type BrowserContext } from "@playwright/test";
import { chromium } from "@playwright/test";

type Config = {
  backpack: boolean;
};

export function withExtensions(test: typeof base, config: Config) {
  const backpack = path.join(process.cwd(), "extensions", "backpack");
  // const metamask = path.join(process.cwd(), "metamask");

  return test.extend<{
    context: BrowserContext;
  }>({
    context: async ({}, use) => {
      const userDataDir = path.join(process.cwd(), ".tmp-user-data");
      // const extensions = TODO combine specified in `config` extensions

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
  });
}
