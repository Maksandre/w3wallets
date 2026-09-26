import { useState, type FormEvent } from "react";
import { useConnection, useSignMessage } from "wagmi";
import { Button, Muted, Result } from "@/components/ui";

export function SignMessage() {
  const { isConnected } = useConnection();
  const sign = useSignMessage();
  const [message, setMessage] = useState("");

  if (!isConnected) {
    return <Muted testId="sign-not-connected">Connect wallet to sign messages</Muted>;
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message) sign.mutate({ message });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm text-gray-600">Message to Sign</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter message to sign..."
          rows={3}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          data-testid="sign-message-input"
        />
      </label>
      <Button
        type="submit"
        variant="info"
        disabled={sign.isPending || !message}
        data-testid="sign-message-submit"
      >
        {sign.isPending ? "Signing..." : "Sign Message"}
      </Button>
      {sign.isSuccess && (
        <div className="space-y-2" data-testid="sign-message-success">
          <p className="text-sm text-green-600">Message signed successfully!</p>
          <label className="block">
            <span className="mb-1 block text-sm text-gray-600">Signature</span>
            <textarea
              readOnly
              value={sign.data}
              rows={3}
              className="w-full rounded border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs"
              data-testid="sign-message-signature"
            />
          </label>
        </div>
      )}
      {sign.isError && (
        <Result ok={false} testId="sign-message-error">
          Signing failed
        </Result>
      )}
    </form>
  );
}
