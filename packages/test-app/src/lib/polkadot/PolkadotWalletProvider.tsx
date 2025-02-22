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
  activeAccount?: string;
  error?: Error;
  selectedConnector?: PolkadotConnector | null;
}

interface PolkadotWalletContextType extends PolkadotWalletState {
  connectors: PolkadotConnector[];
  connect: (opts: { connector: PolkadotConnector }) => Promise<void>;
  disconnect: () => void;
  setActiveAccount: (address: string) => void;
}

const STORAGE_KEY_ACCOUNTS = "polkadot_accounts";
const STORAGE_KEY_ACTIVE_ACCOUNT = "polkadot_active_account";

const PolkadotWalletContext = createContext<PolkadotWalletContextType>({
  status: "disconnected",
  addresses: [],
  activeAccount: undefined,
  connectors: polkadotConnectors,
  connect: async () => undefined,
  disconnect: () => undefined,
  setActiveAccount: () => undefined,
  selectedConnector: null,
});

export function PolkadotWalletProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<PolkadotWalletStatus>("disconnected");
  const [addresses, setAddresses] = useState<string[]>([]);
  const [activeAccount, setActiveAccountState] = useState<string | undefined>(() => {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_ACCOUNT) || undefined;
  });
  const [error, setError] = useState<Error | undefined>(undefined);
  const [selectedConnector, setSelectedConnector] = useState<PolkadotConnector | null>(null);
  const [connectors, setConnectors] = useState<PolkadotConnector[]>(polkadotConnectors);

  useEffect(() => {
    setConnectors(getInstalledConnectors());

    // Load stored accounts
    const storedAccounts = JSON.parse(localStorage.getItem(STORAGE_KEY_ACCOUNTS) || "[]");
    if (storedAccounts.length > 0) {
      setAddresses(storedAccounts);
      setStatus("connected");

      const storedActive = localStorage.getItem(STORAGE_KEY_ACTIVE_ACCOUNT);
      if (storedActive && storedAccounts.includes(storedActive)) {
        setActiveAccountState(storedActive);
      } else {
        setActiveAccountState(storedAccounts[0]);
        localStorage.setItem(STORAGE_KEY_ACTIVE_ACCOUNT, storedAccounts[0]);
      }
    }
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

      const extensions = await web3Enable("test-app");
      if (extensions.length === 0) {
        throw new Error(`User did not grant access for ${connector.name} or no extension found.`);
      }

      const accs = await web3Accounts();
      if (!accs.length) {
        throw new Error(`No accounts found in ${connector.name}.`);
      }

      const accountAddresses = accs.map((a) => a.address);
      setAddresses(accountAddresses);
      setSelectedConnector(connector);
      setStatus("connected");

      localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accountAddresses));

      const storedActive = localStorage.getItem(STORAGE_KEY_ACTIVE_ACCOUNT);
      if (!storedActive) {
        setActiveAccountState(accountAddresses[0]);
        localStorage.setItem(STORAGE_KEY_ACTIVE_ACCOUNT, accountAddresses[0]);
      }
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
    setActiveAccountState(undefined);

    localStorage.removeItem(STORAGE_KEY_ACCOUNTS);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_ACCOUNT);
  }, []);

  const setActiveAccount = useCallback((address: string) => {
    if (!addresses.includes(address)) return;
    setActiveAccountState(address);
    localStorage.setItem(STORAGE_KEY_ACTIVE_ACCOUNT, address);
  }, [addresses]);

  return (
    <PolkadotWalletContext.Provider
      value={{
        status,
        addresses,
        activeAccount,
        error,
        connectors,
        connect,
        disconnect,
        setActiveAccount,
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
