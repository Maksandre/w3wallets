const isDebug = () => process.env.W3WALLETS_DEBUG === "true";

export function debug(message: string): void {
  if (!isDebug()) return;
  const ts = new Date().toISOString();
  console.log(`[w3wallets ${ts}] ${message}`);
}
