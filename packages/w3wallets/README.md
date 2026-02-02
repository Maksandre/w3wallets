# w3wallets

![License](https://img.shields.io/badge/License-MIT-yellow.svg)
[![npm version](https://img.shields.io/npm/v/w3wallets.svg)](https://www.npmjs.com/package/w3wallets)
![CodeQL](https://github.com/Maksandre/w3wallets/actions/workflows/github-code-scanning/codeql/badge.svg?branch=main)
[![Tests](https://github.com/Maksandre/w3wallets/actions/workflows/playwright.yml/badge.svg?branch=main)](https://github.com/Maksandre/w3wallets/actions/workflows/playwright.yml)

Web3 wallets for Playwright.

This library provides methods for interacting with Web3 wallets using Playwright.

```sh
npm install -D w3wallets
```

## Getting Started

`MetaMask` and `Polkadot{.js}` wallets are currently supported.

<p align="center">
  <img src="https://images.ctfassets.net/clixtyxoaeas/1ezuBGezqfIeifWdVtwU4c/d970d4cdf13b163efddddd5709164d2e/MetaMask-icon-Fox.svg" alt="Metamask Logo" width="60"/>
  <img src="https://polkadot.js.org/logo.svg" alt="Polkadot JS Logo" width="60"/>
</p>

#### 1. Download wallets

```sh
npx w3wallets metamask polkadotjs
```

Short aliases are also supported:

```sh
npx w3wallets mm pjs
```

The unzipped files are stored in the `.w3wallets/<wallet-name>` directory. Add `.w3wallets` to `.gitignore`.

<details>
<summary>CLI Options</summary>

```
USAGE:
  npx w3wallets [OPTIONS] <targets...>

TARGETS:
  Alias name      Known wallet alias (metamask, polkadotjs)
  Short alias     Short form (mm, pjs)
  Extension ID    32-character Chrome extension ID
  URL             Chrome Web Store URL

OPTIONS:
  -h, --help      Show help message
  -l, --list      List available wallet aliases
  -o, --output    Output directory (default: .w3wallets)
  -f, --force     Force re-download even if already exists
  --debug         Save raw .crx file for debugging

EXAMPLES:
  npx w3wallets metamask                    # Download MetaMask
  npx w3wallets mm pjs                      # Download all wallets (short)
  npx w3wallets --list                      # List available aliases
  npx w3wallets -o ./extensions metamask    # Custom output directory
  npx w3wallets --force mm                  # Force re-download
```

</details>

#### 2. Wrap your fixture with `withWallets`

Install the required wallets into Chromium using `withWallets`.

```ts
// your-fixture.ts
import { withWallets, metamask, polkadotJS } from "w3wallets";
import { test as base } from "@playwright/test";

export const test = withWallets(base, metamask, polkadotJS);

export { expect } from "@playwright/test";
```

#### 3. Use the installed wallets in tests

Most commonly, you will use the following methods:

1. `onboard`: to set up your wallet
2. `approve`: for operations that confirm actions
3. `deny`: for actions that reject or cancel operations

```ts
import { test, expect } from "./your-fixture";

test("Can connect MetaMask to dApp", async ({ page, metamask }) => {
  const mnemonic =
    "set your seed phrase test test test test test test test junk";

  await metamask.onboard(mnemonic);
  await page.goto("https://your-dapp.com");

  await page.getByRole("button", { name: "Connect Wallet" }).click();
  await metamask.approve();

  await expect(page.getByText("Connected")).toBeVisible();
});
```

## Caching

Wallet onboarding can be slow. Caching lets you run the setup once and reuse the browser profile across tests.

#### 1. Create a setup file

Create a `*.cache.ts` file in a `wallets-cache/` directory (default):

```ts
// wallets-cache/default.cache.ts
import { prepareWallet, metamask } from "w3wallets";

export default prepareWallet(metamask, async (wallet, page) => {
  await wallet.onboard("your seed phrase ...", "YourPassword123!");
});
```

#### 2. Build the cache

```sh
npx w3wallets cache
```

<details>
<summary>CLI Options</summary>

```
USAGE:
  npx w3wallets cache [OPTIONS] [directory]

OPTIONS:
  -f, --force   Force rebuild even if cache exists
  --headed      Run browser in headed mode
  directory     Directory containing *.cache.{ts,js} files (default: ./wallets-cache/)
```

</details>

The cached profiles are stored in `.w3wallets/cache/`. The `.w3wallets` directory should already be in `.gitignore`.

#### 3. Use cached wallets in tests

Import the setup and pass it to `withWallets`:

```ts
import { test as base, expect } from "@playwright/test";
import { withWallets } from "w3wallets";
import cachedMetamask from "./wallets-cache/default.cache";

const test = withWallets(base, cachedMetamask);

test("wallet is ready", async ({ metamask }) => {
  await metamask.unlock("YourPassword123!");
  // wallet is already onboarded
});
```

> **Note:** All wallets in a test must be either all cached or all non-cached.

## Configuration

Configure library behavior via environment variables:

| Variable                   | Description                                                               | Default     |
| -------------------------- | ------------------------------------------------------------------------- | ----------- |
| `W3WALLETS_ACTION_TIMEOUT` | Timeout (ms) for all wallet actions (click, fill, navigation, assertions) | `undefined` |

Example:

```sh
# In .env or CI environment
W3WALLETS_ACTION_TIMEOUT=60000
```

This only affects w3wallets library code. Your own Playwright configuration remains independent.
