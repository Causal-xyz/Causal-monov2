"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { futarchyProposalAbi } from "@causal/shared";

export function useSplitX(proposalAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function split(amount: bigint, receiver: `0x${string}`) {
    writeContract({
      address: proposalAddress,
      abi: futarchyProposalAbi,
      functionName: "splitX",
      args: [amount, receiver],
    });
  }

  return { split, hash, isPending, isConfirming, isSuccess, error };
}

export function useSplitUsdc(proposalAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function split(amount: bigint, receiver: `0x${string}`) {
    writeContract({
      address: proposalAddress,
      abi: futarchyProposalAbi,
      functionName: "splitUsdc",
      args: [amount, receiver],
    });
  }

  return { split, hash, isPending, isConfirming, isSuccess, error };
}
