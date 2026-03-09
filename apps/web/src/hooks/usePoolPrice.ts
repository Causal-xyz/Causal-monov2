"use client";

import { useReadContracts } from "wagmi";
import { uniswapV3PoolAbi } from "@causal/shared";
import { sqrtPriceX96ToHumanPriceForPair } from "@/lib/sqrtPrice";

/**
 * Read current spot price from a Uniswap V3 pool.
 * Returns the price of conditionalToken denominated in USDC.
 */
export function usePoolPrice(
  poolAddress: `0x${string}` | undefined,
  conditionalToken: `0x${string}` | undefined,
  usdcAddress: `0x${string}` | undefined,
  conditionalDecimals: number = 18,
  usdcDecimals: number = 6,
) {
  const pool = { address: poolAddress, abi: uniswapV3PoolAbi } as const;

  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      { ...pool, functionName: "slot0" },
      { ...pool, functionName: "fee" },
      { ...pool, functionName: "liquidity" },
    ],
    query: {
      enabled: !!poolAddress && !!conditionalToken && !!usdcAddress,
      refetchInterval: 10_000,
    },
  });

  const slot0 = data?.[0]?.result as
    | readonly [bigint, number, number, number, number, number, boolean]
    | undefined;
  // fee() returns uint24 — viem may return number or bigint depending on version
  const rawFee = data?.[1]?.result;
  const fee = rawFee !== undefined && rawFee !== null ? Number(rawFee) : undefined;
  const liquidity = data?.[2]?.result as bigint | undefined;

  const sqrtPriceX96 = slot0?.[0] ?? null;
  const tick = slot0?.[1] ?? null;

  let price: number | null = null;
  if (sqrtPriceX96 && conditionalToken && usdcAddress) {
    price = sqrtPriceX96ToHumanPriceForPair(
      sqrtPriceX96,
      conditionalToken,
      conditionalDecimals,
      usdcAddress,
      usdcDecimals,
    );
  }

  return {
    price,
    sqrtPriceX96,
    tick,
    fee: fee ?? null,
    liquidity: liquidity ?? null,
    isLoading,
    refetch,
  };
}
