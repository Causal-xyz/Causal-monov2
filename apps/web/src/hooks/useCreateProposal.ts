"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { futarchyFactoryAbi, CONTRACTS } from "@causal/shared";

export function useCreateProposal() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function createProposal(params: {
    title: string;
    tokenX: `0x${string}`;
    usdc: `0x${string}`;
    resolutionTimestamp: bigint;
    transferToken: `0x${string}`;
    recipient: `0x${string}`;
    transferAmount: bigint;
    usdcRequested?: bigint;
    tokensToMint?: bigint;
    twapWindow?: number;
  }) {
    writeContract({
      address: CONTRACTS.factory,
      abi: futarchyFactoryAbi,
      functionName: "createProposal",
      args: [
        params.title,
        params.tokenX,
        params.usdc,
        params.resolutionTimestamp,
        params.transferToken,
        params.recipient,
        params.transferAmount,
        params.usdcRequested ?? 0n,
        params.tokensToMint ?? 0n,
        params.twapWindow ?? 3600,
      ],
    });
  }

  return { createProposal, hash, isPending, isConfirming, isSuccess, error };
}
