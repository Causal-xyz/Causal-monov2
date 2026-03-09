"use client";

import { useState } from "react";
import { parseUnits, formatUnits } from "viem";
import { Button } from "@/components/ui/button";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useApprovalFlow } from "@/hooks/useApprovalFlow";
import { useSwapExactInput, useSwapExactOutput } from "@/hooks/useSwap";
import { usePoolPrice } from "@/hooks/usePoolPrice";
import { useOnceOnSuccess } from "@/hooks/useOnceOnSuccess";
import { useTransactionToast } from "@/hooks/useTransactionToast";
import { CONTRACTS } from "@causal/shared";
import { Loader2, ArrowRightLeft, Settings2 } from "lucide-react";

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
    : estimateMaxInput(parsedAmount, pool.price, direction, slippage);
  const approval = useApprovalFlow(tokenIn, CONTRACTS.swapRouter, userAddress, approvalAmount);

  // Swap hooks
  const exactInput = useSwapExactInput();
  const exactOutput = useSwapExactOutput();
  const activeSwap = swapMode === "exactInput" ? exactInput : exactOutput;

  const isProcessing =
    activeSwap.isPending || activeSwap.isConfirming ||
    approval.isApprovePending || approval.isApproveConfirming;

  // Estimate output/input for display
  const estimatedAmount = estimateSwapResult(parsedAmount, pool.price, direction, swapMode, tokenInDecimals, tokenOutDecimals);

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

    const fee = pool.fee;

    if (swapMode === "exactInput") {
      const minOut = applySlippage(estimatedAmount, slippage, false);
      exactInput.swap({
        tokenIn: tokenIn!,
        tokenOut: tokenOut!,
        fee,
        recipient: userAddress,
        amountIn: parsedAmount,
        amountOutMinimum: minOut,
      });
    } else {
      const maxIn = applySlippage(estimatedAmount, slippage, true);
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

  const effectiveSlippage = customSlippage ? parseFloat(customSlippage) : slippage;
  const activeSlippage = isNaN(effectiveSlippage) ? slippage : effectiveSlippage;

  // Use activeSlippage for calculations
  const displaySlippage = activeSlippage;

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
          {displaySlippage}%
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
              className="w-16 rounded border border-border bg-background px-2 py-1 text-xs outline-none focus:border-causal/50"
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
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-base outline-none transition-colors focus:border-causal/50"
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
            Slippage: {displaySlippage}% · Price: ${pool.price.toFixed(4)}/{marketLabel}
          </div>
        </div>
      )}

      {/* Action button */}
      <Button
        onClick={handleSwap}
        disabled={!userAddress || parsedAmount === 0n || isProcessing || !pool.fee}
        className="btn-glow w-full border-0 text-primary-foreground"
        size="sm"
      >
        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!userAddress
          ? "Connect wallet"
          : parsedAmount === 0n
            ? "Enter amount"
            : approval.needsApproval
              ? `Approve ${inputSymbol}`
              : direction === "buy"
                ? `Buy ${marketLabel}`
                : `Sell ${marketLabel}`}
      </Button>

      {activeSwap.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
          {activeSwap.error.message?.split("\n")[0]}
        </div>
      )}
    </div>
  );
}

/** Estimate the max input for exactOutput mode (for approval amount) */
function estimateMaxInput(
  amountOut: bigint,
  price: number | null,
  direction: Direction,
  slippage: number,
): bigint {
  if (!price || price === 0 || amountOut === 0n) return 0n;

  // For buy: paying USDC for conditional token → cost = amountOut * price (in USDC terms)
  // For sell: paying conditional token for USDC → cost = amountOut / price (in token terms)
  const inputDecimals = direction === "buy" ? 6 : 18;
  const outputDecimals = direction === "buy" ? 18 : 6;

  const amountOutNum = Number(formatUnits(amountOut, outputDecimals));
  const estimatedInput = direction === "buy"
    ? amountOutNum * price
    : amountOutNum / price;

  const withSlippage = estimatedInput * (1 + slippage / 100);
  return parseUnits(withSlippage.toFixed(inputDecimals), inputDecimals);
}

/** Estimate swap result using spot price */
function estimateSwapResult(
  amount: bigint,
  price: number | null,
  direction: Direction,
  swapMode: SwapMode,
  tokenInDecimals: number,
  tokenOutDecimals: number,
): bigint {
  if (!price || price === 0 || amount === 0n) return 0n;

  if (swapMode === "exactInput") {
    // amount is in tokenIn units → estimate tokenOut
    const amountNum = Number(formatUnits(amount, tokenInDecimals));
    const estimated = direction === "buy"
      ? amountNum / price   // USDC → conditional: divide by price
      : amountNum * price;  // conditional → USDC: multiply by price
    return parseUnits(estimated.toFixed(tokenOutDecimals), tokenOutDecimals);
  }

  // exactOutput: amount is in tokenOut units → estimate tokenIn
  const amountNum = Number(formatUnits(amount, tokenOutDecimals));
  const estimated = direction === "buy"
    ? amountNum * price   // Want X conditional tokens → cost = X * price USDC
    : amountNum / price;  // Want X USDC → cost = X / price tokens
  return parseUnits(estimated.toFixed(tokenInDecimals), tokenInDecimals);
}

/** Apply slippage tolerance to an estimated amount */
function applySlippage(amount: bigint, slippagePct: number, increase: boolean): bigint {
  const factor = increase ? 1 + slippagePct / 100 : 1 - slippagePct / 100;
  // Use integer math to avoid precision loss
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
