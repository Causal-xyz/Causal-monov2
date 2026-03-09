"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { usePoolPrice } from "@/hooks/usePoolPrice";

interface PriceDisplayProps {
  readonly ammYesPair: `0x${string}`;
  readonly ammNoPair: `0x${string}`;
  readonly yesX: `0x${string}` | undefined;
  readonly noX: `0x${string}` | undefined;
  readonly usdc: `0x${string}`;
}

export function PriceDisplay({
  ammYesPair,
  ammNoPair,
  yesX,
  noX,
  usdc,
}: PriceDisplayProps) {
  const yesPool = usePoolPrice(ammYesPair, yesX, usdc);
  const noPool = usePoolPrice(ammNoPair, noX, usdc);

  const yesPrice = yesPool.price ?? 0;
  const noPrice = noPool.price ?? 0;
  const total = yesPrice + noPrice;
  const yesPct = total > 0 ? (yesPrice / total) * 100 : 50;
  const noPct = total > 0 ? (noPrice / total) * 100 : 50;

  return (
    <div className="grid grid-cols-2 gap-3">
      <PriceCard
        label="YES"
        price={yesPrice}
        probability={yesPct}
        isLoading={yesPool.isLoading}
        hasLiquidity={yesPool.liquidity !== null && yesPool.liquidity > 0n}
        variant="yes"
      />
      <PriceCard
        label="NO"
        price={noPrice}
        probability={noPct}
        isLoading={noPool.isLoading}
        hasLiquidity={noPool.liquidity !== null && noPool.liquidity > 0n}
        variant="no"
      />
    </div>
  );
}

function PriceCard({
  label,
  price,
  probability,
  isLoading,
  hasLiquidity,
  variant,
}: {
  readonly label: string;
  readonly price: number;
  readonly probability: number;
  readonly isLoading: boolean;
  readonly hasLiquidity: boolean;
  readonly variant: "yes" | "no";
}) {
  const isYes = variant === "yes";
  const borderClass = isYes ? "border-causal/20 bg-causal/5" : "border-destructive/20 bg-destructive/5";
  const textClass = isYes ? "text-causal" : "text-destructive";
  const Icon = isYes ? TrendingUp : TrendingDown;

  return (
    <div className={`rounded-lg border p-3 ${borderClass}`}>
      <div className="mb-1 flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 ${textClass}`} />
        <span className={`text-xs font-semibold ${textClass}`}>{label}</span>
      </div>

      {isLoading ? (
        <div className="h-6 w-20 animate-pulse rounded bg-muted/40" />
      ) : !hasLiquidity ? (
        <div className="text-xs text-muted-foreground">No liquidity</div>
      ) : (
        <>
          <div className="text-lg font-bold tabular-nums">
            ${price.toFixed(4)}
          </div>
          <div className="text-xs text-muted-foreground">
            {probability.toFixed(1)}% implied
          </div>
        </>
      )}
    </div>
  );
}
