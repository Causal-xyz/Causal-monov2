"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { futarchyFactoryAbi, futarchyProposalAbi, CONTRACTS } from "@causal/shared";

export function useAllProposals() {
  const factoryAddress = CONTRACTS.factory;

  const { data: proposalCount } = useReadContract({
    address: factoryAddress,
    abi: futarchyFactoryAbi,
    functionName: "proposalCount",
    query: { enabled: !!factoryAddress && factoryAddress !== "0x" },
  });

  const count = Number(proposalCount ?? 0n);

  // Build array of proposal address reads
  const proposalAddressContracts = Array.from({ length: count }, (_, i) => ({
    address: factoryAddress,
    abi: futarchyFactoryAbi,
    functionName: "proposals" as const,
    args: [BigInt(i + 1)] as const,
  }));

  const { data: addressResults, isLoading: isLoadingAddresses } = useReadContracts({
    contracts: proposalAddressContracts,
    query: { enabled: count > 0 },
  });

  const proposalAddresses = (addressResults ?? [])
    .map((r) => r.result as `0x${string}` | undefined)
    .filter((addr): addr is `0x${string}` => !!addr);

  // Read basic info for each proposal
  const proposalInfoContracts = proposalAddresses.flatMap((addr) => [
    { address: addr, abi: futarchyProposalAbi, functionName: "title" as const },
    { address: addr, abi: futarchyProposalAbi, functionName: "outcome" as const },
    { address: addr, abi: futarchyProposalAbi, functionName: "resolutionTimestamp" as const },
    { address: addr, abi: futarchyProposalAbi, functionName: "proposalId" as const },
  ]);

  const { data: infoResults, isLoading: isLoadingInfo } = useReadContracts({
    contracts: proposalInfoContracts,
    query: { enabled: proposalAddresses.length > 0 },
  });

  const OUTCOME_MAP = { 0: "Unresolved", 1: "Yes", 2: "No" } as const;

  const proposals = proposalAddresses.map((addr, i) => {
    const base = i * 4;
    return {
      address: addr,
      title: (infoResults?.[base]?.result as string) ?? "",
      outcome: OUTCOME_MAP[Number(infoResults?.[base + 1]?.result ?? 0) as 0 | 1 | 2],
      resolutionTimestamp: Number(infoResults?.[base + 2]?.result ?? 0n),
      id: Number(infoResults?.[base + 3]?.result ?? 0n),
    };
  });

  return {
    proposals,
    count,
    isLoading: isLoadingAddresses || isLoadingInfo,
  };
}
