import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import type { InjectedPolkadotAccount } from "polkadot-api/pjs-signer";
import { polkadotConnectors, PolkadotConnector, getInstalledConnectors } from "./connectors";

const STORAGE_KEY_ACTIVE_ACCOUNT = "polkadot_active_account";
const STORAGE_KEY_SELECTED_CONNECTOR = "polkadot_selected_connector";

type PolkadotWalletStatus = "disconnected" | "connecting" | "connected";

interface PolkadotWalletState {
  status: PolkadotWalletStatus;
  accounts: InjectedPolkadotAccount[];
  activeAccount?: InjectedPolkadotAccount;
  error?: Error;
  selectedConnector?: PolkadotConnector | null;
}

interface PolkadotWalletContextType extends PolkadotWalletState {
  connectors: PolkadotConnector[];
  connect: (opts: { connector: PolkadotConnector }) => Promise<void>;
  disconnect: () => void;
  setActiveAccount: (account: InjectedPolkadotAccount) => void;
}

const PolkadotWalletContext = createContext<PolkadotWalletContextType>({
  status: "disconnected",
  accounts: [],
  activeAccount: undefined,
  connectors: polkadotConnectors,
  connect: async () => undefined,
  disconnect: () => undefined,
  setActiveAccount: () => undefined,
  selectedConnector: null,
});

export function PolkadotWalletProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<PolkadotWalletStatus>("disconnected");
  const [accounts, setAccounts] = useState<InjectedPolkadotAccount[]>([]);
  const [activeAccount, setActiveAccountState] = useState<InjectedPolkadotAccount | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [selectedConnector, setSelectedConnector] = useState<PolkadotConnector | null>(null);
  const [connectors, setConnectors] = useState<PolkadotConnector[]>(polkadotConnectors);

  // Update the connector list on mount (and when needed)
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

      // Dynamically import the pjs-signer functions.
      const { getInjectedExtensions, connectInjectedExtension } = await import("polkadot-api/pjs-signer");

      // Get the list of installed extensions.
      const availableExtensions: string[] = getInjectedExtensions();

      // Check if the chosen connector is available.
      if (!availableExtensions.includes(connector.uid)) {
        throw new Error(`${connector.name} not installed or not detected`);
      }

      // Connect to the chosen extension.
      const extension = await connectInjectedExtension(connector.uid);
      if (!extension) {
        throw new Error(`Failed to connect to ${connector.name}`);
      }

      // Retrieve accounts from the extension.
      const fetchedAccounts = extension.getAccounts();
      if (!fetchedAccounts.length) {
        throw new Error(`No accounts found in ${connector.name}.`);
      }

      // Map accounts to include our signer.
      const extendedAccounts: InjectedPolkadotAccount[] = fetchedAccounts.map((acc) => ({
        ...acc,
        signer: acc.polkadotSigner,
      }));

      setAccounts(extendedAccounts);
      setSelectedConnector(connector);
      setStatus("connected");

      // Store the selected connector uid for auto-reconnection.
      localStorage.setItem(STORAGE_KEY_SELECTED_CONNECTOR, connector.uid);

      // Restore an active account from localStorage if possible.
      const storedActiveAddress = localStorage.getItem(STORAGE_KEY_ACTIVE_ACCOUNT);
      let chosenAccount: InjectedPolkadotAccount;
      if (storedActiveAddress) {
        const found = extendedAccounts.find((a) => a.address === storedActiveAddress);
        chosenAccount = found || extendedAccounts[0];
      } else {
        chosenAccount = extendedAccounts[0];
      }
      setActiveAccountState(chosenAccount);
      localStorage.setItem(STORAGE_KEY_ACTIVE_ACCOUNT, chosenAccount.address);
    } catch (err: any) {
      console.error("connect error:", err);
      setError(err);
      setStatus("disconnected");
    }
  }, []);

  const disconnect = useCallback(() => {
    setStatus("disconnected");
    setAccounts([]);
    setError(undefined);
    setSelectedConnector(null);
    setActiveAccountState(undefined);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_ACCOUNT);
    localStorage.removeItem(STORAGE_KEY_SELECTED_CONNECTOR);
  }, []);

  const setActiveAccount = useCallback(
    (account: InjectedPolkadotAccount) => {
      if (!accounts.find((a) => a.address === account.address)) return;
      setActiveAccountState(account);
      localStorage.setItem(STORAGE_KEY_ACTIVE_ACCOUNT, account.address);
    },
    [accounts]
  );

  // Auto-reconnect if a connector was stored from a previous session.
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedConnectorUid = localStorage.getItem(STORAGE_KEY_SELECTED_CONNECTOR);
      if (storedConnectorUid) {
        const storedConnector = connectors.find((conn) => conn.uid === storedConnectorUid);
        if (storedConnector) {
          connect({ connector: storedConnector });
        }
      }
    }
  }, [connect, connectors]);

  return (
    <PolkadotWalletContext.Provider
      value={{
        status,
        accounts,
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
