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
};
