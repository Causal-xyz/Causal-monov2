"use client";

import { useReadContracts } from "wagmi";
import { causalOrganizationsAbi, CONTRACTS } from "@causal/shared";
import type { FundraiseStatus } from "@causal/shared";

export function useFundraiseInfo(orgId: number) {
  const contractAddress = CONTRACTS.causalOrganizations;
  const id = BigInt(orgId);

  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      {
        address: contractAddress,
        abi: causalOrganizationsAbi,
        functionName: "getOrgInfo",
        args: [id],
      },
      {
        address: contractAddress,
        abi: causalOrganizationsAbi,
        functionName: "orgSales",
        args: [id],
      },
      {
        address: contractAddress,
        abi: causalOrganizationsAbi,
        functionName: "orgTokens",
        args: [id],
      },
      {
        address: contractAddress,
        abi: causalOrganizationsAbi,
        functionName: "orgTreasuries",
        args: [id],
      },
      {
        address: contractAddress,
        abi: causalOrganizationsAbi,
        functionName: "orgFactories",
        args: [id],
      },
      {
        address: contractAddress,
        abi: causalOrganizationsAbi,
        functionName: "orgContributorCount",
        args: [id],
      },
      {
        address: contractAddress,
        abi: causalOrganizationsAbi,
        functionName: "getTokenPrice",
        args: [id],
      },
      {
        address: contractAddress,
        abi: causalOrganizationsAbi,
        functionName: "getCurrentMultiplier",
        args: [id],
      },
    ],
    query: {
      enabled: !!contractAddress && contractAddress !== "0x" && orgId >= 0,
      refetchInterval: 10_000,
    },
  });

  const infoResult = data?.[0]?.result as
    | [string, string, string, string, `0x${string}`]
    | undefined;
  const saleResult = data?.[1]?.result as
    | readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean, boolean, boolean, boolean]
    | undefined;
  const tokenAddress = data?.[2]?.result as `0x${string}` | undefined;
  const treasuryAddress = data?.[3]?.result as `0x${string}` | undefined;
  const factoryAddress = data?.[4]?.result as `0x${string}` | undefined;
  const contributorCount = Number(data?.[5]?.result ?? 0n);
  const tokenPrice = (data?.[6]?.result as bigint) ?? 0n;
  const multiplierResult = data?.[7]?.result as [bigint, bigint] | undefined;

  const finalized = saleResult?.[12] ?? false;
  const successful = saleResult?.[13] ?? false;

  let status: FundraiseStatus;
  if (finalized && successful) {
    status = "finalized";
  } else if (finalized && !successful) {
    status = "failed";
  } else {
    status = "funding";
  }

  const isZeroAddr = (addr: `0x${string}` | undefined) =>
    !addr || addr === "0x0000000000000000000000000000000000000000";

  return {
    info: infoResult
      ? {
          name: infoResult[0],
          symbol: infoResult[1],
          description: infoResult[2],
          imageUrl: infoResult[3],
          founder: infoResult[4],
        }
      : undefined,
    sale: saleResult
      ? {
          fundingGoal: saleResult[0],
          usdcRaised: saleResult[1],
          tokensForSale: saleResult[2],
          totalTokenSupply: saleResult[3],
          saleStart: Number(saleResult[4]),
          saleEnd: Number(saleResult[5]),
          alpha: saleResult[6],
          totalAccumulator: saleResult[7],
          discretionaryCap: saleResult[8],
          capDeadline: Number(saleResult[9]),
          capSet: saleResult[10],
          active: saleResult[11],
          finalized: saleResult[12],
          successful: saleResult[13],
        }
      : undefined,
    status,
    tokenAddress: isZeroAddr(tokenAddress) ? undefined : tokenAddress,
    treasuryAddress: isZeroAddr(treasuryAddress) ? undefined : treasuryAddress,
    factoryAddress: isZeroAddr(factoryAddress) ? undefined : factoryAddress,
    contributorCount,
    tokenPrice,
    multiplier: multiplierResult
      ? { numerator: multiplierResult[0], denominator: multiplierResult[1] }
      : undefined,
    isLoading,
    refetch,
  };
}
