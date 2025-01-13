import { task } from "hardhat/config";
import { SimpleStorage__factory } from "../typechain-types";

task("s-deploy", "Deploys SimpleStorage contract").setAction(async (_, hre) => {
  const SimpleStorageFactory =
    await hre.ethers.getContractFactory("SimpleStorage");
  const simpleStorage = await SimpleStorageFactory.deploy({});
  await simpleStorage.waitForDeployment();

  console.log("SimpleStorage deployed to:", await simpleStorage.getAddress());
});

task("s-set", "Set SimpleStorage value")
  .addParam("addr", "Storage address")
  .addParam("value", "Storage new value")
  .setAction(async (taskArgs, hre) => {
    if (!taskArgs.addr) {
      console.log("provide --addr param");
      process.exit(1);
    }

    if (!taskArgs.value) {
      console.log("provide --value param");
      process.exit(1);
    }

    const [signer] = await hre.ethers.getSigners();
    console.log("Signer:", signer.address);

    const simpleStorage = SimpleStorage__factory.connect(taskArgs.addr, signer);
    const value = await simpleStorage.setValue(taskArgs.value);

    console.log("SimpleStorage value:", value);
  });

task("s-get", "Get SimpleStorage value")
  .addParam("addr", "Storage address")
  .setAction(async (taskArgs, hre) => {
    if (!taskArgs.addr) {
      console.log("provide --addr param");
      process.exit(1);
    }

    const simpleStorage = SimpleStorage__factory.connect(
      taskArgs.addr,
      hre.ethers.provider
    );
    const value = await simpleStorage.getValue();

    console.log("SimpleStorage value:", value);
  });
