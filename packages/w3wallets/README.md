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

Only the `Backpack` wallet is supported at this point.

#### 1. Download Backpack

```sh
npx w3wallets backpack
```

The unzipped files should be stored in the `wallets/backpack` directory. Add them to `.gitignore`.

#### 2. Wrap your fixture `withWallets`

```ts
import { test as base } from "@playwright/test";
import { withWallets } from "../src/withWallets";

const test = withWallets(base, { backpack: true });

test("has title", async ({ page, backpack }) => {
  await page.goto("https://playwright.dev/");

  const privateKey =
    "4wDJd9Ds5ueTdS95ReAZGSBVkjMcNKbgZk47xcmqzpUJjCt7VoB2Cs7hqwXWRnopzXqE4mCP6BEDHCYrFttEcBw2";

  await backpack.onboard("Eclipse", privateKey);
});
```
