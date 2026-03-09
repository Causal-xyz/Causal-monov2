"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { futarchyProposalAbi } from "@causal/shared";

export interface SetupAmmParams {
  readonly uniswapV3Factory: `0x${string}`;
  readonly positionManager: `0x${string}`;
  readonly fee: number;
  readonly initialPriceYesXUsdcSqrtX96: bigint;
  readonly initialPriceNoXUsdcSqrtX96: bigint;
  readonly tokenXAmount: bigint;
  readonly usdcAmount: bigint;
}

export function useSetupAmm(proposalAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: receiptError } =
    useWaitForTransactionReceipt({ hash });
  const error = writeError ?? receiptError;

  function setupAmm(params: SetupAmmParams) {
    writeContract({
      address: proposalAddress,
      abi: futarchyProposalAbi,
      functionName: "setupAmmWithLiquidity",
      args: [
        params.uniswapV3Factory,
        params.positionManager,
        params.fee,
        params.initialPriceYesXUsdcSqrtX96,
        params.initialPriceNoXUsdcSqrtX96,
        params.tokenXAmount,
        params.usdcAmount,
      ],
      gas: 12_000_000n,
    });
  }

  return { setupAmm, hash, isPending, isConfirming, isSuccess, error };
}
