import dotenv from "dotenv";
import { privateKeyToAccount } from "viem/accounts";
dotenv.config();

const ANVIL_URL = "http://127.0.0.1:8545";
const ETH_10 = "0x8AC7230489E80000"; // 10 ETH in hex wei

async function setBalance(address: string, amount: string) {
  const res = await fetch(ANVIL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "anvil_setBalance",
      params: [address, amount],
      id: 1,
    }),
  });
  const json = (await res.json()) as { error?: { message: string } };
  if (json.error)
    throw new Error(`anvil_setBalance failed: ${json.error.message}`);
}

export default async function globalSetup() {
  const keys = [
    process.env.ETHEREUM_PRIVATE_KEY1,
    process.env.ETHEREUM_PRIVATE_KEY2,
  ].filter(Boolean) as string[];

  for (const key of keys) {
    const address = privateKeyToAccount(key as `0x${string}`).address;
    await setBalance(address, ETH_10);
  }
}
