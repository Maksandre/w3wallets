import { Button, Card, Page } from "@/components/ui";
import { polkadotConnectors } from "@/features/polkadot/connectors";
import { usePolkadotWallet } from "@/features/polkadot/usePolkadotWallet";

export function PolkadotPage() {
  const { status, accounts, activeAccount, error, connect, disconnect, setActiveAccount } =
    usePolkadotWallet(polkadotConnectors);

  return (
    <Page title="Polkadot Wallet Test">
      <Card title="Wallet Connection">
        {status === "connected" ? (
          <div className="space-y-4">
            <p>
              <span className="text-gray-600">Status: </span>
              <span className="font-medium text-green-600" data-testid="connection-status">
                connected
              </span>
            </p>
            <p>
              <span className="text-gray-600">Active Account: </span>
              <code
                className="rounded bg-gray-100 px-2 py-1 text-sm break-all"
                data-testid="account-address"
              >
                {activeAccount?.address}
              </code>
            </p>

            {accounts.length > 1 && (
              <fieldset className="space-y-2">
                <legend className="text-gray-600">Select Account:</legend>
                {accounts.map((account) => (
                  <label key={account.address} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="account"
                      checked={activeAccount?.address === account.address}
                      onChange={() => setActiveAccount(account)}
                      className="size-4"
                    />
                    <code className="rounded bg-gray-100 px-2 py-1 text-sm break-all">
                      {account.address}
                    </code>
                  </label>
                ))}
              </fieldset>
            )}

            <Button variant="danger" onClick={disconnect} data-testid="disconnect-button">
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p>
              <span className="text-gray-600">Status: </span>
              <span className="text-gray-500" data-testid="connection-status">
                {status}
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {polkadotConnectors.map((connector) => {
                const installed = !!window.injectedWeb3?.[connector.uid];
                return (
                  <Button
                    key={connector.uid}
                    variant={installed ? "primary" : "neutral"}
                    disabled={!installed || status === "connecting"}
                    onClick={() => void connect(connector)}
                    data-testid={`connector-${connector.uid}`}
                  >
                    {connector.name}
                    {!installed && " (not installed)"}
                  </Button>
                );
              })}
            </div>
            {error && <p className="text-sm text-red-500">{error.message}</p>}
          </div>
        )}
      </Card>
    </Page>
  );
}
