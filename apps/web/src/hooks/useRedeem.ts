"use client";

import { useWriteContract, useWaitForTransactionReceipt, usePublicClient, useAccount } from "wagmi";
import { futarchyProposalAbi } from "@causal/shared";

export function useRedeemX(proposalAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({ hash });
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const error = writeError ?? receiptError;

  async function redeem(amount: bigint, receiver: `0x${string}`) {
    const nonce = address && publicClient
      ? await publicClient.getTransactionCount({ address, blockTag: "pending" })
      : undefined;
    writeContract({
      address: proposalAddress,
      abi: futarchyProposalAbi,
      functionName: "redeemWinningX",
      args: [amount, receiver],
      nonce,
    });
  }

  return { redeem, hash, isPending, isConfirming, isSuccess, error };
}

export function useRedeemUsdc(proposalAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({ hash });
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const error = writeError ?? receiptError;

  async function redeem(amount: bigint, receiver: `0x${string}`) {
    const nonce = address && publicClient
      ? await publicClient.getTransactionCount({ address, blockTag: "pending" })
      : undefined;
    writeContract({
      address: proposalAddress,
      abi: futarchyProposalAbi,
      functionName: "redeemWinningUsdc",
      args: [amount, receiver],
      nonce,
    });
  }

  return { redeem, hash, isPending, isConfirming, isSuccess, error };
}
