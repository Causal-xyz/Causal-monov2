"use client";

import { useReadContracts } from "wagmi";
import { causalOrganizationsAbi, CONTRACTS } from "@causal/shared";

export function useUserContribution(
  orgId: number,
  userAddress: `0x${string}` | undefined,
) {
  const contractAddress = CONTRACTS.causalOrganizations;
  const id = BigInt(orgId);

  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      {
        address: contractAddress,
        abi: causalOrganizationsAbi,
        functionName: "contributions",
        args: [id, userAddress!],
      },
      {
        address: contractAddress,
        abi: causalOrganizationsAbi,
        functionName: "accumulators",
        args: [id, userAddress!],
      },
      {
        address: contractAddress,
        abi: causalOrganizationsAbi,
        functionName: "hasClaimed",
        args: [id, userAddress!],
      },
      {
        address: contractAddress,
        abi: causalOrganizationsAbi,
        functionName: "getUserAllocation",
        args: [id, userAddress!],
      },
    ],
    query: {
      enabled:
        !!contractAddress &&
        contractAddress !== "0x" &&
        orgId > 0 &&
        !!userAddress,
      refetchInterval: 10_000,
    },
  });

  const committed = (data?.[0]?.result as bigint) ?? 0n;
  const accumulator = (data?.[1]?.result as bigint) ?? 0n;
  const hasClaimed = (data?.[2]?.result as boolean) ?? false;
  const allocationResult = data?.[3]?.result as
    | [bigint, bigint, bigint]
    | undefined;

  return {
    committed,
    accumulator,
    hasClaimed,
    allocation: allocationResult
      ? {
          estimatedTokens: allocationResult[0],
          estimatedRefund: allocationResult[1],
          finalShareBps: Number(allocationResult[2]),
        }
      : undefined,
    isLoading,
    refetch,
  };
}
