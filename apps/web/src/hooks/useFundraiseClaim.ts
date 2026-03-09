"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { causalOrganizationsAbi, CONTRACTS } from "@causal/shared";

export function useFundraiseClaim() {
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({
    hash,
  });
  const error = writeError ?? receiptError;

  function claim(orgId: number) {
    writeContract({
      address: CONTRACTS.causalOrganizations,
      abi: causalOrganizationsAbi,
      functionName: "claim",
      args: [BigInt(orgId)],
    });
  }

  return { claim, hash, isPending, isConfirming, isSuccess, error };
}
