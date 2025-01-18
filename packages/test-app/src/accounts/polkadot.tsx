import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
} from 'react';
import { web3Enable, web3Accounts } from '@polkadot/extension-dapp';
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

interface PolkadotWalletContextValue {
  accounts: InjectedAccountWithMeta[];
  isConnected: boolean;
  connectWallet: () => Promise<void>;
}

const PolkadotWalletContext = createContext<PolkadotWalletContextValue>({
  accounts: [],
  isConnected: false,
  connectWallet: async () => {},
});

interface PolkadotWalletProviderProps {
  children: ReactNode;
}

export function PolkadotWalletProvider({ children }: PolkadotWalletProviderProps) {
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  /**
   * connectWallet tries to enable the user's Polkadot extension
   * and fetches available accounts if successful.
   */
  const connectWallet = useCallback(async () => {
    try {
      const extensions = await web3Enable('Test w3wallets app');
      if (extensions.length === 0) {
        // no extension installed, or the user did not accept the authorization
        throw new Error('No Polkadot extension detected or access was denied.');
      }
      // Retrieve accounts from the Polkadot extension.
      const allAccounts = await web3Accounts();
      setAccounts(allAccounts);
      setIsConnected(true);
    } catch (error) {
      console.error('[connectWallet error]', error);
      setIsConnected(false);
    }
  }, []);

  return (
    <PolkadotWalletContext.Provider value={{ accounts, isConnected, connectWallet }}>
      {children}
    </PolkadotWalletContext.Provider>
  );
}

export function usePolkadotWallet(): PolkadotWalletContextValue {
  return useContext(PolkadotWalletContext);
}
