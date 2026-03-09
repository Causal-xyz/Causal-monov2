"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { futarchyFactoryAbi } from "@causal/shared";

export interface CreateProposalWithAmmParams {
  readonly title: string;
  readonly tokenX: `0x${string}`;
  readonly usdc: `0x${string}`;
  readonly resolutionTimestamp: bigint;
  readonly transferToken: `0x${string}`;
  readonly recipient: `0x${string}`;
  readonly transferAmount: bigint;
  readonly usdcRequested?: bigint;
  readonly tokensToMint?: bigint;
  readonly twapWindow?: number;
  readonly uniswapV3Factory: `0x${string}`;
  readonly positionManager: `0x${string}`;
  readonly fee: number;
  readonly initialPriceYesXUsdcSqrtX96: bigint;
  readonly initialPriceNoXUsdcSqrtX96: bigint;
  readonly tokenXAmount: bigint;
  readonly usdcAmount: bigint;
}

export function useCreateProposalWithAmm(factoryAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: receiptError } =
    useWaitForTransactionReceipt({ hash });
  const error = writeError ?? receiptError;

  function createProposalWithAmm(params: CreateProposalWithAmmParams) {
    writeContract({
      address: factoryAddress,
      abi: futarchyFactoryAbi,
      functionName: "createProposalWithAmm",
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
        params.uniswapV3Factory,
        params.positionManager,
        params.fee,
        params.initialPriceYesXUsdcSqrtX96,
        params.initialPriceNoXUsdcSqrtX96,
        params.tokenXAmount,
        params.usdcAmount,
      ],
    });
  }

  return { createProposalWithAmm, hash, isPending, isConfirming, isSuccess, error };
}
