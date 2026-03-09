"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { mockUsdcAbi, CONTRACTS } from "@causal/shared";

export function useFaucet() {
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({
    hash,
  });
  const error = writeError ?? receiptError;

  function requestFaucet() {
    writeContract({
      address: CONTRACTS.mockUsdc,
      abi: mockUsdcAbi,
      functionName: "faucet",
    });
  }

  return { requestFaucet, hash, isPending, isConfirming, isSuccess, error };
}
