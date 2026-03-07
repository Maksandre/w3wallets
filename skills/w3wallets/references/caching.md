# Caching Guide

## Why Cache?

Wallet onboarding (seed import, password setup, UI initialization) takes 15-30 seconds per test. Caching pre-builds a browser profile with the wallet already onboarded, reducing setup to ~2 seconds (just `unlock()`).

## Creating a Cache Setup File

Create a `*.cache.ts` file that exports a `CachedWalletConfig` using `prepareWallet()`:

```ts
// wallets-cache/default.cache.ts
import { prepareWallet, metamask } from "w3wallets";

export default prepareWallet(metamask, async (wallet, page) => {
  await wallet.onboard("your twelve word mnemonic phrase here ...", "MyPassword123!");
});
```

The `prepareWallet(walletConfig, setupFn)` function takes:
- `walletConfig` — a wallet config (`metamask`, `polkadotJS`, or a custom one)
- `setupFn(wallet, page)` — an async function that performs the setup steps to cache

The setup function receives the wallet instance and the Playwright page. You can do anything here — onboard, switch networks, import accounts, etc. All state will be captured in the cache.

### Advanced setup example

```ts
import { prepareWallet, metamask } from "w3wallets";

export default prepareWallet(metamask, async (wallet) => {
  await wallet.onboard("word1 word2 ... word12", "MyPassword!");
  await wallet.addCustomNetwork({
    name: "Local Hardhat",
    rpc: "http://127.0.0.1:8545",
    chainId: 31337,
    currencySymbol: "ETH",
  });
  await wallet.enableTestNetworks();
});
```

## Building the Cache

```bash
npx w3wallets cache <directory>          # build cache for all *.cache.ts files
npx w3wallets cache <directory> --force  # rebuild even if cache exists
npx w3wallets cache <directory> --headed # run with visible browser (for debugging)
```

The `<directory>` argument points to the folder containing your `*.cache.ts` files.

The build process:
1. Compiles `*.cache.ts` files with tsup
2. Launches a persistent Chromium context with the extension loaded
3. Runs the setup function (onboard, configure, etc.)
4. Waits for extension storage to stabilize (chrome.storage.local)
5. Saves the browser profile to `.w3wallets/cache/<hash>/`

## Using Cached Wallets in Tests

Import the cache file and pass it to `withWallets` instead of the regular wallet config:

```ts
// fixtures.ts
import { test as base, expect } from "@playwright/test";
import { withWallets } from "w3wallets";
import cachedMetamask from "../wallets-cache/default.cache";

const test = withWallets(base, cachedMetamask).extend({
  metamask: async ({ metamask }, use) => {
    await metamask.unlock(); // unlock the cached wallet (~2s)
    await use(metamask);
  },
});

export { test, expect };
```

Key points:
- Import the `*.cache.ts` file directly (TypeScript resolves it)
- Call `unlock()` instead of `onboard()` — the wallet is already set up
- Use the same password you used during cache setup

## Cache Directory Structure

```
.w3wallets/
  cache/
    <hash>/                 # browser profile (hash of cache file path)
      .meta.json            # { "name": "metamask" }
      Default/              # Chromium profile data
      ...
    .dist/                  # compiled cache setup files (temporary)
```

## Troubleshooting

### Stale cache
If tests fail after updating w3wallets or the wallet extension, rebuild the cache:
```bash
npx w3wallets cache <directory> --force
```

### Missing extension
The extension must be downloaded before building the cache:
```bash
npx w3wallets metamask     # download first
npx w3wallets cache <dir>  # then build cache
```

### Cache not found at test time
Ensure you've run `npx w3wallets cache <dir>` before running tests. The cache directory (`.w3wallets/cache/`) must exist at the project root.

### Debugging cache builds
Run with `--headed` to see what the browser does during setup:
```bash
npx w3wallets cache <directory> --headed
```

Enable debug logging:
```bash
W3WALLETS_DEBUG=true npx w3wallets cache <directory> --headed
```
