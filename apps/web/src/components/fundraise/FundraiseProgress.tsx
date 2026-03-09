"use client";

import { formatUnits } from "viem";

interface FundraiseProgressProps {
  readonly raised: bigint;
  readonly goal: bigint;
  readonly decimals?: number;
}

export function FundraiseProgress({
  raised,
  goal,
  decimals = 6,
}: FundraiseProgressProps) {
  const raisedNum = parseFloat(formatUnits(raised, decimals));
  const goalNum = parseFloat(formatUnits(goal, decimals));
  const pct = goalNum > 0 ? Math.min((raisedNum / goalNum) * 100, 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-causal">
          {raisedNum.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
          USDC
        </span>
        <span className="text-muted-foreground">
          of {goalNum.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
          USDC
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-gradient-to-r from-causal to-causal-dark transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-right text-xs text-muted-foreground">
        {pct.toFixed(1)}% funded
      </p>
    </div>
  );
}
