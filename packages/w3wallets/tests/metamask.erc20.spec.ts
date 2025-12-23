import { metamaskTest, expect } from "./fixtures/metamask-fixture";
import {
  burnAllTokens,
  approveTokens,
  getTestWalletAddress,
  mintTokens,
} from "./utils/erc20";

// Test addresses from the first two Ethereum accounts
const RECIPIENT_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Second account from mnemonic
const SPENDER_ADDRESS = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"; // Third account from mnemonic

metamaskTest.describe("Metamask: ERC-20", () => {
  metamaskTest.beforeEach(async () => {
    const testWalletAddress = getTestWalletAddress();

    // Reset test state: burn all tokens and clear approvals
    await burnAllTokens(testWalletAddress);
    await burnAllTokens(RECIPIENT_ADDRESS);
    await approveTokens(SPENDER_ADDRESS, "0");
  });

  metamaskTest(
    "Can mint tokens and see balance update",
    async ({ metamask, ethereumPage }) => {
      // Get initial balance
      const initialBalanceText = await ethereumPage.getTokenBalance();
      const initialBalance = parseFloat(initialBalanceText);

      // Click mint button
      await ethereumPage.mintTokens();

      // Approve minting in MetaMask
      await metamask.approve();

      // Wait for transaction to complete by checking balance update
      await expect(async () => {
        const newBalanceText = await ethereumPage.getTokenBalance();
        const newBalance = parseFloat(newBalanceText);
        expect(newBalance).toBeGreaterThan(initialBalance);
      }).toPass({ timeout: 30000 });
    },
  );

  metamaskTest(
    "Can transfer tokens successfully",
    async ({ metamask, ethereumPage }) => {
      const BALANCE_BEFORE = 1000n * 10n ** 18n;
      await mintTokens(getTestWalletAddress(), BALANCE_BEFORE);
      // Fill transfer form
      await ethereumPage.transferTokens(RECIPIENT_ADDRESS, "100");

      // Approve transfer in MetaMask
      await metamask.approve();

      // Wait for success message
      await ethereumPage.assertTokenTransferSuccess();

      // Verify balance decreased
      await expect(async () => {
        const balanceAfterText = await ethereumPage.getTokenBalance();
        const balanceAfter = parseFloat(balanceAfterText);
        expect(balanceAfter).toEqual(900);
      }).toPass();
    },
  );

  metamaskTest(
    "Can deny transfer transaction",
    async ({ metamask, ethereumPage }) => {
      // Get balance before transfer attempt
      const balanceBeforeText = await ethereumPage.getTokenBalance();
      const balanceBefore = parseFloat(balanceBeforeText);

      // Fill transfer form
      await ethereumPage.transferTokens(RECIPIENT_ADDRESS, "50");

      // Deny transfer in MetaMask
      await metamask.deny();

      // Wait for error message
      await ethereumPage.assertTokenTransferError();

      // Verify balance remained the same
      const balanceAfterText = await ethereumPage.getTokenBalance();
      const balanceAfter = parseFloat(balanceAfterText);
      expect(balanceAfter).toBe(balanceBefore);
    },
  );

  metamaskTest(
    "Shows error when transferring without sufficient balance",
    async ({ metamask, ethereumPage }) => {
      // Try to transfer more tokens than available (assuming fresh wallet with 0 balance)
      await ethereumPage.transferTokens(RECIPIENT_ADDRESS, "999999");

      // Approve in MetaMask (transaction should fail on-chain)
      await metamask.approve();

      // Wait for error message
      await ethereumPage.assertTokenTransferError();
    },
  );

  metamaskTest(
    "Can approve spender and view allowance",
    async ({ metamask, ethereumPage }) => {
      // Fill approve form
      await ethereumPage.approveTokens(SPENDER_ADDRESS, "500");

      // Wait for allowance to load (will be 0 or null initially)
      await expect(ethereumPage.locators.tokenAllowance).toBeVisible({
        timeout: 5000,
      });

      // Approve in MetaMask
      await metamask.approve();

      // Wait for success message
      await ethereumPage.assertTokenApprovalSuccess();

      // Verify allowance is updated
      await expect(async () => {
        const allowanceText =
          await ethereumPage.locators.tokenAllowance.textContent();
        const allowance = parseFloat(allowanceText || "0");
        expect(allowance).toBeCloseTo(500, 1);
      }).toPass();
    },
  );

  metamaskTest(
    "Can deny approval transaction",
    async ({ ethereumPage, metamask }) => {
      // Fill approve form
      await ethereumPage.approveTokens(SPENDER_ADDRESS, "300");

      // Wait for initial allowance
      await expect(ethereumPage.locators.tokenAllowance).toBeVisible({
        timeout: 5000,
      });
      const initialAllowanceText =
        await ethereumPage.locators.tokenAllowance.textContent();
      const initialAllowance = parseFloat(initialAllowanceText || "0");

      // Deny in MetaMask
      await metamask.deny();

      // Wait for error message
      await expect(ethereumPage.locators.tokenApproveError).toBeVisible({
        timeout: 10000,
      });

      // Verify allowance remained the same
      const allowanceAfterText =
        await ethereumPage.locators.tokenAllowance.textContent();
      const allowanceAfter = parseFloat(allowanceAfterText || "0");
      expect(allowanceAfter).toBe(initialAllowance);
    },
  );

  metamaskTest(
    "Can update existing allowance",
    async ({ ethereumPage, metamask }) => {
      // First set an allowance
      await ethereumPage.approveTokens(SPENDER_ADDRESS, "100");
      await metamask.approve();

      await ethereumPage.assertTokenApprovalSuccess();

      // Verify first allowance
      await expect(async () => {
        const allowanceText =
          await ethereumPage.locators.tokenAllowance.textContent();
        const allowance = parseFloat(allowanceText || "0");
        expect(allowance).toBeCloseTo(100, 1);
      }).toPass();

      // Update the allowance to a higher value
      await ethereumPage.approveTokens(SPENDER_ADDRESS, "250");
      await metamask.approve();

      await ethereumPage.assertTokenApprovalSuccess();

      // Verify updated allowance
      await expect(async () => {
        const allowanceText =
          await ethereumPage.locators.tokenAllowance.textContent();
        const allowance = parseFloat(allowanceText || "0");
        expect(allowance).toBeCloseTo(250, 1);
      }).toPass();
    },
  );

  metamaskTest(
    "Can set allowance to zero",
    async ({ ethereumPage, metamask }) => {
      // First set a non-zero allowance
      await ethereumPage.approveTokens(SPENDER_ADDRESS, "200");
      await metamask.approve();

      await ethereumPage.assertTokenApprovalSuccess();

      // Set allowance to zero
      await ethereumPage.approveTokens(SPENDER_ADDRESS, "0");
      await metamask.approve();

      await ethereumPage.assertTokenApprovalSuccess();

      // Verify allowance is zero
      await expect(async () => {
        const allowanceText =
          await ethereumPage.locators.tokenAllowance.textContent();
        const allowance = parseFloat(allowanceText || "0");
        expect(allowance).toBe(0);
      }).toPass();
    },
  );

  metamaskTest(
    "Can perform multiple operations in sequence",
    async ({ ethereumPage, metamask }) => {
      // 1. Mint tokens
      await ethereumPage.mintTokens();
      await metamask.approve();

      await expect(async () => {
        const balanceText = await ethereumPage.getTokenBalance();
        const balance = parseFloat(balanceText);
        expect(balance).toBeGreaterThanOrEqual(1000);
      }).toPass({ timeout: 30000 });

      // 2. Approve spender
      await ethereumPage.approveTokens(SPENDER_ADDRESS, "300");
      await metamask.approve();

      await ethereumPage.assertTokenApprovalSuccess();

      // 3. Transfer tokens
      await ethereumPage.transferTokens(RECIPIENT_ADDRESS, "150");
      await metamask.approve();

      await ethereumPage.assertTokenTransferSuccess();

      // Verify final state
      await expect(async () => {
        const balanceText = await ethereumPage.getTokenBalance();
        const balance = parseFloat(balanceText);
        expect(balance).toEqual(850); // 1000 - 150
      }).toPass();

      await expect(async () => {
        const allowanceText =
          await ethereumPage.locators.tokenAllowance.textContent();
        const allowance = parseFloat(allowanceText || "0");
        expect(allowance).toBeCloseTo(300, 1);
      }).toPass();
    },
  );
});
