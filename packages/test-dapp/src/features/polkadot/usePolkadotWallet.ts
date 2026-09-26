import { useCallback, useEffect, useState } from "react";
import {
  connectInjectedExtension,
  getInjectedExtensions,
  type InjectedPolkadotAccount,
} from "polkadot-api/pjs-signer";
import type { PolkadotConnector } from "./connectors";

const DAPP_NAME = "W3Wallets Test DApp";
const STORAGE_KEY_ACCOUNT = "polkadot_active_account";
const STORAGE_KEY_CONNECTOR = "polkadot_selected_connector";

export type PolkadotWalletStatus = "disconnected" | "connecting" | "connected";

export function usePolkadotWallet(connectors: PolkadotConnector[]) {
  const [status, setStatus] = useState<PolkadotWalletStatus>("disconnected");
  const [accounts, setAccounts] = useState<InjectedPolkadotAccount[]>([]);
  const [activeAccount, setActiveAccountState] = useState<InjectedPolkadotAccount>();
  const [error, setError] = useState<Error>();

  const connect = useCallback(async (connector: PolkadotConnector) => {
    setStatus("connecting");
    setError(undefined);
    try {
      if (!getInjectedExtensions().includes(connector.uid)) {
        throw new Error(`${connector.name} not installed or not detected`);
      }
      const extension = await connectInjectedExtension(connector.uid, DAPP_NAME);
      const found = extension.getAccounts();
      if (found.length === 0) {
        throw new Error(`No accounts found in ${connector.name}.`);
      }

      const storedAddress = localStorage.getItem(STORAGE_KEY_ACCOUNT);
      const active = found.find((a) => a.address === storedAddress) ?? found[0]!;

      setAccounts(found);
      setActiveAccountState(active);
      setStatus("connected");
      localStorage.setItem(STORAGE_KEY_CONNECTOR, connector.uid);
      localStorage.setItem(STORAGE_KEY_ACCOUNT, active.address);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setStatus("disconnected");
    }
  }, []);

  const disconnect = useCallback(() => {
    setStatus("disconnected");
    setAccounts([]);
    setActiveAccountState(undefined);
    setError(undefined);
    localStorage.removeItem(STORAGE_KEY_ACCOUNT);
    localStorage.removeItem(STORAGE_KEY_CONNECTOR);
  }, []);

  const setActiveAccount = useCallback((account: InjectedPolkadotAccount) => {
    setActiveAccountState(account);
    localStorage.setItem(STORAGE_KEY_ACCOUNT, account.address);
  }, []);

  // Restore the previous session after a reload.
  useEffect(() => {
    const storedUid = localStorage.getItem(STORAGE_KEY_CONNECTOR);
    const stored = connectors.find((c) => c.uid === storedUid);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with the extension, an external system
    if (stored) void connect(stored);
  }, [connect, connectors]);

  return { status, accounts, activeAccount, error, connect, disconnect, setActiveAccount };
}
