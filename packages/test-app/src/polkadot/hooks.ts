import { usePolkadotWalletContext } from './PolkadotWalletProvider';
import type { PolkadotConnector } from './connectors';

interface ConnectArgs {
  connector: PolkadotConnector;
}

export function useAccount() {
  const { status, addresses } = usePolkadotWalletContext();
  return {
    status,
    addresses,
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
