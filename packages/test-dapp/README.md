# W3Wallets Test DApp

Test DApp for the w3wallets library. Includes ERC-20 and ERC-721 contracts for testing wallet interactions.

## Setup

```bash
# Install dependencies
yarn install

# Compile contracts (generates ABIs)
yarn workspace @w3wallets/test-dapp compile
```

## Development

### 1. Start local blockchain (Anvil)

```bash
yarn start:anvil
```

### 2. Deploy contracts

```bash
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 yarn deploy
```

Contracts are deployed to deterministic addresses:
- TestToken (ERC-20): `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- TestNFT (ERC-721): `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`

### 3. Start the DApp

```bash
yarn start:dapp
```

Open http://localhost:3001

## Contracts

- **TestToken.sol** - ERC-20 token with public `mint()` function
- **TestNFT.sol** - ERC-721 NFT with public `mint(address, uri)` function

## Scripts

| Script | Description |
|--------|-------------|
| `yarn workspace @w3wallets/test-dapp compile` | Compile contracts with Foundry |
| `yarn workspace @w3wallets/test-dapp anvil` | Start local Anvil node |
| `yarn workspace @w3wallets/test-dapp deploy` | Deploy contracts to Anvil |
| `yarn workspace @w3wallets/test-dapp dev` | Start Next.js dev server |
