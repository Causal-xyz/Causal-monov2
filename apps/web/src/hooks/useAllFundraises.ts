"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { causalOrganizationsAbi, CONTRACTS } from "@causal/shared";

export function useAllFundraises() {
  const contractAddress = CONTRACTS.causalOrganizations;

  const { data: orgCount } = useReadContract({
    address: contractAddress,
    abi: causalOrganizationsAbi,
    functionName: "orgCount",
    query: { enabled: !!contractAddress && contractAddress !== "0x" },
  });

  const count = Number(orgCount ?? 0n);

  // Batch read info + sale data for all orgs
  const batchContracts = Array.from({ length: count }, (_, i) => {
    const orgId = BigInt(i + 1);
    return [
      {
        address: contractAddress,
        abi: causalOrganizationsAbi,
        functionName: "getOrgInfo" as const,
        args: [orgId] as const,
      },
      {
        address: contractAddress,
        abi: causalOrganizationsAbi,
        functionName: "orgSales" as const,
        args: [orgId] as const,
      },
    ];
  }).flat();

  const { data: batchResults, isLoading } = useReadContracts({
    contracts: batchContracts,
    query: { enabled: count > 0 },
  });

  const fundraises = Array.from({ length: count }, (_, i) => {
    const base = i * 2;
    const infoResult = batchResults?.[base]?.result as
      | [string, string, string, string, `0x${string}`]
      | undefined;
    const saleResult = batchResults?.[base + 1]?.result as
      | readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean, boolean, boolean, boolean]
      | undefined;

    const finalized = saleResult?.[12] ?? false;
    const successful = saleResult?.[13] ?? false;
    const saleEnd = Number(saleResult?.[5] ?? 0n);
    const active = saleResult?.[11] ?? false;

    let status: "funding" | "finalized" | "failed";
    if (finalized && successful) {
      status = "finalized";
    } else if (finalized && !successful) {
      status = "failed";
    } else {
      status = "funding";
    }

    return {
      id: i + 1,
      name: infoResult?.[0] ?? "",
      symbol: infoResult?.[1] ?? "",
      description: infoResult?.[2] ?? "",
      imageUrl: infoResult?.[3] ?? "",
      founder: infoResult?.[4] ?? ("0x" as `0x${string}`),
      fundingGoal: saleResult?.[0] ?? 0n,
      usdcRaised: saleResult?.[1] ?? 0n,
      tokensForSale: saleResult?.[2] ?? 0n,
      saleEnd,
      active,
      finalized,
      successful,
      status,
    };
  });

  return { fundraises, count, isLoading };
}
