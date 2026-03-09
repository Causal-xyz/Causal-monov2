"use client";

import { useEffect } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { erc20Abi } from "@causal/shared";
import { maxUint256 } from "viem";

export function useApprovalFlow(
  tokenAddress: `0x${string}` | undefined,
  spenderAddress: `0x${string}` | undefined,
  ownerAddress: `0x${string}` | undefined,
  requiredAmount: bigint = 0n,
) {
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: [ownerAddress!, spenderAddress!],
    query: { enabled: !!tokenAddress && !!spenderAddress && !!ownerAddress },
  });

  const {
    writeContract: approve,
    data: approveHash,
    isPending: isApprovePending,
  } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } =
    useWaitForTransactionReceipt({ hash: approveHash });

  // Refetch allowance after approval tx confirms
  useEffect(() => {
    if (isApproveConfirmed) {
      refetchAllowance();
    }
  }, [isApproveConfirmed, refetchAllowance]);

  const currentAllowance = (allowance as bigint) ?? 0n;
  const needsApproval = currentAllowance < requiredAmount;

  function requestApproval() {
    if (!tokenAddress || !spenderAddress) return;
    approve({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "approve",
      args: [spenderAddress, maxUint256],
    });
  }

  return {
    needsApproval,
    currentAllowance,
    requestApproval,
    isApprovePending,
    isApproveConfirming,
    isApproveConfirmed,
    approveHash,
    refetchAllowance,
  };
}
