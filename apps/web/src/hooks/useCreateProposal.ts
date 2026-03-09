"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { futarchyFactoryAbi } from "@causal/shared";

export function useCreateProposal(factoryAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({ hash });
  const error = writeError ?? receiptError;

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
      address: factoryAddress,
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
      gas: 6_000_000n,
    });
  }

  return { createProposal, hash, isPending, isConfirming, isSuccess, error };
}
