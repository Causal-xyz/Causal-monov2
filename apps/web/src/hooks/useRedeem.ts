"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { futarchyProposalAbi } from "@causal/shared";

export function useRedeemX(proposalAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({ hash });
  const error = writeError ?? receiptError;

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
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({ hash });
  const error = writeError ?? receiptError;

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
