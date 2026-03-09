"use client";

import { useReadContracts } from "wagmi";
import { futarchyFactoryAbi } from "@causal/shared";

/**
 * After a proposal is created, reads proposalCount then proposals(count)
 * to discover the latest proposal address. Only enabled when `enabled` is true.
 */
export function useLatestProposalAddress(
  factoryAddress: `0x${string}`,
  enabled: boolean,
) {
  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: [
      {
        address: factoryAddress,
        abi: futarchyFactoryAbi,
        functionName: "proposalCount",
      },
    ],
    query: { enabled },
  });

  const proposalCount = data?.[0]?.result as bigint | undefined;

  const { data: proposalData, isLoading: isLoadingProposal } = useReadContracts({
    contracts: proposalCount != null && proposalCount > 0n
      ? [
          {
            address: factoryAddress,
            abi: futarchyFactoryAbi,
            functionName: "proposals",
            args: [proposalCount],
          },
        ]
      : [],
    query: {
      enabled: enabled && proposalCount != null && proposalCount > 0n,
    },
  });

  const proposalAddress = proposalData?.[0]?.result as `0x${string}` | undefined;

  return {
    proposalAddress,
    isLoading: isLoading || isLoadingProposal,
    error,
    refetch,
  };
}
