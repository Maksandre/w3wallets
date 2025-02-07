To work on this project in VS Code, make sure you open the project's root directory.

0. Create the `.env` using `.env.example` as a reference.
1. Install dependencies

```sh
yarn
```

2. Install Chrome browser

```sh
npx playwright install chromium
```

3. Download wallet extensions

```sh
npx w3wallets backpack polkadotJS
```

4. Start UI

```sh
yarn start:ui
```

5. Run Tests with Playwright

```sh
yarn test
```
