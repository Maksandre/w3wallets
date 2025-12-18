import { expect, type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for MetaMask Test DApp (EVM-based wallets)
 * URL: http://localhost:3001
 *
 * This POM handles interactions with the main test dApp page used for MetaMask testing,
 * including wallet connection, signing messages, and token/NFT operations.
 */
export class EthereumPage {
  readonly page: Page;
  readonly locators: Record<string, Locator>;

  constructor(page: Page) {
    this.page = page;

    // Define all important locators
    this.locators = {
      // Wallet Connection Section
      connectionStatus: this.page.getByTestId("connection-status"),
      accountAddress: this.page.getByTestId("account-address"),
      connectButton: this.page.getByTestId("connect-button"),
      disconnectButton: this.page.getByTestId("disconnect-button"),
      metaMaskConnector: this.page.getByRole("button", { name: "MetaMask" }),

      // Network Section
      networkNotConnected: this.page.getByTestId("network-not-connected"),
      networkName: this.page.getByTestId("network-name"),
      chainId: this.page.getByTestId("chain-id"),

      // Sign Message Section
      signNotConnected: this.page.getByTestId("sign-not-connected"),
      signMessageInput: this.page.getByTestId("sign-message-input"),
      signMessageSubmit: this.page.getByTestId("sign-message-submit"),
      signMessageSuccess: this.page.getByTestId("sign-message-success"),
      signMessageSignature: this.page.getByTestId("sign-message-signature"),
      signMessageError: this.page.getByTestId("sign-message-error"),

      // Token (ERC-20) Section
      tokenNotConnected: this.page.getByTestId("token-not-connected"),
      tokenName: this.page.getByTestId("token-name"),
      tokenSymbol: this.page.getByTestId("token-symbol"),
      tokenBalance: this.page.getByTestId("token-balance"),
      tokenMintButton: this.page.getByTestId("token-mint-button"),
      tokenTransferRecipient: this.page.getByTestId("token-transfer-recipient"),
      tokenTransferAmount: this.page.getByTestId("token-transfer-amount"),
      tokenTransferSubmit: this.page.getByTestId("token-transfer-submit"),
      tokenTransferSuccess: this.page.getByTestId("token-transfer-success"),
      tokenTransferError: this.page.getByTestId("token-transfer-error"),
      tokenApproveSpender: this.page.getByTestId("token-approve-spender"),
      tokenApproveAmount: this.page.getByTestId("token-approve-amount"),
      tokenAllowance: this.page.getByTestId("token-allowance"),
      tokenApproveSubmit: this.page.getByTestId("token-approve-submit"),
      tokenApproveSuccess: this.page.getByTestId("token-approve-success"),
      tokenApproveError: this.page.getByTestId("token-approve-error"),

      // NFT (ERC-721) Section
      nftNotConnected: this.page.getByTestId("nft-not-connected"),
      nftName: this.page.getByTestId("nft-name"),
      nftSymbol: this.page.getByTestId("nft-symbol"),
      nftBalance: this.page.getByTestId("nft-balance"),
      nftGallery: this.page.getByTestId("nft-gallery"),
      nftMintSubmit: this.page.getByTestId("nft-mint-submit"),
      nftMintSuccess: this.page.getByTestId("nft-mint-success"),
      nftMintError: this.page.getByTestId("nft-mint-error"),
      nftTransferTokenId: this.page.getByTestId("nft-transfer-tokenid"),
      nftTransferRecipient: this.page.getByTestId("nft-transfer-recipient"),
      nftTransferSubmit: this.page.getByTestId("nft-transfer-submit"),
      nftTransferSuccess: this.page.getByTestId("nft-transfer-success"),
      nftTransferError: this.page.getByTestId("nft-transfer-error"),
    };
  }

  // Navigation
  async goto(): Promise<void> {
    await this.page.goto("http://localhost:3001");
  }

  // High-level workflow methods
  /**
   * Connect wallet using MetaMask connector button
   */
  async connectMetaMask(): Promise<void> {
    await this.locators.metaMaskConnector.click();
  }

  /**
   * Disconnect the connected wallet
   */
  async disconnectWallet(): Promise<void> {
    await this.locators.disconnectButton.click();
  }

  /**
   * Sign a message workflow
   * @param message - Message to sign
   */
  async signMessage(message: string): Promise<void> {
    await this.locators.signMessageInput.fill(message);
    await this.locators.signMessageSubmit.click();
  }

  /**
   * Mint ERC-20 tokens
   */
  async mintTokens(): Promise<void> {
    await this.locators.tokenMintButton.click();
  }

  /**
   * Transfer ERC-20 tokens
   * @param recipient - Recipient address
   * @param amount - Amount to transfer (as string)
   */
  async transferTokens(recipient: string, amount: string): Promise<void> {
    await this.locators.tokenTransferRecipient.fill(recipient);
    await this.locators.tokenTransferAmount.fill(amount);
    await this.locators.tokenTransferSubmit.click();
  }

  /**
   * Approve spender for ERC-20 tokens
   * @param spender - Spender address
   * @param amount - Amount to approve (as string)
   */
  async approveTokens(spender: string, amount: string): Promise<void> {
    await this.locators.tokenApproveSpender.fill(spender);
    await this.locators.tokenApproveAmount.fill(amount);
    await this.locators.tokenApproveSubmit.click();
  }

  /**
   * Mint an NFT
   */
  async mintNft(): Promise<void> {
    await this.locators.nftMintSubmit.click();
  }

  /**
   * Transfer an NFT
   * @param tokenId - Token ID to transfer
   * @param recipient - Recipient address
   */
  async transferNft(tokenId: string, recipient: string): Promise<void> {
    await this.locators.nftTransferTokenId.fill(tokenId);
    await this.locators.nftTransferRecipient.fill(recipient);
    await this.locators.nftTransferSubmit.click();
  }

  // Assertion helpers
  /**
   * Verify wallet connection status
   * @param status - Expected status ("connected" or "disconnected")
   */
  async assertConnectionStatus(status: "connected" | "disconnected"): Promise<void> {
    await expect(this.locators.connectionStatus).toHaveText(status);
  }

  /**
   * Verify the connected account address
   * @param address - Expected address
   */
  async assertAccountAddress(address: string): Promise<void> {
    await expect(this.locators.accountAddress).toHaveText(address);
  }

  /**
   * Verify message signature was successful
   */
  async assertSignatureSuccess(): Promise<void> {
    await expect(this.locators.signMessageSuccess).toBeVisible();
    await expect(this.locators.signMessageSignature).toBeVisible();
  }

  /**
   * Verify message signing failed
   */
  async assertSignatureError(): Promise<void> {
    await expect(this.locators.signMessageError).toBeVisible();
  }

  /**
   * Verify token transfer was successful
   */
  async assertTokenTransferSuccess(): Promise<void> {
    await expect(this.locators.tokenTransferSuccess).toBeVisible();
  }

  /**
   * Verify token transfer failed
   */
  async assertTokenTransferError(): Promise<void> {
    await expect(this.locators.tokenTransferError).toBeVisible();
  }

  /**
   * Verify token approval was successful
   */
  async assertTokenApprovalSuccess(): Promise<void> {
    await expect(this.locators.tokenApproveSuccess).toBeVisible();
  }

  /**
   * Verify NFT mint was successful
   */
  async assertNftMintSuccess(): Promise<void> {
    await expect(this.locators.nftMintSuccess).toBeVisible();
  }

  /**
   * Verify NFT transfer was successful
   */
  async assertNftTransferSuccess(): Promise<void> {
    await expect(this.locators.nftTransferSuccess).toBeVisible();
  }

  /**
   * Get the current token balance as text
   */
  async getTokenBalance(): Promise<string> {
    return await this.locators.tokenBalance.textContent() || "0";
  }

  /**
   * Get the current NFT balance as text
   */
  async getNftBalance(): Promise<string> {
    return await this.locators.nftBalance.textContent() || "0";
  }

  /**
   * Get a specific NFT item locator by token ID
   * @param tokenId - Token ID
   */
  getNftItem(tokenId: string | number): Locator {
    return this.page.getByTestId(`nft-item-${tokenId}`);
  }

  /**
   * Get network switch button for specific chain ID
   * @param chainId - Chain ID
   */
  getNetworkSwitchButton(chainId: number): Locator {
    return this.page.getByTestId(`network-switch-${chainId}`);
  }

  /**
   * Switch to a specific network
   * @param chainId - Chain ID to switch to
   */
  async switchNetwork(chainId: number): Promise<void> {
    await this.getNetworkSwitchButton(chainId).click();
  }
}
