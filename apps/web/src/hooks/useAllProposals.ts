"use client";

import { useMemo } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import {
  causalOrganizationsAbi,
  futarchyFactoryAbi,
  futarchyProposalAbi,
  CONTRACTS,
} from "@causal/shared";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const OUTCOME_MAP = { 0: "Unresolved", 1: "Yes", 2: "No" } as const;

export function useAllProposals() {
  const contractAddress = CONTRACTS.causalOrganizations;

  // Step 1: Get org count
  const { data: orgCount } = useReadContract({
    address: contractAddress,
    abi: causalOrganizationsAbi,
    functionName: "orgCount",
    query: { enabled: !!contractAddress && contractAddress !== "0x" },
  });

  const count = Number(orgCount ?? 0n);

  // Step 2: Fetch factory address for every org
  const factoryContracts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        address: contractAddress,
        abi: causalOrganizationsAbi,
        functionName: "orgFactories" as const,
        args: [BigInt(i)] as const,
      })),
    [contractAddress, count],
  );

  const { data: factoryResults } = useReadContracts({
    contracts: factoryContracts,
    query: { enabled: count > 0 },
  });

  // Collect valid (non-zero) factory addresses
  const factories = useMemo(() => {
    if (!factoryResults) return [];
    return factoryResults
      .map((r, i) => ({
        orgId: i,
        address: r.result as `0x${string}` | undefined,
      }))
      .filter(
        (f): f is { orgId: number; address: `0x${string}` } =>
          !!f.address && f.address !== ZERO_ADDRESS,
      );
  }, [factoryResults]);

  // Step 3: Get proposal count per factory
  const countContracts = useMemo(
    () =>
      factories.map((f) => ({
        address: f.address,
        abi: futarchyFactoryAbi,
        functionName: "proposalCount" as const,
      })),
    [factories],
  );

  const { data: countResults } = useReadContracts({
    contracts: countContracts,
    query: { enabled: factories.length > 0 },
  });

  // Build flat list of (factory, proposalIndex) pairs
  const proposalSlots = useMemo(() => {
    if (!countResults) return [];
    const slots: { factory: `0x${string}`; index: bigint }[] = [];
    countResults.forEach((r, fi) => {
      const n = Number(r.result ?? 0n);
      for (let j = 1; j <= n; j++) {
        slots.push({ factory: factories[fi].address, index: BigInt(j) });
      }
    });
    return slots;
  }, [countResults, factories]);

  // Step 4: Fetch proposal addresses
  const addrContracts = useMemo(
    () =>
      proposalSlots.map((s) => ({
        address: s.factory,
        abi: futarchyFactoryAbi,
        functionName: "proposals" as const,
        args: [s.index] as const,
      })),
    [proposalSlots],
  );

  const { data: addrResults, isLoading: isLoadingAddrs } = useReadContracts({
    contracts: addrContracts,
    query: { enabled: proposalSlots.length > 0 },
  });

  const proposalAddresses = useMemo(
    () =>
      (addrResults ?? [])
        .map((r) => r.result as `0x${string}` | undefined)
        .filter((a): a is `0x${string}` => !!a && a !== ZERO_ADDRESS),
    [addrResults],
  );

  // Step 5: Fetch info for each proposal
  const infoContracts = useMemo(
    () =>
      proposalAddresses.flatMap((addr) => [
        { address: addr, abi: futarchyProposalAbi, functionName: "title" as const },
        { address: addr, abi: futarchyProposalAbi, functionName: "outcome" as const },
        { address: addr, abi: futarchyProposalAbi, functionName: "resolutionTimestamp" as const },
        { address: addr, abi: futarchyProposalAbi, functionName: "proposalId" as const },
      ]),
    [proposalAddresses],
  );

  const { data: infoResults, isLoading: isLoadingInfo } = useReadContracts({
    contracts: infoContracts,
    query: { enabled: proposalAddresses.length > 0 },
  });

  const proposals = useMemo(
    () =>
      proposalAddresses.map((addr, i) => {
        const base = i * 4;
        return {
          address: addr,
          title: (infoResults?.[base]?.result as string) ?? "",
          outcome:
            OUTCOME_MAP[Number(infoResults?.[base + 1]?.result ?? 0) as 0 | 1 | 2],
          resolutionTimestamp: Number(infoResults?.[base + 2]?.result ?? 0n),
          id: Number(infoResults?.[base + 3]?.result ?? 0n),
        };
      }),
    [proposalAddresses, infoResults],
  );

  return {
    proposals,
    count: proposalAddresses.length,
    isLoading: isLoadingAddrs || isLoadingInfo,
  };
}
