import { useState } from "react";
import { useAccount } from "@/lib/polkadot";

const TransferForm: React.FC = () => {
  const [recipient, setRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const {} = useAccount();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    console.log("Sending", { recipient, amount });
    // Handle the send logic here
  };

  return (
    <>
      <h2>Transfer</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          required
          placeholder="Recipient"
        />

        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          placeholder="Amount"
        />

        <button type="submit">Send</button>
      </form>
    </>
  );
};

export default TransferForm;
