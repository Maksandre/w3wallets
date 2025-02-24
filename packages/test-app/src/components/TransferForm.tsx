import { useEffect, useState } from "react";
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
  const [status, setStatus] = useState("");
  const { api } = usePAPI();
  const { activeAccount } = useAccount();

  useEffect(() => {
    if (status === "Success") {
      setTimeout(() => {
        setStatus("");
      }, 3000);
    } 
  }, [status]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("Pending...");
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
        setStatus("Success");
      }
    });
  };

  return (
    <div data-testid="transfer-form">
      <Heading level={2} data-testid="transfer-heading">Transfer</Heading>

      <form onSubmit={handleSubmit} className="space-y-4" data-testid="transfer-form-container">
        <Input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          required
          name="recipient"
          placeholder="Recipient"
          data-testid="transfer-recipient-input"
        />

        <Input
          type="number"
          value={amount.toString()}
          onChange={(e) => setAmount(e.target.value)}
          required
          name="amount"
          placeholder="Amount"
          data-testid="transfer-amount-input"
        />

        <Button type="submit" variant="primary" data-testid="transfer-submit-button">
          Send
        </Button>

        {status && <Text testId="transfer-status">{status}</Text>}
      </form>
    </div>
  );
};

export default TransferForm;
