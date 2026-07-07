"use client";

import { useCasperWallet } from "@/context";

export function useWallet() {
  const { isConnected, publicKey, accountHash, connect, disconnect } =
    useCasperWallet();

  return {
    address: accountHash,
    isConnected,
    connect,
  };
}
