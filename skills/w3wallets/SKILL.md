---
name: w3wallets
description: Interact with browser wallets (MetaMask, Polkadot.js) in Playwright e2e tests.
  Use when the user needs to set up wallet extensions, create wallet fixtures, approve/deny
  transactions, manage wallet caching, or any Web3 wallet interaction in tests.
metadata:
  author: Maksandre
  version: "1.0"
license: MIT
---

# w3wallets

A Playwright library for browser wallet interactions (MetaMask, Polkadot.js) in e2e tests.

## Quick Start

```bash
# 1. Install the library
npm install -D w3wallets

# 2. Download the wallet extension
npx w3wallets metamask

# 3. Create a fixture and write a test
```

```ts
// fixtures.ts
import { test as base } from "@playwright/test";
import { withWallets, metamask } from "w3wallets";

export const test = withWallets(base, metamask);

// my-test.spec.ts
import { test } from "./fixtures";

test("connect wallet", async ({ page, metamask }) => {
  await metamask.onboard("your twelve word mnemonic phrase here ...");
  await page.goto("http://localhost:3000");
  await page.getByRole("button", { name: "Connect Wallet" }).click();
  await metamask.approve();
});
```

## Setup

Download wallet extensions with the CLI:

```bash
npx w3wallets metamask      # downloads MetaMask
npx w3wallets polkadotjs    # downloads Polkadot.js
npx w3wallets <extension-id> # downloads any Chrome extension by ID
```

Extensions are stored in `.w3wallets/` at the project root. Add `.w3wallets/` to `.gitignore`.

## withWallets Fixture

`withWallets(base, ...walletConfigs)` extends Playwright's `test` with wallet fixtures. Each wallet config adds a typed fixture by its name.

```ts
import { test as base } from "@playwright/test";
import { withWallets, metamask, polkadotJS } from "w3wallets";

// Single wallet
const test = withWallets(base, metamask);
// test("...", async ({ metamask }) => { ... });

// Multiple wallets
const test = withWallets(base, metamask, polkadotJS);
// test("...", async ({ metamask, polkadotJS }) => { ... });
```

Each fixture provides a wallet instance with its own extension page. The `context` fixture is a persistent Chromium context with extensions loaded.

## Wallet API Overview

### MetaMask

| Method | Description |
|--------|-------------|
| `onboard(mnemonic, password?)` | Import wallet with recovery phrase |
| `approve()` | Confirm the pending transaction/connection |
| `deny()` | Reject the pending transaction/connection |
| `lock()` | Lock the wallet |
| `unlock(password?)` | Unlock the wallet (handles post-unlock screens) |
| `switchNetwork(name, category?)` | Switch to a network ("Popular" or "Custom") |
| `switchAccount(name)` | Switch to an account by name |
| `addNetwork(settings)` | Add a custom network via settings page |
| `addCustomNetwork(settings)` | Add a custom network via the networks modal |
| `enableTestNetworks()` | Toggle test networks visibility |
| `importAccount(privateKey)` | Import an account by private key |
| `accountNameIs(name)` | Assert the active account name |

`NetworkSettings`: `{ name: string, rpc: string, chainId: number, currencySymbol: string }`

### Polkadot.js

| Method | Description |
|--------|-------------|
| `onboard(seed, password?, name?)` | Import account from seed phrase |
| `approve()` | Approve connection or sign transaction |
| `deny()` | Reject connection or cancel signing |
| `selectAllAccounts()` | Select all accounts for connection |
| `selectAccount(accountId)` | Select a specific account by ID |
| `enterPassword(password?)` | Enter password for signing |

Full API details: [MetaMask reference](references/metamask-api.md) | [Polkadot.js reference](references/polkadotjs-api.md)

## Common Patterns

### The Two-Page Dance

Wallet interactions involve two pages: your dApp page and the wallet extension page. The library handles navigation to the extension automatically.

```ts
// 1. Trigger action on dApp page
await page.getByRole("button", { name: "Connect Wallet" }).click();

// 2. Approve in wallet (library navigates to extension page internally)
await metamask.approve();

// 3. Continue on dApp page
await page.bringToFront(); // bring dApp page back to focus if needed
```

### Connect, Sign, Approve, Deny

```ts
// Connect
await page.getByRole("button", { name: "Connect" }).click();
await metamask.approve();

// Sign a message
await page.getByRole("button", { name: "Sign" }).click();
await metamask.approve();

// Deny a transaction
await page.getByRole("button", { name: "Send" }).click();
await metamask.deny();
```

### Switch Network

```ts
await metamask.switchNetwork("Sepolia");
await metamask.switchNetwork("My Custom Network", "Custom");
```

## Caching

Wallet onboarding (seed import, password setup) takes 15-30 seconds. Caching reduces this to ~2 seconds by restoring a pre-onboarded browser profile.

**Quick setup:**

```ts
// wallets-cache/default.cache.ts
import { prepareWallet, metamask } from "w3wallets";

export default prepareWallet(metamask, async (wallet) => {
  await wallet.onboard("your twelve word mnemonic ...", "MyPassword123!");
});
```

```bash
npx w3wallets cache wallets-cache          # build cache
npx w3wallets cache wallets-cache --force  # rebuild
```

```ts
// fixtures.ts — use cached wallet
import { test as base } from "@playwright/test";
import { withWallets } from "w3wallets";
import cachedMetamask from "./wallets-cache/default.cache";

const test = withWallets(base, cachedMetamask);

// Fixture: unlock instead of onboard
test.extend({
  metamask: async ({ metamask }, use) => {
    await metamask.unlock(); // ~2s instead of ~20s
    await use(metamask);
  },
});
```

Full caching guide: [references/caching.md](references/caching.md)

## Configuration

Environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `W3WALLETS_ACTION_TIMEOUT` | Timeout for actions (click, fill, goto) in ms | `30000` |
| `W3WALLETS_EXPECT_TIMEOUT` | Timeout for expect assertions in ms | Playwright default (5000) |
| `W3WALLETS_DEBUG` | Enable debug logging (`"true"`) | disabled |

```bash
W3WALLETS_DEBUG=true npx playwright test
```

## Waiting Best Practices

- Prefer waiting for UI effects: `await expect(element).toBeVisible()`
- Use `page.waitForResponse` / `page.waitForRequest` for API calls when no reliable UI indicator exists
- Avoid `page.waitForTimeout` — only use during debugging or as a last resort

## Custom Wallets

You can add support for any Chrome extension wallet by extending the `Wallet` base class. See [references/custom-wallets.md](references/custom-wallets.md).

## References

- [MetaMask API Reference](references/metamask-api.md)
- [Polkadot.js API Reference](references/polkadotjs-api.md)
- [Caching Guide](references/caching.md)
- [Custom Wallet Extensions](references/custom-wallets.md)
