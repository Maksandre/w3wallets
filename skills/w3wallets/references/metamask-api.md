# MetaMask API Reference

Import:

```ts
import { metamask, Metamask } from "w3wallets";
```

The pre-built `metamask` config uses `extensionDir: "metamask"` and `WalletClass: Metamask`. Download the extension with `npx w3wallets metamask`.

## Methods

### `onboard(mnemonic: string, password?: string)`

Import a wallet using a 12 or 24 word recovery phrase. Handles the full onboarding flow: seed input, password creation, metametrics consent, and initial UI load.

- `mnemonic` — space-separated recovery phrase
- `password` — wallet password (default: `"TestPassword123!"`)

After onboarding, navigates to `sidepanel.html` where MetaMask renders its main UI.

```ts
await metamask.onboard("word1 word2 word3 ... word12", "MyPassword!");
```

### `approve()`

Confirm the pending transaction, connection request, or signature. Navigates to the extension's sidepanel, waits for the confirmation route, and clicks the confirm button. Handles MetaMask's Transaction Shield popup automatically.

```ts
await page.getByRole("button", { name: "Connect" }).click();
await metamask.approve();
```

### `deny()`

Reject the pending transaction, connection request, or signature. Same navigation logic as `approve()`, but clicks the cancel/reject button.

```ts
await page.getByRole("button", { name: "Send" }).click();
await metamask.deny();
```

### `lock()`

Lock the wallet. Navigates to `home.html` and clicks Log out from the account menu.

```ts
await metamask.lock();
```

### `unlock(password?: string)`

Unlock the wallet with password. After unlocking, stabilizes the UI by handling:
- Metametrics consent screen
- "Your wallet is ready" onboarding screen
- Queued notifications (e.g., Solana/Tron account removal prompts)

Essential for cached wallets — call `unlock()` in the fixture setup instead of `onboard()`.

- `password` — wallet password (default: `"TestPassword123!"`)

```ts
await metamask.unlock();
await metamask.unlock("CustomPassword!");
```

### `switchNetwork(networkName: string, networkType?: "Popular" | "Custom")`

Switch to an existing network.

- `networkName` — display name (e.g., `"Ethereum Mainnet"`, `"Sepolia"`)
- `networkType` — `"Popular"` (default) or `"Custom"` tab

```ts
await metamask.switchNetwork("Sepolia");
await metamask.switchNetwork("My Local Network", "Custom");
```

### `switchAccount(accountName: string)`

Switch to an account by its display name.

```ts
await metamask.switchAccount("Account 2");
```

### `addNetwork(network: NetworkSettings)`

Add a custom network via the settings page (`home.html#settings/networks/add-network`).

```ts
await metamask.addNetwork({
  name: "Local Hardhat",
  rpc: "http://127.0.0.1:8545",
  chainId: 31337,
  currencySymbol: "ETH",
});
```

### `addCustomNetwork(settings: NetworkSettings)`

Add a custom network via the networks modal (accessible from the account menu). Uses a different UI flow than `addNetwork` — goes through the "Add a custom network" button in the networks list.

```ts
await metamask.addCustomNetwork({
  name: "Local Hardhat",
  rpc: "http://127.0.0.1:8545",
  chainId: 31337,
  currencySymbol: "ETH",
});
```

### `enableTestNetworks()`

Toggle test networks visibility in the network picker. Opens the networks modal and clicks the "Show test networks" toggle.

```ts
await metamask.enableTestNetworks();
await metamask.switchNetwork("Sepolia");
```

### `importAccount(privateKey: string)`

Import an account using a private key.

```ts
await metamask.importAccount("0xac0974bec39a17e36ba4a6b4d238ff944bacb478...");
```

### `accountNameIs(name: string)`

Assert that the currently active account has the expected name. Uses Playwright's `expect` with the configured expect timeout.

```ts
await metamask.accountNameIs("Account 2");
```

### `dismissPopups()`

Dismiss MetaMask promotional popups (e.g., Transaction Shield). Called automatically by `approve()` and `deny()`, but can be called manually if needed.

## Types

### `NetworkSettings`

```ts
interface NetworkSettings {
  name: string;
  rpc: string;
  chainId: number;
  currencySymbol: string;
}
```

## Notes

- MetaMask uses `sidepanel.html` for its main UI and `home.html` for settings and lock/unlock flows.
- The `approve()` and `deny()` methods navigate to `sidepanel.html` and wait for a confirmation route (`#/confirm-transaction/...`, `#/connect/...`, or `#/confirmation/...`) before clicking.
- Default password for all methods is `"TestPassword123!"`.
