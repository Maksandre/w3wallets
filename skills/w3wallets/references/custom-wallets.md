# Custom Wallet Extensions

You can add support for any Chrome extension wallet by extending the `Wallet` base class and registering it with `createWallet()`.

## Step 1: Download the Extension

Download any Chrome extension by its ID:

```bash
npx w3wallets <chrome-extension-id>
```

The extension ID is the string in the Chrome Web Store URL: `https://chromewebstore.google.com/detail/<name>/<extension-id>`.

The extension is saved to `.w3wallets/<extension-id>/`.

## Step 2: Create a Wallet Class

Extend the `Wallet` abstract class and implement the required methods:

```ts
import { Wallet } from "w3wallets/core/wallet";
// Or if only the package export is available:
// You'll need to extend IWallet interface pattern

import { expect } from "@playwright/test";

export class MyWallet extends Wallet {
  // Navigate to the extension's onboarding page
  async gotoOnboardPage() {
    await this.page.goto(`chrome-extension://${this.extensionId}/onboard.html`);
    await expect(this.page.getByText("Welcome")).toBeVisible();
  }

  // Approve a pending request (connection, transaction, signature)
  async approve() {
    const confirmBtn = this.page.getByRole("button", { name: "Approve" });
    await confirmBtn.click();
  }

  // Deny a pending request
  async deny() {
    const rejectBtn = this.page.getByRole("button", { name: "Reject" });
    await rejectBtn.click();
  }

  // Add any custom methods your wallet needs
  async onboard(seed: string, password: string) {
    await this.gotoOnboardPage();
    // ... implement onboarding steps
  }
}
```

### The `Wallet` Base Class

```ts
abstract class Wallet implements IWallet {
  constructor(
    public readonly page: Page,        // Playwright page for the extension
    public readonly extensionId: string // Chrome extension ID
  ) {}

  abstract gotoOnboardPage(): Promise<void>;
  abstract approve(): Promise<void>;
  abstract deny(): Promise<void>;
}
```

The base class:
- Stores the Playwright `page` and `extensionId`
- Applies `W3WALLETS_ACTION_TIMEOUT` to the page if set
- Requires three abstract methods: `gotoOnboardPage`, `approve`, `deny`

## Step 3: Register with `createWallet()`

```ts
import { createWallet } from "w3wallets";
import { MyWallet } from "./my-wallet";

export const myWallet = createWallet({
  name: "myWallet",          // fixture name in tests
  extensionDir: "abcdef123", // directory name under .w3wallets/
  WalletClass: MyWallet,
  // Optional:
  extensionId: "abcdef...",  // explicit ID (auto-derived from manifest.json key if omitted)
  homeUrl: "popup.html",     // home page path (used for cached wallets)
});
```

### `WalletConfig` Properties

| Property | Required | Description |
|----------|----------|-------------|
| `name` | Yes | Fixture name, used in test functions (`async ({ myWallet }) => {}`) |
| `extensionDir` | Yes | Directory name under `.w3wallets/` containing the extension |
| `WalletClass` | Yes | Constructor for the wallet class |
| `extensionId` | No | Chrome extension ID. Auto-derived from `manifest.json` `key` field if omitted |
| `homeUrl` | No | Extension home page path (e.g., `"popup.html"`). Used by cached wallets to navigate after restore |

## Step 4: Use in Tests

```ts
import { test as base } from "@playwright/test";
import { withWallets } from "w3wallets";
import { myWallet } from "./my-wallet-config";

const test = withWallets(base, myWallet);

test("connect with custom wallet", async ({ myWallet }) => {
  await myWallet.onboard("seed phrase...", "password");
  // ...
});
```

## Adding Cache Support

To enable caching for your custom wallet, use `prepareWallet()`:

```ts
// wallets-cache/my-wallet.cache.ts
import { prepareWallet } from "w3wallets";
import { myWallet } from "../my-wallet-config";

export default prepareWallet(myWallet, async (wallet) => {
  await wallet.onboard("seed phrase...", "password");
});
```

Build and use exactly like built-in wallets:

```bash
npx w3wallets cache wallets-cache
```

```ts
import cachedMyWallet from "./wallets-cache/my-wallet.cache";
const test = withWallets(base, cachedMyWallet);
```

## Tips

- Use `this.page` and `this.extensionId` to navigate the extension UI
- Use Playwright locators (`getByRole`, `getByTestId`, `getByText`) for reliable element selection
- For `approve()` and `deny()`, you may need to navigate to the extension popup/page first if it doesn't auto-open
- Test your wallet class in headed mode first: `npx playwright test --headed`
- Set `homeUrl` in the config if the extension has a specific home page that should be loaded when restoring from cache
