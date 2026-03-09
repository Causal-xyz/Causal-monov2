"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { causalOrganizationsAbi, CONTRACTS } from "@causal/shared";

export function useCommit() {
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({
    hash,
  });
  const error = writeError ?? receiptError;

  function commit(orgId: number, usdcAmount: bigint) {
    writeContract({
      address: CONTRACTS.causalOrganizations,
      abi: causalOrganizationsAbi,
      functionName: "commit",
      args: [BigInt(orgId), usdcAmount],
    });
  }

  return { commit, hash, isPending, isConfirming, isSuccess, error };
}
