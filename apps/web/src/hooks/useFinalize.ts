"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { causalOrganizationsAbi, CONTRACTS } from "@causal/shared";

export function useFinalizeRaise() {
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({
    hash,
  });
  const error = writeError ?? receiptError;

  function finalizeRaise(orgId: number, finalCap: bigint) {
    writeContract({
      address: CONTRACTS.causalOrganizations,
      abi: causalOrganizationsAbi,
      functionName: "finalizeRaise",
      args: [BigInt(orgId), finalCap],
    });
  }

  return { finalizeRaise, hash, isPending, isConfirming, isSuccess, error };
}

export function useForceFinalize() {
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({
    hash,
  });
  const error = writeError ?? receiptError;

  function forceFinalize(orgId: number) {
    writeContract({
      address: CONTRACTS.causalOrganizations,
      abi: causalOrganizationsAbi,
      functionName: "forceFinalize",
      args: [BigInt(orgId)],
    });
  }

  return { forceFinalize, hash, isPending, isConfirming, isSuccess, error };
}
