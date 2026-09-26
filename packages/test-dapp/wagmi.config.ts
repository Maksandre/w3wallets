import { defineConfig } from "@wagmi/cli";
import { foundry } from "@wagmi/cli/plugins";

// Generates typed ABIs and addresses from the Foundry build: `yarn generate`.
export default defineConfig({
  out: "src/generated.ts",
  plugins: [
    foundry({
      project: ".",
      include: ["TestToken.sol/**", "TestNFT.sol/**"],
      // Deterministic addresses: the first two deployments from Anvil's
      // default account on a fresh chain (see script/Deploy.s.sol).
      deployments: {
        TestToken: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        TestNFT: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
      },
    }),
  ],
});
