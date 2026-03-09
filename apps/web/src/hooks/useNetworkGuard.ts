"use client";

import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { avalancheFuji } from "wagmi/chains";

export function useNetworkGuard() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const isWrongNetwork = isConnected && chainId !== avalancheFuji.id;

  function switchToFuji() {
    switchChain({ chainId: avalancheFuji.id });
  }

  return {
    isWrongNetwork,
    isSwitching,
    switchToFuji,
    expectedChainId: avalancheFuji.id,
    expectedChainName: avalancheFuji.name,
  };
}
