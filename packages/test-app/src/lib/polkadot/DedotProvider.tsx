// Saved for the history

// 'use client';

// import React, { createContext, useContext, useEffect, useState } from 'react';
// import { DedotClient, WsProvider } from 'dedot';
// import { StatemineApi } from '../../../statemine';
// import { usePolkadotWalletContext } from './PolkadotWalletProvider';

// interface DedotContextType {
//   client: DedotClient<StatemineApi> | null;
//   isLoading: boolean;
//   error: Error | null;
// }

// const DedotContext = createContext<DedotContextType | undefined>(undefined);

// export const DedotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const { activeAccount } = usePolkadotWalletContext();
//   const [client, setClient] = useState<DedotClient<StatemineApi> | null>(null);
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//   const [error, setError] = useState<Error | null>(null);

//   useEffect(() => {
//     const initClient = async () => {
//       try {
//         // TODO: Move endpoint to config.
//         // const provider = new WsProvider({endpoint: 'wss://westmint-rpc-tn.dwellir.com', timeout: 10000000000});
//         const provider = new WsProvider({endpoint: 'ws://localhost:8822', timeout: 10000000000});

//         const dedotClient = await DedotClient.new<StatemineApi>(provider);
//         setClient(dedotClient);
//       } catch (err) {
//         setError(err as Error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     initClient();

//     return () => {
//       if (client) {
//         client.disconnect();
//       }
//     };
//   }, []);

//   // When the client is ready and activeAccount is available,
//   // set the activeAccount's signer on the client.
//   useEffect(() => {
//     if (client && activeAccount) {
//       client.setSigner(activeAccount.signer);
//     }
//   }, [client, activeAccount]);

//   return (
//     <DedotContext.Provider value={{ client, isLoading, error }}>
//       {children}
//     </DedotContext.Provider>
//   );
// };

// export const useDedot = () => {
//   const context = useContext(DedotContext);
//   if (!context) {
//     throw new Error('useDedot must be used within a DedotProvider');
//   }
//   return context;
// };
