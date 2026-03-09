"use client";

import { useReadContracts } from "wagmi";
import { futarchyProposalAbi, erc20Abi } from "@causal/shared";

export function useConditionalBalances(
  proposalAddress: `0x${string}` | undefined,
  userAddress: `0x${string}` | undefined,
) {
  // First get the token addresses
  const { data: tokenSet } = useReadContracts({
    contracts: [
      { address: proposalAddress, abi: futarchyProposalAbi, functionName: "yesX" },
      { address: proposalAddress, abi: futarchyProposalAbi, functionName: "noX" },
      { address: proposalAddress, abi: futarchyProposalAbi, functionName: "yesUsdc" },
      { address: proposalAddress, abi: futarchyProposalAbi, functionName: "noUsdc" },
    ],
    query: { enabled: !!proposalAddress },
  });

  const yesXAddr = tokenSet?.[0]?.result as `0x${string}` | undefined;
  const noXAddr = tokenSet?.[1]?.result as `0x${string}` | undefined;
  const yesUsdcAddr = tokenSet?.[2]?.result as `0x${string}` | undefined;
  const noUsdcAddr = tokenSet?.[3]?.result as `0x${string}` | undefined;

  const enabled = !!userAddress && !!yesXAddr && !!noXAddr && !!yesUsdcAddr && !!noUsdcAddr;

  const { data: balances, isLoading, refetch } = useReadContracts({
    contracts: [
      { address: yesXAddr, abi: erc20Abi, functionName: "balanceOf", args: [userAddress!] },
      { address: noXAddr, abi: erc20Abi, functionName: "balanceOf", args: [userAddress!] },
      { address: yesUsdcAddr, abi: erc20Abi, functionName: "balanceOf", args: [userAddress!] },
      { address: noUsdcAddr, abi: erc20Abi, functionName: "balanceOf", args: [userAddress!] },
    ],
    query: { enabled, refetchInterval: 5000 },
  });

  return {
    balances: {
      yesX: (balances?.[0]?.result as bigint) ?? 0n,
      noX: (balances?.[1]?.result as bigint) ?? 0n,
      yesUsdc: (balances?.[2]?.result as bigint) ?? 0n,
      noUsdc: (balances?.[3]?.result as bigint) ?? 0n,
    },
    tokens: {
      yesX: yesXAddr,
      noX: noXAddr,
      yesUsdc: yesUsdcAddr,
      noUsdc: noUsdcAddr,
    },
    isLoading,
    refetch,
  };
}
