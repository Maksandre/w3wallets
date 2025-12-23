import config from "./utils/config";
import { metamaskTest, expect } from "./fixtures/metamask-fixture";
import { EthereumPage } from "./POM";

const password = "TestPassword123!";

metamaskTest.describe("Metamask connect", () => {
  metamaskTest("Can connect to dApp and approve", async ({ ethereumPage }) => {
    await ethereumPage.assertConnectionStatus("connected");
  });

  metamaskTest("Can deny connection request", async ({ page, metamask }) => {
    const ethereumPage = new EthereumPage(page);
    await ethereumPage.goto();

    await ethereumPage.connectMetaMask();
    await metamask.deny();

    await ethereumPage.assertConnectionStatus("disconnected");
  });

  metamaskTest("Can disconnect from dApp", async ({ ethereumPage }) => {
    await ethereumPage.assertConnectionStatus("connected");

    await ethereumPage.disconnectWallet();

    await ethereumPage.assertConnectionStatus("disconnected");
  });
});

metamaskTest.describe("Metamask: Message", () => {
  metamaskTest(
    "Can sign message and approve",
    async ({ ethereumPage, metamask }) => {
      await ethereumPage.signMessage("Hello, Web3!");
      await metamask.approve();

      await ethereumPage.assertSignatureSuccess();
    },
  );

  metamaskTest(
    "Can deny signature request",
    async ({ ethereumPage, metamask }) => {
      await ethereumPage.signMessage("I will deny this");
      await metamask.deny();

      await ethereumPage.assertSignatureError();
    },
  );
});

metamaskTest.describe("Metamask: inside", async () => {
  metamaskTest(
    "Can import account and switch between accounts",
    async ({ metamask }) => {
      await metamask.accountNameIs("Account 1");
      await metamask.importAccount(config.account2.privateKey);
      await metamask.accountNameIs("Imported Account");

      await metamask.switchAccount("Account 1");
      await metamask.accountNameIs("Account 1");
    },
  );

  metamaskTest("Can connect to existing network", async ({ metamask }) => {
    await metamask.switchNetwork("Arbitrum");
  });

  metamaskTest("Can connect to existing testnet", async ({ metamask }) => {
    await metamask.enableTestNetworks();
    await metamask.switchNetwork("MegaETH Testnet", "Custom");
  });

  metamaskTest("Can unlock after lock", async ({ metamask }) => {
    await metamask.lock();
    await metamask.unlock(password);

    await expect(
      metamask.page.getByTestId("account-options-menu-button"),
    ).toBeVisible();
  });

  metamaskTest(
    "Can add a custom network and switch account",
    async ({ metamask }) => {
      await metamask.addCustomNetwork({
        chainId: 123420001114,
        currencySymbol: "CAMP",
        name: "Basecamp",
        rpc: "https://rpc-campnetwork.xyz",
      });
    },
  );

  metamaskTest(
    "Can add a custom network and an existing network",
    async ({ metamask }) => {
      await metamask.addCustomNetwork({
        chainId: 123420001114,
        currencySymbol: "CAMP",
        name: "Basecamp",
        rpc: "https://rpc-campnetwork.xyz",
      });
      await metamask.enableTestNetworks();
      await metamask.switchNetwork("MegaETH Testnet", "Custom");
    },
  );
});
