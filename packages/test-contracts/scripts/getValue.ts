import { ethers } from "hardhat";
import { SimpleStorage__factory } from "../typechain-types";

async function main() {
  const simpleStorage = SimpleStorage__factory.connect("");
  await simpleStorage.waitForDeployment();

  console.log("SimpleStorage deployed to:", await simpleStorage.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
