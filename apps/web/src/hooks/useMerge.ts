"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { futarchyProposalAbi } from "@causal/shared";

export function useMergeX(proposalAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({ hash });
  const error = writeError ?? receiptError;

  function merge(amount: bigint, receiver: `0x${string}`) {
    writeContract({
      address: proposalAddress,
      abi: futarchyProposalAbi,
      functionName: "mergeX",
      args: [amount, receiver],
    });
  }

  return { merge, hash, isPending, isConfirming, isSuccess, error };
}

export function useMergeUsdc(proposalAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({ hash });
  const error = writeError ?? receiptError;

  function merge(amount: bigint, receiver: `0x${string}`) {
    writeContract({
      address: proposalAddress,
      abi: futarchyProposalAbi,
      functionName: "mergeUsdc",
      args: [amount, receiver],
    });
  }

  return { merge, hash, isPending, isConfirming, isSuccess, error };
}
