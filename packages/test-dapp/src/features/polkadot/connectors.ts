export interface PolkadotConnector {
  /** Key the extension registers under in `window.injectedWeb3`. */
  uid: string;
  name: string;
}

export const polkadotConnectors: PolkadotConnector[] = [
  { uid: "polkadot-js", name: "Polkadot.js" },
  { uid: "talisman", name: "Talisman" },
  { uid: "subwallet-js", name: "Subwallet" },
  { uid: "enkrypt", name: "Enkrypt" },
  { uid: "novawallet", name: "Nova" },
];

declare global {
  interface Window {
    /** Injected by Polkadot extensions (Polkadot.js, Talisman, ...). */
    injectedWeb3?: Record<string, unknown>;
  }
}
