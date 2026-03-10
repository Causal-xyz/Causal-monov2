"use client";

import { useReadContracts } from "wagmi";
import { futarchyProposalAbi, type Outcome } from "@causal/shared";

const OUTCOME_MAP: Record<number, Outcome> = {
  0: "Unresolved",
  1: "Yes",
  2: "No",
};

export function useProposalInfo(proposalAddress: `0x${string}` | undefined) {
  const contract = {
    address: proposalAddress,
    abi: futarchyProposalAbi,
  } as const;

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: [
      { ...contract, functionName: "proposalId" },
      { ...contract, functionName: "title" },
      { ...contract, functionName: "tokenX" },
      { ...contract, functionName: "usdc" },
      { ...contract, functionName: "resolutionTimestamp" },
      { ...contract, functionName: "outcome" },
      { ...contract, functionName: "transferToken" },
      { ...contract, functionName: "recipient" },
      { ...contract, functionName: "transferAmount" },
      { ...contract, functionName: "ammYesPair" },
      { ...contract, functionName: "ammNoPair" },
      { ...contract, functionName: "owner" },
    ],
    query: { enabled: !!proposalAddress, staleTime: 30_000 },
  });

  if (!data) {
    return { proposal: null, isLoading, error, refetch };
  }

  const [
    proposalId,
    title,
    tokenX,
    usdc,
    resolutionTimestamp,
    outcome,
    transferToken,
    recipient,
    transferAmount,
    ammYesPair,
    ammNoPair,
    owner,
  ] = data;

  const hasAmms =
    ammYesPair?.result !== undefined &&
    ammYesPair.result !== "0x0000000000000000000000000000000000000000";

  return {
    proposal: {
      id: Number(proposalId?.result ?? 0n),
      address: proposalAddress!,
      title: (title?.result as string) ?? "",
      tokenX: (tokenX?.result as `0x${string}`) ?? "0x",
      usdc: (usdc?.result as `0x${string}`) ?? "0x",
      resolutionTimestamp: Number(resolutionTimestamp?.result ?? 0n),
      outcome: OUTCOME_MAP[Number(outcome?.result ?? 0)] ?? "Unresolved",
      transferToken: (transferToken?.result as `0x${string}`) ?? "0x",
      recipient: (recipient?.result as `0x${string}`) ?? "0x",
      transferAmount: (transferAmount?.result as bigint) ?? 0n,
      ammYesPair: (ammYesPair?.result as `0x${string}`) ?? "0x",
      ammNoPair: (ammNoPair?.result as `0x${string}`) ?? "0x",
      owner: (owner?.result as `0x${string}`) ?? "0x",
      hasAmms,
    },
    isLoading,
    error,
    refetch,
  };
}
