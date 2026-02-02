/**
 * Configuration for w3wallets library.
 * Values can be overridden via environment variables.
 */
export const config = {
  /**
   * Timeout for actions like click, fill, waitFor, goto.
   * Set via W3WALLETS_ACTION_TIMEOUT env variable.
   * @default 30000 (30 seconds)
   */
  get actionTimeout(): number | undefined {
    const value = process.env.W3WALLETS_ACTION_TIMEOUT;
    return value ? parseInt(value, 10) : undefined;
  },

  /**
   * Timeout for expect assertions like toBeVisible, toContainText.
   * Set via W3WALLETS_EXPECT_TIMEOUT env variable.
   * @default undefined (uses Playwright's default of 5000ms)
   */
  get expectTimeout(): number | undefined {
    const value = process.env.W3WALLETS_EXPECT_TIMEOUT;
    return value ? parseInt(value, 10) : undefined;
  },
};
