'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getWsProvider } from "polkadot-api/ws-provider/web";
import { createClient, PolkadotClient, TypedApi } from "polkadot-api";
import { ksmhub } from "@polkadot-api/descriptors";

type KsmHubApi = TypedApi<typeof ksmhub>;

interface PAPIContextType {
  client: PolkadotClient | null;
  api: KsmHubApi | null;
  isLoading: boolean;
  error: Error | null;
}

const PAPIContext = createContext<PAPIContextType | undefined>(undefined);

export const PAPIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [client, setClient] = useState<PolkadotClient | null>(null);
  const [api, setApi] = useState<KsmHubApi | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initClient = async () => {
      try {
        const provider = getWsProvider('ws://localhost:8822')
        const client = createClient(provider);
        const typedApi = client.getTypedApi(ksmhub);
        
        setClient(client);
        setApi(typedApi);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    initClient();

    return () => {
      if (client) {
        client.destroy()
      }
    };
  }, []);

  return (
    <PAPIContext.Provider value={{ client, api, isLoading, error }}>
      {children}
    </PAPIContext.Provider>
  );
};

export const usePAPI = () => {
  const context = useContext(PAPIContext);
  if (!context) {
    throw new Error('usePAPI must be used within a PAPIProvider');
  }
  return context;
};
