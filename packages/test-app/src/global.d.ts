export {};

declare global {
  interface Window {
    injectedWeb3?: Record<string, any>;
  }
}