"use client";

import { useState } from "react";
import { parseUnits, formatUnits } from "viem";
import { Button } from "@/components/ui/button";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useApprovalFlow } from "@/hooks/useApprovalFlow";
import { useSwapExactInput, useSwapExactOutput } from "@/hooks/useSwap";
import { usePoolPrice } from "@/hooks/usePoolPrice";
import { useSwapValidation, parseSwapError } from "@/hooks/useSwapValidation";
import { useOnceOnSuccess } from "@/hooks/useOnceOnSuccess";
import { useTransactionToast } from "@/hooks/useTransactionToast";
import { CONTRACTS } from "@causal/shared";
import { Loader2, ArrowRightLeft, Settings2, AlertTriangle } from "lucide-react";

type Market = "yes" | "no";
type Direction = "buy" | "sell";
type SwapMode = "exactInput" | "exactOutput";

const SLIPPAGE_OPTIONS = [0.5, 1, 3] as const;

interface TradingPanelProps {
  readonly yesX: `0x${string}` | undefined;
  readonly noX: `0x${string}` | undefined;
  readonly usdc: `0x${string}`;
  readonly ammYesPair: `0x${string}`;
  readonly ammNoPair: `0x${string}`;
  readonly userAddress: `0x${string}` | undefined;
  readonly onSuccess: () => void;
}

