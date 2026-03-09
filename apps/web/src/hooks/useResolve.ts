"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { futarchyProposalAbi } from "@causal/shared";

export function useResolve(proposalAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function resolve() {
    writeContract({
      address: proposalAddress,
      abi: futarchyProposalAbi,
      functionName: "resolve",
    });
  }

  return { resolve, hash, isPending, isConfirming, isSuccess, error };
}
