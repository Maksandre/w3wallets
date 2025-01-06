# w3wallets

Web3 wallets for Playwright.

> [!IMPORTANT]
> This is Alpha!

This library provides methods for interacting with Web3 wallets using Playwright.

```sh
npm install -D w3wallets
```

## Getting Started

Only the `Backpack` wallet is supported at this point.

#### 1. Download wallets

```sh
npx w3wallets
```

#### 2. Wrap your fixture `withWallets`

```ts
import { test as base } from "@playwright/test";
import { withWallets } from "../src/withWallets";

const test = withWallets(base, { backpack: true });

test("has title", async ({ page, backpack }) => {
  await page.goto("https://playwright.dev/");

  await backpack.onboard(
    "4wDJd9Ds5ueTdS95ReAZGSBVkjMcNKbgZk47xcmqzpUJjCt7VoB2Cs7hqwXWRnopzXqE4mCP6BEDHCYrFttEcBw2",
  );
});
```
