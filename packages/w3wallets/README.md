# w3wallets

![License](https://img.shields.io/badge/License-MIT-yellow.svg)
[![npm version](https://img.shields.io/npm/v/w3wallets.svg)](https://www.npmjs.com/package/w3wallets)
![CodeQL](https://github.com/Maksandre/w3wallets/actions/workflows/github-code-scanning/codeql/badge.svg?branch=main)

Web3 wallets for Playwright.

This library provides methods for interacting with Web3 wallets using Playwright.

```sh
npm install -D w3wallets
```

## Getting Started

The `Backpack` and the `Polkadot{.js}` wallets are supported at this point.

#### 1. Download wallets

```sh
npx w3wallets backpack polkadotJS
```

The unzipped files should be stored in the `.w3wallets/<wallet-name>` directory. Add them to `.gitignore`.

#### 2. Wrap your fixture `withWallets`

```ts
import { test as base } from "@playwright/test";
import { withWallets } from "../src/withWallets";

// Specify one or many wallets that should be installed in the browser
const test = withWallets(base, 'backpack', 'polkadotJS');

test("has title", async ({ page, backpack }) => {
  await page.goto("https://playwright.dev/");

  const privateKey =
    "4wDJd9Ds5ueTdS95ReAZGSBVkjMcNKbgZk47xcmqzpUJjCt7VoB2Cs7hqwXWRnopzXqE4mCP6BEDHCYrFttEcBw2";

  await backpack.onboard("Eclipse", privateKey);
});
```
