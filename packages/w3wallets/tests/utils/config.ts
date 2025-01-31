import dotenv from "dotenv";
dotenv.config();

const getConfig = () => {
  const { ETHEREUM_PRIVATE_KEY } = process.env;

  if (!ETHEREUM_PRIVATE_KEY) throw Error("Did you forget to set .env?");

  return {
    ethPrivateKey: ETHEREUM_PRIVATE_KEY,
    baseURL: "http://127.0.0.1:3000",
  };
};

export default getConfig();
