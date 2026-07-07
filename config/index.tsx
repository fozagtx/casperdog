// Casper Network configuration
export const CASPER_NETWORK = {
  name: "Casper Network",
  chainId: "casper",
  rpcUrl: process.env.NEXT_PUBLIC_CASPER_RPC_URL || "https://node.casper.network/rpc",
  explorerUrl: "https://cspr.live",
};

// Casper Wallet provider interface
export interface CasperWalletState {
  isConnected: boolean;
  publicKey: string | null;
  accountHash: string | null;
}

// Default empty state
export const defaultCasperState: CasperWalletState = {
  isConnected: false,
  publicKey: null,
  accountHash: null,
};
