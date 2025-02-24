import { usePolkadotWalletContext } from "./PolkadotWalletProvider";
import type { PolkadotConnector } from "./connectors";

interface ConnectArgs {
  connector: PolkadotConnector;
}

export function useAccount() {
  const { status, accounts, activeAccount, setActiveAccount } = usePolkadotWalletContext();
  return {
    status,
    accounts,
    activeAccount,
    setActiveAccount,
  };
}

export function useConnect() {
  const { connectors, connect, status, error } = usePolkadotWalletContext();

  return {
    connectors,
    connect: (args: ConnectArgs) => connect(args),
    status,
    error,
  };
}

export function useDisconnect() {
  const { disconnect } = usePolkadotWalletContext();

  return {
    disconnect,
  };
}

export function useActiveAccount() {
  const { activeAccount, setActiveAccount } = usePolkadotWalletContext();
  return {
    activeAccount,
    setActiveAccount,
  };
}
