import { useState } from "react";
import { useAccount } from "@/lib/polkadot";
import Heading from "@/components/ui/Heading";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { usePAPI } from "@/lib/polkadot/PAPIProvider";
import { MultiAddress } from "@polkadot-api/descriptors";
import Text from "./ui/Text";

const TransferForm: React.FC = () => {
  const [recipient, setRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [sending, setSending] = useState(false);
  const { api } = usePAPI();
  const { activeAccount } = useAccount();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    if (!api || !activeAccount) return;

    const tx = api.tx.Balances.transfer_keep_alive({
      dest: MultiAddress.Id(recipient),
      value: BigInt(amount),
    });

    tx.signSubmitAndWatch(activeAccount.polkadotSigner).subscribe((ev) => {
      if (
        ev.type === "finalized" ||
        (ev.type === "txBestBlocksState" && ev.found)
      ) {
        setSending(false);
      }
    });
  };

  return (
    <div>
      <Heading level={2}>Transfer</Heading>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          required
          name="recipient"
          placeholder="Enter recipient address"
        />

        <Input
          type="number"
          value={amount.toString()}
          onChange={(e) => setAmount(e.target.value)}
          required
          name="amount"
          placeholder="Enter amount"
        />

        <Button type="submit" variant="primary">
          Send
        </Button>

        {sending && <Text>Sending...</Text>}
      </form>
    </div>
  );
};

export default TransferForm;
