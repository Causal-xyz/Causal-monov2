"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { mockUsdcAbi, CONTRACTS } from "@causal/shared";

export function useFaucet() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  function requestFaucet() {
    writeContract({
      address: CONTRACTS.mockUsdc,
      abi: mockUsdcAbi,
      functionName: "faucet",
    });
  }

  return { requestFaucet, hash, isPending, isConfirming, isSuccess, error };
}
