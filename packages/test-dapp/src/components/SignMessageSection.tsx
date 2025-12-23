"use client";

import { useState } from "react";
import { useAccount, useSignMessage } from "wagmi";

export function SignMessageSection() {
  const { isConnected } = useAccount();
  const { signMessageAsync, isPending } = useSignMessage();

  const [message, setMessage] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  if (!isConnected) {
    return (
      <p className="text-gray-500" data-testid="sign-not-connected">
        Connect wallet to sign messages
      </p>
    );
  }

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message) return;
    try {
      setStatus("idle");
      setSignature(null);
      const sig = await signMessageAsync({ message });
      setSignature(sig);
      setStatus("success");
    } catch (error) {
      console.error("Sign failed:", error);
      setStatus("error");
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSign} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Message to Sign</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter message to sign..."
            rows={3}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            data-testid="sign-message-input"
          />
        </div>
        <button
          type="submit"
          disabled={isPending || !message}
          className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 disabled:opacity-50"
          data-testid="sign-message-submit"
        >
          {isPending ? "Signing..." : "Sign Message"}
        </button>
        {status === "success" && signature && (
          <div className="space-y-2" data-testid="sign-message-success">
            <p className="text-green-600 text-sm">Message signed successfully!</p>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Signature</label>
              <textarea
                readOnly
                value={signature}
                rows={3}
                className="w-full border border-gray-200 bg-gray-50 rounded px-3 py-2 text-xs font-mono"
                data-testid="sign-message-signature"
              />
            </div>
          </div>
        )}
        {status === "error" && (
          <p className="text-red-600 text-sm" data-testid="sign-message-error">
            Signing failed
          </p>
        )}
      </form>
    </div>
  );
}
