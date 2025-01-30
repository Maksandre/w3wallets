import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { polkadotConnectors, PolkadotConnector, getInstalledConnectors } from "./connectors";

type PolkadotWalletStatus = "disconnected" | "connecting" | "connected";

interface PolkadotWalletState {
  status: PolkadotWalletStatus;
  addresses: string[];
  error?: Error;
  selectedConnector?: PolkadotConnector | null;
}

interface PolkadotWalletContextType extends PolkadotWalletState {
  connectors: PolkadotConnector[];
  connect: (opts: { connector: PolkadotConnector }) => Promise<void>;
  disconnect: () => void;
}

const PolkadotWalletContext = createContext<PolkadotWalletContextType>({
  status: "disconnected",
  addresses: [],
  connectors: polkadotConnectors,
  connect: async () => undefined,
  disconnect: () => undefined,
  selectedConnector: null,
});

export function PolkadotWalletProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<PolkadotWalletStatus>("disconnected");
  const [addresses, setAddresses] = useState<string[]>([]);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [selectedConnector, setSelectedConnector] = useState<PolkadotConnector | null>(null);
  const [connectors, setConnectors] = useState<PolkadotConnector[]>(polkadotConnectors);

  useEffect(() => {
    setConnectors(getInstalledConnectors());
  }, []);

  const connect = useCallback(async ({ connector }: { connector: PolkadotConnector }) => {
    try {
      if (typeof window === "undefined") {
        throw new Error("Cannot connect: window is undefined (server-side)");
      }

      setStatus("connecting");
      setError(undefined);

      if (!connector.installed) {
        throw new Error(`${connector.name} not installed or not detected`);
      }

      const { web3Enable, web3Accounts } = await import("@polkadot/extension-dapp");

      // Enable extension
      const extensions = await web3Enable("test-app");
      if (extensions.length === 0) {
        throw new Error(`User did not grant access for ${connector.name} or no extension found.`);
      }

      // Get accounts
      const accs = await web3Accounts();
      if (!accs.length) {
        throw new Error(`No accounts found in ${connector.name}.`);
      }

      setAddresses(accs.map((a) => a.address));
      setSelectedConnector(connector);
      setStatus("connected");
    } catch (err: any) {
      console.error("connect error:", err);
      setError(err);
      setStatus("disconnected");
    }
  }, []);

  const disconnect = useCallback(() => {
    setStatus("disconnected");
    setAddresses([]);
    setError(undefined);
    setSelectedConnector(null);
  }, []);

  return (
    <PolkadotWalletContext.Provider
      value={{
        status,
        addresses,
        error,
        connectors,
        connect,
        disconnect,
        selectedConnector,
      }}
    >
      {children}
    </PolkadotWalletContext.Provider>
  );
}

export function usePolkadotWalletContext() {
  return useContext(PolkadotWalletContext);
}