export function TradingPanel({
  yesX,
  noX,
  usdc,
  ammYesPair,
  ammNoPair,
  userAddress,
  onSuccess,
}: TradingPanelProps) {
  const [market, setMarket] = useState<Market>("yes");
  const [direction, setDirection] = useState<Direction>("buy");
  const [swapMode, setSwapMode] = useState<SwapMode>("exactInput");
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState(1);
  const [customSlippage, setCustomSlippage] = useState("");
  const [showSlippage, setShowSlippage] = useState(false);

  const conditionalToken = market === "yes" ? yesX : noX;
  const poolAddress = market === "yes" ? ammYesPair : ammNoPair;

  // Price data
  const pool = usePoolPrice(poolAddress, conditionalToken, usdc);

  // Determine tokenIn / tokenOut based on direction
  // buy = pay USDC, receive conditional token
  // sell = pay conditional token, receive USDC
  const tokenIn = direction === "buy" ? usdc : conditionalToken;
  const tokenOut = direction === "buy" ? conditionalToken : usdc;
  const tokenInDecimals = direction === "buy" ? 6 : 18;
  const tokenOutDecimals = direction === "buy" ? 18 : 6;

  // Effective slippage (custom takes priority over preset)
  const effectiveSlippage = getEffectiveSlippage(customSlippage, slippage);

  // Balance of the input token
  const { balance: inputBalance, symbol: inputSymbol, refetch: refetchInput } =
    useTokenBalance(tokenIn, userAddress);
  // Balance of the output token (for display)
  const { refetch: refetchOutput } = useTokenBalance(tokenOut, userAddress);

  const parsedAmount = amount ? parseUnits(amount, swapMode === "exactInput" ? tokenInDecimals : tokenOutDecimals) : 0n;

  // For exactInput: approve tokenIn
  // For exactOutput: approve tokenIn (with amountInMaximum)
  const approvalAmount = swapMode === "exactInput"
    ? parsedAmount
    : estimateMaxInput(parsedAmount, pool.price, direction, effectiveSlippage);
  const approval = useApprovalFlow(tokenIn, CONTRACTS.swapRouter, userAddress, approvalAmount);

  // Pre-validate swap (checks balance, allowance, pool liquidity, factory pool lookup)
  const validation = useSwapValidation(
    tokenIn,
    tokenOut,
    pool.fee,
    CONTRACTS.swapRouter,
    userAddress,
    poolAddress,
    swapMode === "exactInput" ? parsedAmount : approvalAmount,
  );

  // Swap hooks
  const exactInput = useSwapExactInput();
  const exactOutput = useSwapExactOutput();
  const activeSwap = swapMode === "exactInput" ? exactInput : exactOutput;

  const isProcessing =
    activeSwap.isPending || activeSwap.isConfirming ||
    approval.isApprovePending || approval.isApproveConfirming;

  // Pool fee rate for estimation (e.g., 3000 → 0.003)
  const feeRate = pool.fee !== null ? pool.fee / 1_000_000 : 0;

  // Estimate output/input for display (accounting for pool fee)
  const estimatedAmount = estimateSwapResult(parsedAmount, pool.price, direction, swapMode, tokenInDecimals, tokenOutDecimals, feeRate);

  // Success handler
  const handleSwapSuccess = () => {
    setAmount("");
    refetchInput();
    refetchOutput();
    pool.refetch();
    onSuccess();
  };

  useOnceOnSuccess(exactInput.isSuccess, handleSwapSuccess, exactInput.hash);
  useOnceOnSuccess(exactOutput.isSuccess, handleSwapSuccess, exactOutput.hash);

  const marketLabel = market === "yes" ? "yesX" : "noX";

  useTransactionToast({
    hash: activeSwap.hash,
    isConfirming: activeSwap.isConfirming,
    isSuccess: activeSwap.isSuccess,
    error: activeSwap.error,
    labels: {
      success: `Swap confirmed!`,
      pending: `Swapping ${marketLabel}...`,
    },
  });

  function handleSwap() {
    if (!userAddress || !tokenIn || !tokenOut || !pool.fee || parsedAmount === 0n) return;

    if (approval.needsApproval) {
      approval.requestApproval();
      return;
    }

    const fee = Number(pool.fee);

    if (swapMode === "exactInput") {
      const minOut = applySlippage(estimatedAmount, effectiveSlippage, false);
      exactInput.swap({
        tokenIn: tokenIn!,
        tokenOut: tokenOut!,
        fee,
        recipient: userAddress,
        amountIn: parsedAmount,
        amountOutMinimum: minOut,
      });
    } else {
      const maxIn = applySlippage(estimatedAmount, effectiveSlippage, true);
      exactOutput.swap({
        tokenIn: tokenIn!,
        tokenOut: tokenOut!,
        fee,
        recipient: userAddress,
        amountOut: parsedAmount,
        amountInMaximum: maxIn,
      });
    }
  }

  function setMaxAmount() {
    if (swapMode === "exactInput" && inputBalance > 0n) {
      setAmount(formatUnits(inputBalance, tokenInDecimals));
    }
  }

  return (
    <div className="space-y-3 border-t border-border/50 pt-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <ArrowRightLeft className="h-4 w-4 text-causal" />
          Trade
        </h3>
        <button
          onClick={() => setShowSlippage(!showSlippage)}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted/50"
        >
          <Settings2 className="h-3 w-3" />
          {effectiveSlippage}%
        </button>
      </div>

      {/* Slippage settings */}
      {showSlippage && (
        <div className="rounded-lg border border-border/50 bg-muted/20 p-2">
          <div className="mb-1.5 text-xs text-muted-foreground">Slippage tolerance</div>
          <div className="flex items-center gap-1.5">
            {SLIPPAGE_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => { setSlippage(opt); setCustomSlippage(""); }}
                className={`rounded px-2 py-1 text-xs transition-colors ${
                  slippage === opt && !customSlippage
                    ? "bg-causal text-primary-foreground"
                    : "bg-muted/50 hover:bg-muted"
                }`}
              >
                {opt}%
              </button>
            ))}
            <input
              type="text"
              value={customSlippage}
              onChange={(e) => setCustomSlippage(e.target.value)}
              placeholder="Custom"
              className="w-16 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs outline-none focus:border-causal/50"
            />
          </div>
        </div>
      )}

      {/* Market selector */}
      <div className="flex gap-1.5">
        <button
          onClick={() => { setMarket("yes"); setAmount(""); }}
          className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
            market === "yes"
              ? "bg-causal/15 text-causal border border-causal/30"
              : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent"
          }`}
        >
          YES Market
        </button>
        <button
          onClick={() => { setMarket("no"); setAmount(""); }}
          className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
            market === "no"
              ? "bg-destructive/15 text-destructive border border-destructive/30"
              : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent"
          }`}
        >
          NO Market
        </button>
      </div>

      {/* Direction selector */}
      <div className="flex gap-1.5">
        <button
          onClick={() => { setDirection("buy"); setAmount(""); }}
          className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
            direction === "buy"
              ? "bg-causal/10 text-causal border border-causal/20"
              : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent"
          }`}
        >
          Buy {marketLabel}
        </button>
        <button
          onClick={() => { setDirection("sell"); setAmount(""); }}
          className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
            direction === "sell"
              ? "bg-destructive/10 text-destructive border border-destructive/20"
              : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent"
          }`}
        >
          Sell {marketLabel}
        </button>
      </div>

      {/* Swap mode selector */}
      <div className="flex gap-1.5">
        <button
          onClick={() => { setSwapMode("exactInput"); setAmount(""); }}
          className={`flex-1 rounded-md px-2 py-1 text-xs transition-colors ${
            swapMode === "exactInput"
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:bg-muted/50"
          }`}
        >
          Exact Input
        </button>
        <button
          onClick={() => { setSwapMode("exactOutput"); setAmount(""); }}
          className={`flex-1 rounded-md px-2 py-1 text-xs transition-colors ${
            swapMode === "exactOutput"
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:bg-muted/50"
          }`}
        >
          Exact Output
        </button>
      </div>

      {/* Amount input */}
      <div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {swapMode === "exactInput" ? "You pay" : "You receive"}
          </span>
          {swapMode === "exactInput" && (
            <button onClick={setMaxAmount} className="hover:text-causal">
              Bal: {formatBalance(inputBalance, tokenInDecimals)} {inputSymbol}
            </button>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-base outline-none transition-colors focus:border-causal/50"
          />
          {swapMode === "exactInput" && (
            <Button variant="outline" size="sm" onClick={setMaxAmount}>
              MAX
            </Button>
          )}
        </div>
      </div>

      {/* Estimated output/input */}
      {parsedAmount > 0n && pool.price !== null && (
        <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5 text-sm">
          <div className="text-xs text-muted-foreground">
            {swapMode === "exactInput" ? "Estimated output" : "Estimated cost"}
          </div>
          <div className="mt-0.5 font-medium">
            ~{formatBigint(estimatedAmount, swapMode === "exactInput" ? tokenOutDecimals : tokenInDecimals)}{" "}
            {swapMode === "exactInput"
              ? (direction === "buy" ? marketLabel : "USDC")
              : (direction === "buy" ? "USDC" : marketLabel)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Slippage: {effectiveSlippage}% · Price: ${pool.price.toFixed(4)}/{marketLabel}
            {feeRate > 0 && ` · Fee: ${(feeRate * 100).toFixed(2)}%`}
          </div>
        </div>
      )}

      {/* Pool depth warning */}
      {parsedAmount > 0n && estimatedAmount > 0n && pool.liquidity && pool.sqrtPriceX96 && conditionalToken && (() => {
        const maxOut = estimateMaxPoolOutput(pool.liquidity, pool.sqrtPriceX96, direction, conditionalToken, usdc, tokenOutDecimals);
        return maxOut > 0n && estimatedAmount > maxOut ? (
          <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-2">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-400" />
            <span className="text-xs text-yellow-400">
              Amount exceeds pool depth (~{formatBigint(maxOut, tokenOutDecimals)} {direction === "buy" ? marketLabel : "USDC"} available). Reduce your amount.
            </span>
          </div>
        ) : null;
      })()}

      {/* Validation warning */}
      {validation.error && (
        <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-2">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-400" />
          <span className="text-xs text-yellow-400">{validation.error}</span>
        </div>
      )}

      {/* Action button */}
      <Button
        onClick={handleSwap}
        disabled={!userAddress || parsedAmount === 0n || isProcessing || !pool.fee || !validation.isValid}
        className="btn-glow w-full border-0 text-primary-foreground"
        size="sm"
      >
        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!userAddress
          ? "Connect wallet"
          : parsedAmount === 0n
            ? "Enter amount"
            : !validation.isValid
              ? validation.error ?? "Cannot swap"
              : approval.needsApproval
                ? `Approve ${inputSymbol}`
                : direction === "buy"
                  ? `Buy ${marketLabel}`
                  : `Sell ${marketLabel}`}
      </Button>

      {/* Swap error with decoded message */}
      {activeSwap.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive whitespace-pre-line">
          {parseSwapError(activeSwap.error)}
        </div>
      )}

      {/* Debug info (collapsed) */}
      {activeSwap.error && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer hover:text-foreground">Debug details</summary>
          <pre className="mt-1 max-h-32 overflow-auto rounded border border-border/30 bg-muted/20 p-2 font-mono text-[10px]">
            {JSON.stringify({
              tokenIn: tokenIn ?? "undefined",
              tokenOut: tokenOut ?? "undefined",
              fee: pool.fee,
              poolAddress,
              factoryPoolAddress: validation.factoryPoolAddress,
              poolMatch: validation.factoryPoolAddress?.toLowerCase() === poolAddress?.toLowerCase() ? "MATCH" : "MISMATCH",
              amountIn: swapMode === "exactInput" ? parsedAmount.toString() : undefined,
              amountOut: swapMode === "exactOutput" ? parsedAmount.toString() : undefined,
              amountOutMinimum: swapMode === "exactInput" ? applySlippage(estimatedAmount, effectiveSlippage, false).toString() : undefined,
              amountInMaximum: swapMode === "exactOutput" ? applySlippage(estimatedAmount, effectiveSlippage, true).toString() : undefined,
              price: pool.price,
              liquidity: pool.liquidity?.toString(),
              slippage: effectiveSlippage,
              swapRouter: CONTRACTS.swapRouter,
              uniswapV3Factory: CONTRACTS.uniswapV3Factory,
            }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

/** Resolve effective slippage from custom input or preset */
function getEffectiveSlippage(customSlippage: string, presetSlippage: number): number {
  if (!customSlippage) return presetSlippage;
  const parsed = parseFloat(customSlippage);
  return isNaN(parsed) || parsed <= 0 ? presetSlippage : parsed;
}

/** Estimate the max input for exactOutput mode (for approval amount) */
function estimateMaxInput(
  amountOut: bigint,
  price: number | null,
  direction: Direction,
  slippage: number,
): bigint {
  if (!price || price === 0 || amountOut === 0n) return 0n;

  const inputDecimals = direction === "buy" ? 6 : 18;
  const outputDecimals = direction === "buy" ? 18 : 6;

  const amountOutNum = Number(formatUnits(amountOut, outputDecimals));
  const estimatedInput = direction === "buy"
    ? amountOutNum * price
    : amountOutNum / price;

  const withSlippage = estimatedInput * (1 + slippage / 100);
  return parseUnits(withSlippage.toFixed(inputDecimals), inputDecimals);
}

/** Estimate swap result using spot price, accounting for pool fee */
function estimateSwapResult(
  amount: bigint,
  price: number | null,
  direction: Direction,
  swapMode: SwapMode,
  tokenInDecimals: number,
  tokenOutDecimals: number,
  feeRate: number,
): bigint {
  if (!price || price === 0 || amount === 0n) return 0n;

  // Pool fee reduces the effective input
  const afterFee = 1 - feeRate;

  if (swapMode === "exactInput") {
    const amountNum = Number(formatUnits(amount, tokenInDecimals));
    const effectiveInput = amountNum * afterFee;
    const estimated = direction === "buy"
      ? effectiveInput / price   // USDC → conditional: divide by price
      : effectiveInput * price;  // conditional → USDC: multiply by price
    return parseUnits(estimated.toFixed(tokenOutDecimals), tokenOutDecimals);
  }

  // exactOutput: amount is in tokenOut units → estimate tokenIn (before fee)
  const amountNum = Number(formatUnits(amount, tokenOutDecimals));
  const rawEstimate = direction === "buy"
    ? amountNum * price   // Want X conditional tokens → cost = X * price USDC
    : amountNum / price;  // Want X USDC → cost = X / price tokens
  // Need to pay more to cover the fee
  const estimated = afterFee > 0 ? rawEstimate / afterFee : rawEstimate;
  return parseUnits(estimated.toFixed(tokenInDecimals), tokenInDecimals);
}

/** Estimate max output available from pool depth using L and sqrtPriceX96 */
function estimateMaxPoolOutput(
  liquidity: bigint,
  sqrtPriceX96: bigint,
  direction: Direction,
  conditionalToken: `0x${string}`,
  usdcToken: `0x${string}`,
  tokenOutDecimals: number,
): bigint {
  const Q96 = 2n ** 96n;
  const conditionalIsToken0 = conditionalToken.toLowerCase() < usdcToken.toLowerCase();
  // buying conditional: pool provides token0 (if conditionalIsToken0) or token1
  // selling conditional: pool provides USDC = the other token
  const providingToken0 =
    (direction === "buy" && conditionalIsToken0) ||
    (direction === "sell" && !conditionalIsToken0);

  try {
    const raw = providingToken0
      ? (liquidity * Q96) / sqrtPriceX96
      : (liquidity * sqrtPriceX96) / Q96;
    // sanity check: if out decimals are 18, raw is in token0 units already
    return raw;
  } catch {
    return 0n;
  }
}

/** Apply slippage tolerance to an estimated amount */
function applySlippage(amount: bigint, slippagePct: number, increase: boolean): bigint {
  const factor = increase ? 1 + slippagePct / 100 : 1 - slippagePct / 100;
  const bps = BigInt(Math.round(factor * 10000));
  return (amount * bps) / 10000n;
}

function formatBalance(balance: bigint, decimals: number): string {
  return parseFloat(formatUnits(balance, decimals)).toLocaleString(undefined, {
    maximumFractionDigits: 4,
  });
}

function formatBigint(value: bigint, decimals: number): string {
  return parseFloat(formatUnits(value, decimals)).toLocaleString(undefined, {
    maximumFractionDigits: 6,
  });
}
