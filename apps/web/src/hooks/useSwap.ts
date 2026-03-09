"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { swapRouterAbi, CONTRACTS } from "@causal/shared";

interface SwapExactInputParams {
  readonly tokenIn: `0x${string}`;
  readonly tokenOut: `0x${string}`;
  readonly fee: number;
  readonly recipient: `0x${string}`;
  readonly amountIn: bigint;
  readonly amountOutMinimum: bigint;
}

interface SwapExactOutputParams {
  readonly tokenIn: `0x${string}`;
  readonly tokenOut: `0x${string}`;
  readonly fee: number;
  readonly recipient: `0x${string}`;
  readonly amountOut: bigint;
  readonly amountInMaximum: bigint;
}

export function useSwapExactInput() {
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: receiptError } =
    useWaitForTransactionReceipt({ hash });
  const error = writeError ?? receiptError;

  function swap(params: SwapExactInputParams) {
    writeContract({
      address: CONTRACTS.swapRouter,
      abi: swapRouterAbi,
      functionName: "exactInputSingle",
      args: [
        {
          tokenIn: params.tokenIn,
          tokenOut: params.tokenOut,
          fee: params.fee,
          recipient: params.recipient,
          amountIn: params.amountIn,
          amountOutMinimum: params.amountOutMinimum,
          sqrtPriceLimitX96: 0n,
        },
      ],
    });
  }

  return { swap, hash, isPending, isConfirming, isSuccess, error };
}

export function useSwapExactOutput() {
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: receiptError } =
    useWaitForTransactionReceipt({ hash });
  const error = writeError ?? receiptError;

  function swap(params: SwapExactOutputParams) {
    writeContract({
      address: CONTRACTS.swapRouter,
      abi: swapRouterAbi,
      functionName: "exactOutputSingle",
      args: [
        {
          tokenIn: params.tokenIn,
          tokenOut: params.tokenOut,
          fee: params.fee,
          recipient: params.recipient,
          amountOut: params.amountOut,
          amountInMaximum: params.amountInMaximum,
          sqrtPriceLimitX96: 0n,
        },
      ],
    });
  }

  return { swap, hash, isPending, isConfirming, isSuccess, error };
}
