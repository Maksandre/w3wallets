import { prepareWallet, metamask } from "../../src";
import config from "../utils/config";

const password = "TestPassword123!";

export default prepareWallet(metamask, async (wallet, page) => {
  await wallet.onboard(config.ethMnemonic, password);
});
