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

`MetaMask`, `Backpack`, and `Polkadot{.js}` wallets are currently supported.

<p align="center">
  <img src="https://images.ctfassets.net/clixtyxoaeas/1ezuBGezqfIeifWdVtwU4c/d970d4cdf13b163efddddd5709164d2e/MetaMask-icon-Fox.svg" alt="Metamask Logo" width="60"/>
  <img src="https://raw.githubusercontent.com/coral-xyz/backpack/refs/heads/master/assets/backpack.png" alt="Backpack Logo" width="60"/>
  <img src="https://polkadot.js.org/logo.svg" alt="Polkadot JS Logo" width="60"/>
</p>

#### 1. Download wallets

```sh
npx w3wallets metamask backpack polkadotjs
```

Short aliases are also supported:

```sh
npx w3wallets mm bp pjs
```

The unzipped files are stored in the `.w3wallets/<wallet-name>` directory. Add `.w3wallets` to `.gitignore`.

<details>
<summary>CLI Options</summary>

```
USAGE:
  npx w3wallets [OPTIONS] <targets...>

TARGETS:
  Alias name      Known wallet alias (metamask, backpack, polkadotjs)
  Short alias     Short form (mm, bp, pjs)
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
  npx w3wallets mm bp pjs                   # Download all wallets (short)
  npx w3wallets --list                      # List available aliases
  npx w3wallets -o ./extensions metamask    # Custom output directory
  npx w3wallets --force mm                  # Force re-download
```

</details>

#### 2. Wrap your fixture with `withWallets`

Install the required wallets into Chromium using `withWallets`.

```ts
// your-fixture.ts
import { withWallets, metamask, backpack, polkadotJS } from "w3wallets";
import { test as base } from "@playwright/test";

export const test = withWallets(base, metamask, backpack, polkadotJS);

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
    "test test test test test test test test test test test junk";

  await metamask.onboard(mnemonic);
  await page.goto("https://your-dapp.com");

  await page.getByRole("button", { name: "Connect Wallet" }).click();
  await metamask.approve();

  await expect(page.getByText("Connected")).toBeVisible();
});
```
