export interface PolkadotConnector {
  uid: string;
  name: string;
  installed: boolean;
}

export const polkadotConnectors: PolkadotConnector[] = [
  ["polkadot-js", "Polkadot.js"],
  ["talisman", "Talisman"],
  ["subwallet-js", "Subwallet"],
  ["enkrypt", "Enkrypt"],
  ["novawallet", "Nova"],
].map((wallet) => ({
  uid: wallet[0],
  name: wallet[1],
  installed:
    typeof window !== "undefined" && !!window.injectedWeb3?.[wallet[0]],
}));
