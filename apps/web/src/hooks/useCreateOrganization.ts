"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { causalOrganizationsAbi, CONTRACTS } from "@causal/shared";

export function useCreateOrganization() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  function createOrganization(params: {
    name: string;
    symbol: string;
    description: string;
    imageUrl: string;
    totalTokenSupply: bigint;
    tokensForSale: bigint;
    fundingGoal: bigint;
    saleDuration: bigint;
    alpha: bigint;
  }) {
    writeContract({
      address: CONTRACTS.causalOrganizations,
      abi: causalOrganizationsAbi,
      functionName: "createOrganization",
      args: [
        params.name,
        params.symbol,
        params.description,
        params.imageUrl,
        params.totalTokenSupply,
        params.tokensForSale,
        params.fundingGoal,
        params.saleDuration,
        params.alpha,
      ],
    });
  }

  return { createOrganization, hash, isPending, isConfirming, isSuccess, error };
}
