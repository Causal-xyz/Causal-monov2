"use client";

import { useReadContracts } from "wagmi";
import { erc20Abi } from "@causal/shared";

export function useTokenBalance(
  tokenAddress: `0x${string}` | undefined,
  userAddress: `0x${string}` | undefined,
) {
  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [userAddress!],
      },
      {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "symbol",
      },
      {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "decimals",
      },
    ],
    query: { enabled: !!tokenAddress && !!userAddress, refetchInterval: 5000 },
  });

  return {
    balance: (data?.[0]?.result as bigint) ?? 0n,
    symbol: (data?.[1]?.result as string) ?? "",
    decimals: Number(data?.[2]?.result ?? 18),
    isLoading,
    refetch,
  };
}
