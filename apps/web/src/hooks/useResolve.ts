"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { futarchyProposalAbi } from "@causal/shared";

export function useResolve(proposalAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({ hash });
  const error = writeError ?? receiptError;

  function resolve() {
    writeContract({
      address: proposalAddress,
      abi: futarchyProposalAbi,
      functionName: "resolve",
    });
  }

  return { resolve, hash, isPending, isConfirming, isSuccess, error };
}
