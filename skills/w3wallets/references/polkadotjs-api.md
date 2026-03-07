# Polkadot.js API Reference

Import:

```ts
import { polkadotJS, PolkadotJS } from "w3wallets";
```

The pre-built `polkadotJS` config uses `extensionDir: "polkadotjs"` and `WalletClass: PolkadotJS`. Download the extension with `npx w3wallets polkadotjs`.

## Methods

### `onboard(seed: string, password?: string, name?: string)`

Import an account from a seed phrase. Handles the full onboarding flow: disclaimer screens, seed input, account naming, and password creation.

- `seed` — seed phrase
- `password` — account password (default: `"11111111"`)
- `name` — account display name (default: `"Test"`)

```ts
await polkadotJS.onboard("word1 word2 ... word12");
await polkadotJS.onboard("word1 word2 ... word12", "MyPassword!", "Alice");
```

### `approve()`

Approve a pending connection or sign transaction request. Clicks whichever is visible: the "Connect" button or the "Sign the transaction" button.

```ts
await page.getByRole("button", { name: "Connect" }).click();
await polkadotJS.approve();
```

### `deny()`

Reject a pending connection or cancel a signing request. Clicks the "Reject" button or "Cancel" link.

```ts
await polkadotJS.deny();
```

### `selectAllAccounts()`

Select all accounts when the extension prompts which accounts to share with a dApp.

```ts
await polkadotJS.selectAllAccounts();
await polkadotJS.approve();
```

### `selectAccount(accountId: string)`

Select a specific account by its ID when the extension prompts which accounts to share.

```ts
await polkadotJS.selectAccount("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY");
await polkadotJS.approve();
```

### `enterPassword(password?: string)`

Enter the account password when signing a transaction.

- `password` — account password (default: `"11111111"`)

```ts
await polkadotJS.enterPassword();
await polkadotJS.approve(); // sign the transaction
```

## Notes

- The extension page is at `chrome-extension://<id>/index.html`.
- Default password for all methods is `"11111111"`.
- The Polkadot.js extension uses a popup-based UI — it does not use sidepanel or hash routing like MetaMask.
