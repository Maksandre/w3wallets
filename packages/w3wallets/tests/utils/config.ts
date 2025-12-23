import dotenv from "dotenv";
dotenv.config();

const getConfig = () => {
  const {
    ETHEREUM_PRIVATE_KEY1,
    ETHEREUM_PRIVATE_KEY2,
    ETHEREUM_MNEMONIC1,
    ETHEREUM_MNEMONIC2,
    SUBSTRATE_SEED,
  } = process.env;

  if (
    !ETHEREUM_PRIVATE_KEY1 ||
    !ETHEREUM_PRIVATE_KEY2 ||
    !SUBSTRATE_SEED ||
    !ETHEREUM_MNEMONIC1 ||
    !ETHEREUM_MNEMONIC2
  )
    throw Error("Did you forget to set .env?");

  return {
    account1: {
      mnemonic: ETHEREUM_MNEMONIC1,
      privateKey: ETHEREUM_PRIVATE_KEY1,
    },
    account2: {
      mnemonic: ETHEREUM_MNEMONIC2,
      privateKey: ETHEREUM_PRIVATE_KEY2,
    },
    ethMnemonic: ETHEREUM_MNEMONIC1,
    substrateSeed: SUBSTRATE_SEED,
    baseURL: "http://127.0.0.1:3000",
  };
};

export default getConfig();
