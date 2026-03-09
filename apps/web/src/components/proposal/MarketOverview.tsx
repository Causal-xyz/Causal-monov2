"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MarketOverviewProps {
  readonly proposal: {
    readonly outcome: "Unresolved" | "Yes" | "No";
    readonly hasAmms: boolean;
    readonly ammYesPair: `0x${string}`;
    readonly ammNoPair: `0x${string}`;
  };
}

export function MarketOverview({ proposal }: MarketOverviewProps) {
  if (!proposal.hasAmms) {
    return (
      <Card className="glass-card rounded-xl border-border">
        <CardHeader>
          <CardTitle className="text-lg">Market Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            AMMs have not been set up yet. The proposal owner needs to call{" "}
            <code className="rounded bg-muted px-1 text-xs">createAndSetAmms</code>{" "}
            to create the Uniswap V3 pools.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card rounded-xl border-border">
      <CardHeader>
        <CardTitle className="text-lg">Market Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* YES Market */}
          <div className="rounded-lg border border-causal/20 bg-causal/5 p-4">
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-causal" />
              <span className="text-sm font-semibold text-causal">YES Market</span>
            </div>
            <div className="truncate font-mono text-xs text-muted-foreground">
              {proposal.ammYesPair.slice(0, 10)}...
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              yesX / yesUSDC pool
            </div>
          </div>

          {/* NO Market */}
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="mb-2 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <span className="text-sm font-semibold text-destructive">NO Market</span>
            </div>
            <div className="truncate font-mono text-xs text-muted-foreground">
              {proposal.ammNoPair.slice(0, 10)}...
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              noX / noUSDC pool
            </div>
          </div>
        </div>

        {proposal.outcome === "Unresolved" && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Trade conditional tokens directly on Uniswap V3 using the pool addresses above.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
