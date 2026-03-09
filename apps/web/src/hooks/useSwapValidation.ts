"use client";

import { useReadContracts } from "wagmi";
import { erc20Abi, uniswapV3PoolAbi, CONTRACTS } from "@causal/shared";

/** Minimal ABI to call getPool on the Uniswap V3 Factory */
const factoryGetPoolAbi = [
  {
    type: "function",
    name: "getPool",
    inputs: [
      { name: "tokenA", type: "address" },
      { name: "tokenB", type: "address" },
      { name: "fee", type: "uint24" },
    ],
    outputs: [{ name: "pool", type: "address" }],
    stateMutability: "view",
  },
] as const;

interface ValidationResult {
  readonly isValid: boolean;
  readonly error: string | null;
  readonly isLoading: boolean;
  /** Pool address the factory returns for this token pair + fee */
  readonly factoryPoolAddress: `0x${string}` | null;
}

/**
 * Pre-validate a swap before sending the transaction.
 * Checks balance, allowance, pool liquidity, AND whether the
 * SwapRouter can find the pool via the factory's getPool().
 */
export function useSwapValidation(
  tokenIn: `0x${string}` | undefined,
  tokenOut: `0x${string}` | undefined,
  fee: number | null,
  spender: `0x${string}`,
  userAddress: `0x${string}` | undefined,
  poolAddress: `0x${string}` | undefined,
  amountIn: bigint,
): ValidationResult {
  const enabled = !!tokenIn && !!tokenOut && !!userAddress && !!poolAddress && fee !== null && amountIn > 0n;

  const { data, isLoading } = useReadContracts({
    contracts: [
      {
        address: tokenIn,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [userAddress!],
      },
      {
        address: tokenIn,
        abi: erc20Abi,
        functionName: "allowance",
        args: [userAddress!, spender],
      },
      {
        address: poolAddress,
        abi: uniswapV3PoolAbi,
        functionName: "liquidity",
      },
      // Critical: check what pool the factory thinks exists for this pair + fee
      {
        address: CONTRACTS.uniswapV3Factory,
        abi: factoryGetPoolAbi,
        functionName: "getPool",
        args: [tokenIn!, tokenOut!, fee!],
      },
    ],
    query: { enabled, refetchInterval: 10_000 },
  });

  if (!enabled || isLoading) {
    return { isValid: true, error: null, isLoading, factoryPoolAddress: null };
  }

  const balance = (data?.[0]?.result as bigint) ?? 0n;
  const allowance = (data?.[1]?.result as bigint) ?? 0n;
  const liquidity = (data?.[2]?.result as bigint) ?? 0n;
  const factoryPool = (data?.[3]?.result as `0x${string}`) ?? null;

  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

  // Check: does the factory know about this pool?
  if (!factoryPool || factoryPool === ZERO_ADDRESS) {
    return {
      isValid: false,
      error: `Factory has no pool for this pair + fee(${fee}). The pool at ${poolAddress?.slice(0, 10)}... was not created through the Uniswap V3 Factory at ${CONTRACTS.uniswapV3Factory.slice(0, 10)}...`,
      isLoading: false,
      factoryPoolAddress: factoryPool,
    };
  }

  // Check: does the factory pool match the proposal's ammYesPair/ammNoPair?
  if (factoryPool.toLowerCase() !== poolAddress?.toLowerCase()) {
    return {
      isValid: false,
      error: `Pool address mismatch! Factory returns ${factoryPool.slice(0, 10)}... but proposal has ${poolAddress?.slice(0, 10)}... — the SwapRouter cannot find this pool`,
      isLoading: false,
      factoryPoolAddress: factoryPool,
    };
  }

  if (balance < amountIn) {
    return { isValid: false, error: "Insufficient token balance", isLoading: false, factoryPoolAddress: factoryPool };
  }

  if (allowance < amountIn) {
    // Not an error — approval will be requested first
    return { isValid: true, error: null, isLoading: false, factoryPoolAddress: factoryPool };
  }

  if (liquidity === 0n) {
    return { isValid: false, error: "Pool has zero liquidity — no trades possible", isLoading: false, factoryPoolAddress: factoryPool };
  }

  return { isValid: true, error: null, isLoading: false, factoryPoolAddress: factoryPool };
}

/** Known Uniswap V3 revert codes → human-readable messages */
const UNISWAP_ERROR_MAP: Record<string, string> = {
  AS: "Swap amount is zero",
  SPL: "Price limit exceeded — try a smaller amount or higher slippage",
  IIA: "Insufficient input amount — pool did not receive enough tokens (check approval)",
  STF: "Token transfer failed — check balance and approval to the SwapRouter",
  LOK: "Pool is locked (reentrancy guard)",
  L: "Pool is locked",
  TLU: "Tick lower must be less than tick upper",
  TLM: "Tick lower is below minimum",
  TUM: "Tick upper is above maximum",
  AI: "Liquidity amount cannot be negative",
  M0: "Insufficient token0 minted",
  M1: "Insufficient token1 minted",
  F0: "Fees owed on token0 must be positive",
  F1: "Fees owed on token1 must be positive",
  T: "Tick out of range",
  R: "sqrtPriceX96 out of range",
};

/**
 * Parse a swap error into a user-friendly message.
 * Handles Uniswap V3 short error codes and common wagmi/viem errors.
 */
export function parseSwapError(error: Error | null): string | null {
  if (!error) return null;

  const msg = error.message ?? "";

  // Check for known Uniswap V3 error codes in the message
  for (const [code, description] of Object.entries(UNISWAP_ERROR_MAP)) {
    if (msg.includes(`'${code}'`) || msg.includes(`"${code}"`) || msg.includes(`reverted: ${code}`)) {
      return `${description} (${code})`;
    }
  }

  if (msg.includes("User rejected") || msg.includes("user rejected")) {
    return "Transaction rejected by user";
  }

  if (msg.includes("insufficient funds")) {
    return "Insufficient gas (AVAX) to pay for transaction";
  }

  if (msg.includes("execution reverted")) {
    const reasonMatch = msg.match(/reason:\s*(.+?)(?:\n|$)/);
    if (reasonMatch?.[1] && reasonMatch[1] !== "undefined") {
      return `Reverted: ${reasonMatch[1]}`;
    }

    return "Transaction would revert. Possible causes:\n" +
      "• SwapRouter cannot find the pool (factory/INIT_CODE_HASH mismatch)\n" +
      "• Insufficient token balance or approval\n" +
      "• Pool has no liquidity in the target price range\n" +
      "• Amount too large relative to pool liquidity\n" +
      "• Try increasing slippage tolerance";
  }

  return msg.split("\n")[0] || "Unknown error";
}
