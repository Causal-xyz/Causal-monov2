"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { futarchyProposalAbi } from "@causal/shared";

export function useRedeemX(proposalAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function redeem(amount: bigint, receiver: `0x${string}`) {
    writeContract({
      address: proposalAddress,
      abi: futarchyProposalAbi,
      functionName: "redeemWinningX",
      args: [amount, receiver],
    });
  }

  return { redeem, hash, isPending, isConfirming, isSuccess, error };
}

export function useRedeemUsdc(proposalAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function redeem(amount: bigint, receiver: `0x${string}`) {
    writeContract({
      address: proposalAddress,
      abi: futarchyProposalAbi,
      functionName: "redeemWinningUsdc",
      args: [amount, receiver],
    });
  }

  return { redeem, hash, isPending, isConfirming, isSuccess, error };
}
