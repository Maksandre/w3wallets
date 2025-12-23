import TestTokenArtifact from "./abi/TestToken.sol/TestToken.json";
import TestNFTArtifact from "./abi/TestNFT.sol/TestNFT.json";

// Default addresses when deployed to local Anvil with first account
// These are deterministic - same addresses every time with fresh Anvil
export const CONTRACT_ADDRESSES = {
  testToken: "0x5FbDB2315678afecb367f032d93F642f64180aa3" as const,
  testNFT: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512" as const,
};

export const TEST_TOKEN_ABI = TestTokenArtifact.abi;
export const TEST_NFT_ABI = TestNFTArtifact.abi;
