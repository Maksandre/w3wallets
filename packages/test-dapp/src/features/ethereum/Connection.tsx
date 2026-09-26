import { anvil } from "wagmi/chains";
import {
  useConnect,
  useConnection,
  useConnectors,
  useDisconnect,
} from "wagmi";
import { Button } from "@/components/ui";

export function Connection() {
  const { address, isConnected } = useConnection();
  const connectors = useConnectors();
  const connect = useConnect();
  const disconnect = useDisconnect();

  if (isConnected) {
    return (
      <div className="space-y-4">
        <p>
          <span className="text-gray-600">Status: </span>
          <span className="font-medium text-green-600" data-testid="connection-status">
            connected
          </span>
        </p>
        <p>
          <span className="text-gray-600">Address: </span>
          <code className="rounded bg-gray-100 px-2 py-1" data-testid="account-address">
            {address}
          </code>
        </p>
        <Button variant="danger" onClick={() => disconnect.mutate({})} data-testid="disconnect-button">
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p>
        <span className="text-gray-600">Status: </span>
        <span className="text-gray-500" data-testid="connection-status">
          disconnected
        </span>
      </p>
      {connectors.length === 0 ? (
        <p className="text-sm text-gray-500">No wallet extension detected.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {connectors.map((connector) => (
            <Button
              key={connector.uid}
              variant="neutral"
              disabled={connect.isPending}
              // Connect straight to the local chain: the wallet asks to
              // connect, then to add/switch to Anvil.
              onClick={() => connect.mutate({ connector, chainId: anvil.id })}
              data-testid={`connector-${connector.id}`}
            >
              {connector.name}
            </Button>
          ))}
        </div>
      )}
      {connect.error && (
        <p className="text-sm text-red-600" data-testid="connect-error">
          {connect.error.message}
        </p>
      )}
    </div>
  );
}
