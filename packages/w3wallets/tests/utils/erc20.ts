import {
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
  formatUnits,
  type Address,
} from "viem";
import { privateKeyToAccount, mnemonicToAccount } from "viem/accounts";
import { anvil } from "viem/chains";
import config from "./config";

const TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3" as const;
const DECIMALS = 18;

const TEST_TOKEN_ABI = [
  {
    type: "function",
    name: "mint",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "burnAll",
    inputs: [{ name: "target", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

const publicClient = createPublicClient({
  chain: anvil,
  transport: http("http://127.0.0.1:8545"),
});

export function getTestWalletAddress(): Address {
  const account = mnemonicToAccount(config.ethMnemonic);
  return account.address;
}

function getWalletClient(privateKey?: string) {
  const key = privateKey ?? config.account1.privateKey;
  const account = privateKeyToAccount(key as `0x${string}`);
  return createWalletClient({
    account,
    chain: anvil,
    transport: http("http://127.0.0.1:8545"),
  });
}

export async function mintTokens(
  to: Address,
  amount: bigint,
  privateKey?: string,
): Promise<void> {
  const walletClient = getWalletClient(privateKey);

  const hash = await walletClient.writeContract({
    address: TOKEN_ADDRESS,
    abi: TEST_TOKEN_ABI,
    functionName: "mint",
    args: [to, amount],
  });

  await publicClient.waitForTransactionReceipt({ hash });
}

export async function burnAllTokens(
  target: Address,
  privateKey?: string,
): Promise<void> {
  const walletClient = getWalletClient(privateKey);

  const hash = await walletClient.writeContract({
    address: TOKEN_ADDRESS,
    abi: TEST_TOKEN_ABI,
    functionName: "burnAll",
    args: [target],
  });

  await publicClient.waitForTransactionReceipt({ hash });
}

export async function approveTokens(
  spender: Address,
  amount: string,
  privateKey?: string,
): Promise<void> {
  const walletClient = getWalletClient(privateKey);
  const parsedAmount = parseUnits(amount, DECIMALS);

  const hash = await walletClient.writeContract({
    address: TOKEN_ADDRESS,
    abi: TEST_TOKEN_ABI,
    functionName: "approve",
    args: [spender, parsedAmount],
  });

  await publicClient.waitForTransactionReceipt({ hash });
}

export async function getTokenBalance(account: Address): Promise<string> {
  const balance = await publicClient.readContract({
    address: TOKEN_ADDRESS,
    abi: TEST_TOKEN_ABI,
    functionName: "balanceOf",
    args: [account],
  });

  return formatUnits(balance, DECIMALS);
}

export async function getTokenAllowance(
  owner: Address,
  spender: Address,
): Promise<string> {
  const allowance = await publicClient.readContract({
    address: TOKEN_ADDRESS,
    abi: TEST_TOKEN_ABI,
    functionName: "allowance",
    args: [owner, spender],
  });

  return formatUnits(allowance, DECIMALS);
}
