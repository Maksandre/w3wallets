import { useChainId } from "wagmi";
import { anvil } from "wagmi/chains";
import { Card, Page } from "@/components/ui";
import { Connection } from "@/features/ethereum/Connection";
import { Network } from "@/features/ethereum/Network";
import { Nft } from "@/features/ethereum/Nft";
import { SignMessage } from "@/features/ethereum/SignMessage";
import { Token } from "@/features/ethereum/Token";

function Standard({ name, standard }: { name: string; standard: string }) {
  return (
    <>
      {name} <span className="font-normal text-gray-500">({standard})</span>
    </>
  );
}

export function EthereumPage() {
  // The test contracts only exist on the local Anvil chain.
  const isAnvil = useChainId() === anvil.id;

  return (
    <Page title="W3Wallets Test DApp">
      <Card title="Wallet Connection">
        <Connection />
      </Card>
      <Card title="Network">
        <Network />
      </Card>
      {isAnvil && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card title={<Standard name="TestToken" standard="ERC-20" />}>
            <Token />
          </Card>
          <Card title={<Standard name="TestNFT" standard="ERC-721" />}>
            <Nft />
          </Card>
        </div>
      )}
      <Card title="Sign Message">
        <SignMessage />
      </Card>
    </Page>
  );
}
