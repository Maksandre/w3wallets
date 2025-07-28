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
npx w3wallets backpack polkadotJS
```

The unzipped files should be stored in the `.w3wallets/<wallet-name>` directory. Add them to `.gitignore`.

#### 2. Wrap your fixture with `withWallets`

Install the required wallets into Chromium using `withWallets`.

```ts
// your-fixture.ts
import { withWallets } from "w3wallets";
import { test as base } from "@playwright/test";

export const test = withWallets(
  base,
  "backpack",
  "polkadotJS",
).extend<BaseFixture>({
  magic: (_, use) => use(42),
});

type BaseFixture = {
  magic: number;
};

export { expect } from "@playwright/test";
```

#### 3. Use the installed wallets in tests

Most commonly, you will use the following methods:

1. `onboard`: to set up your wallet
2. `approve`: for operations that confirm actions
3. `deny`: for actions that reject or cancel operations

```ts
import { test } from "./your-fixture";

test("Can use wallet", async ({ page, backpack }) => {
  const privateKey =
    "4wDJd9Ds5ueTdS95ReAZGSBVkjMcNKbgZk47xcmqzpUJjCt7VoB2Cs7hqwXWRnopzXqE4mCP6BEDHCYrFttEcBw2";

  await backpack.onboard("Eclipse", privateKey);
});
```
