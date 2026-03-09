"use client";

import { useState, useCallback } from "react";
import { parseUnits } from "viem";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CONTRACTS, FEE_TIERS } from "@causal/shared";
import { useSetupAmm } from "@/hooks/useSetupAmm";
import { useApprovalFlow } from "@/hooks/useApprovalFlow";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useTransactionToast } from "@/hooks/useTransactionToast";
import { computeSqrtPriceX96ForPair } from "@/lib/sqrtPrice";
import { Loader2, Zap } from "lucide-react";

interface SetupAmmPanelProps {
  readonly proposalAddress: `0x${string}`;
  readonly tokenX: `0x${string}`;
  readonly usdc: `0x${string}`;
  readonly onSuccess?: () => void;
}

interface AmmFormState {
  readonly feeTier: string;
  readonly tokenXSeed: string;
  readonly usdcSeed: string;
  readonly initialYesPrice: string;
  readonly initialNoPrice: string;
}

const FEE_OPTIONS = [
  { label: "0.05%", value: FEE_TIERS.LOW },
  { label: "0.3%", value: FEE_TIERS.MEDIUM },
  { label: "1%", value: FEE_TIERS.HIGH },
] as const;

export function SetupAmmPanel({ proposalAddress, tokenX, usdc, onSuccess }: SetupAmmPanelProps) {
  const { address } = useAccount();
  const [form, setForm] = useState<AmmFormState>({
    feeTier: String(FEE_TIERS.MEDIUM),
    tokenXSeed: "",
    usdcSeed: "",
    initialYesPrice: "1.0",
    initialNoPrice: "1.0",
  });

  const { balance: tokenXBalance, decimals: tokenXDecimals, symbol: tokenXSymbol } =
    useTokenBalance(tokenX, address);
  const { balance: usdcBalance, decimals: usdcDecimals, symbol: usdcSymbol } =
    useTokenBalance(usdc, address);

  const tokenXSeedParsed = safeParseUnits(form.tokenXSeed, tokenXDecimals);
  const usdcSeedParsed = safeParseUnits(form.usdcSeed, usdcDecimals);

  const tokenXApproval = useApprovalFlow(tokenX, proposalAddress, address, tokenXSeedParsed);
  const usdcApproval = useApprovalFlow(usdc, proposalAddress, address, usdcSeedParsed);

  const { setupAmm, hash, isPending, isConfirming, isSuccess, error } = useSetupAmm(proposalAddress);

  useTransactionToast({
    hash,
    isConfirming,
    isSuccess,
    error,
    labels: { success: "AMM pools created!", pending: "Setting up AMM pools..." },
  });

  // Trigger parent refetch on success
  if (isSuccess && onSuccess) {
    onSuccess();
  }

  const updateField = useCallback(
    (field: keyof AmmFormState, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  function handleSetup() {
    const yesPrice = parseFloat(form.initialYesPrice) || 1.0;
    const noPrice = parseFloat(form.initialNoPrice) || 1.0;

    const sqrtPriceYes = computeSqrtPriceX96ForPair(
      tokenX, tokenXDecimals, usdc, usdcDecimals, yesPrice,
    );
    const sqrtPriceNo = computeSqrtPriceX96ForPair(
      tokenX, tokenXDecimals, usdc, usdcDecimals, noPrice,
    );

    setupAmm({
      uniswapV3Factory: CONTRACTS.uniswapV3Factory,
      positionManager: CONTRACTS.positionManager,
      fee: parseInt(form.feeTier, 10),
      initialPriceYesXUsdcSqrtX96: sqrtPriceYes,
      initialPriceNoXUsdcSqrtX96: sqrtPriceNo,
      tokenXAmount: tokenXSeedParsed,
      usdcAmount: usdcSeedParsed,
    });
  }

  const needsTokenXApproval = tokenXApproval.needsApproval && tokenXSeedParsed > 0n;
  const needsUsdcApproval = usdcApproval.needsApproval && usdcSeedParsed > 0n;
  const approvingTokenX = tokenXApproval.isApprovePending || tokenXApproval.isApproveConfirming;
  const approvingUsdc = usdcApproval.isApprovePending || usdcApproval.isApproveConfirming;

  if (isSuccess) {
    return (
      <Card className="glass-card rounded-xl border-causal/30">
        <CardContent className="py-6 text-center">
          <Zap className="mx-auto mb-2 h-6 w-6 text-causal" />
          <p className="text-sm font-medium text-causal">AMM pools are live!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card rounded-xl border-causal/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-causal" />
          Set Up AMM Pools
        </CardTitle>
        <CardDescription>
          Provide seed liquidity to create Uniswap V3 pools for this proposal.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fee tier */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">Fee Tier</label>
          <div className="flex gap-2">
            {FEE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateField("feeTier", String(opt.value))}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  form.feeTier === String(opt.value)
                    ? "border-causal bg-causal/20 text-causal"
                    : "border-border bg-background hover:border-causal/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Seed amounts */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              {tokenXSymbol || "TokenX"} Amount
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={form.tokenXSeed}
              onChange={(e) => updateField("tokenXSeed", e.target.value)}
              placeholder="e.g. 100"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-causal/50 focus:ring-1 focus:ring-causal/30"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Balance: {formatBalance(tokenXBalance, tokenXDecimals)} {tokenXSymbol}
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              {usdcSymbol || "USDC"} Amount
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={form.usdcSeed}
              onChange={(e) => updateField("usdcSeed", e.target.value)}
              placeholder="e.g. 200"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-causal/50 focus:ring-1 focus:ring-causal/30"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Balance: {formatBalance(usdcBalance, usdcDecimals)} {usdcSymbol}
            </p>
          </div>
        </div>

        {/* Initial prices */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              YES Price ({usdcSymbol || "USDC"})
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={form.initialYesPrice}
              onChange={(e) => updateField("initialYesPrice", e.target.value)}
              placeholder="1.0"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-causal/50 focus:ring-1 focus:ring-causal/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              NO Price ({usdcSymbol || "USDC"})
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={form.initialNoPrice}
              onChange={(e) => updateField("initialNoPrice", e.target.value)}
              placeholder="1.0"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-causal/50 focus:ring-1 focus:ring-causal/30"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error.message}
          </div>
        )}

        {/* Multi-step buttons */}
        {needsTokenXApproval ? (
          <Button
            type="button"
            disabled={approvingTokenX}
            onClick={() => tokenXApproval.requestApproval()}
            className="btn-glow w-full border-0 py-3 text-primary-foreground"
          >
            {approvingTokenX ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Approving {tokenXSymbol}...
              </>
            ) : (
              `Step 1/3: Approve ${tokenXSymbol || "TokenX"}`
            )}
          </Button>
        ) : needsUsdcApproval ? (
          <Button
            type="button"
            disabled={approvingUsdc}
            onClick={() => usdcApproval.requestApproval()}
            className="btn-glow w-full border-0 py-3 text-primary-foreground"
          >
            {approvingUsdc ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Approving {usdcSymbol}...
              </>
            ) : (
              `Step 2/3: Approve ${usdcSymbol || "USDC"}`
            )}
          </Button>
        ) : (
          <Button
            type="button"
            disabled={!address || isPending || isConfirming || tokenXSeedParsed === 0n || usdcSeedParsed === 0n}
            onClick={handleSetup}
            className="btn-glow w-full border-0 py-3 text-primary-foreground"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirm in wallet...
              </>
            ) : isConfirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating AMM pools...
              </>
            ) : (
              "Step 3/3: Create AMM Pools"
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function safeParseUnits(value: string, decimals: number): bigint {
  try {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "0") return 0n;
    return parseUnits(trimmed, decimals);
  } catch {
    return 0n;
  }
}

function formatBalance(balance: bigint, decimals: number): string {
  const divisor = 10 ** decimals;
  const num = Number(balance) / divisor;
  return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
}
