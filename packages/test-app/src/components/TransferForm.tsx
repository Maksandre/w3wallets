import { useState } from "react";
import { useAccount } from "@/lib/polkadot";
import Heading from "./ui/Heading";
import Button from "./ui/Button";
import Input from "./ui/Input";

const TransferForm: React.FC = () => {
  const [recipient, setRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const {} = useAccount();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
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
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          name="amount"
          placeholder="Enter amount"
        />

        <Button type="submit" variant="primary">
          Send
        </Button>
      </form>
    </div>
  );
};

export default TransferForm;
