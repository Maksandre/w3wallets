export interface PolkadotConnector {
  uid: string;
  name: string;
  installed?: boolean;
}

export const polkadotConnectors: PolkadotConnector[] = [
  { uid: "polkadot-js", name: "Polkadot.js" },
  { uid: "talisman", name: "Talisman" },
  { uid: "subwallet-js", name: "Subwallet" },
  { uid: "enkrypt", name: "Enkrypt" },
  { uid: "novawallet", name: "Nova" },
];

export function getInstalledConnectors(): PolkadotConnector[] {
  if (typeof window === "undefined") return polkadotConnectors;

  return polkadotConnectors.map((wallet) => ({
    ...wallet,
    installed: !!window.injectedWeb3?.[wallet.uid],
  }));
}
