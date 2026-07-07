"use client";

import React, { ReactNode, createContext, useContext, useState, useCallback, useEffect } from "react";
import { CasperWalletState, defaultCasperState } from "@/config";

interface CasperContextType extends CasperWalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  signMessage: (message: string) => Promise<string>;
}

const CasperContext = createContext<CasperContextType>({
  ...defaultCasperState,
  connect: async () => {},
  disconnect: () => {},
  signMessage: async () => "",
});

export const useCasperWallet = () => useContext(CasperContext);

export default function ContextProvider({
  children,
  cookies,
}: {
  children: ReactNode;
  cookies: string | null;
}) {
  const [state, setState] = useState<CasperWalletState>(defaultCasperState);

  const connect = useCallback(async () => {
    try {
      const provider = (window as any).CasperWalletProvider;
      if (!provider) {
        alert("Please install Casper Wallet extension");
        return;
      }

      const connected = await provider.requestConnection();
      if (!connected) {
        throw new Error("Connection rejected");
      }

      const publicKey = await provider.getActivePublicKey();
      if (publicKey) {
        // Derive account hash from public key (Casper format)
        const accountHash = Buffer.from(publicKey, "hex").toString("hex");
        setState({
          isConnected: true,
          publicKey,
          accountHash: `account-hash-${accountHash.slice(0, 64)}`,
        });
      }
    } catch (err: any) {
      console.error("Failed to connect Casper Wallet:", err);
      setState(defaultCasperState);
    }
  }, []);

  const disconnect = useCallback(() => {
    const provider = (window as any).CasperWalletProvider;
    if (provider) {
      provider.disconnectFromSite?.();
    }
    setState(defaultCasperState);
  }, []);

  const signMessage = useCallback(async (message: string): Promise<string> => {
    const provider = (window as any).CasperWalletProvider;
    if (!provider || !state.publicKey) {
      throw new Error("Wallet not connected");
    }
    const signature = await provider.signMessage(message, state.publicKey);
    return signature;
  }, [state.publicKey]);

  // Auto-detect existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const provider = (window as any).CasperWalletProvider;
        if (provider) {
          const publicKey = await provider.getActivePublicKey();
          if (publicKey) {
            const accountHash = Buffer.from(publicKey, "hex").toString("hex");
            setState({
              isConnected: true,
              publicKey,
              accountHash: `account-hash-${accountHash.slice(0, 64)}`,
            });
          }
        }
      } catch {
        // Wallet not available or not connected
      }
    };
    checkConnection();
  }, []);

  return (
    <CasperContext.Provider value={{ ...state, connect, disconnect, signMessage }}>
      {children}
    </CasperContext.Provider>
  );
}
