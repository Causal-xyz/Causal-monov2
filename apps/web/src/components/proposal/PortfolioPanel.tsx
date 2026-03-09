"use client";

import { formatUnits } from "viem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConditionalBalances } from "@/hooks/useConditionalBalances";
import { Wallet } from "lucide-react";

interface PortfolioPanelProps {
  readonly proposalAddress: `0x${string}`;
  readonly userAddress: `0x${string}` | undefined;
}

function formatBalance(value: bigint, decimals: number = 18): string {
  return parseFloat(formatUnits(value, decimals)).toLocaleString(undefined, {
    maximumFractionDigits: 4,
  });
}

export function PortfolioPanel({ proposalAddress, userAddress }: PortfolioPanelProps) {
  const { balances, isLoading } = useConditionalBalances(proposalAddress, userAddress);

  if (!userAddress) {
    return (
      <Card className="glass-card rounded-xl border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="h-5 w-5 text-causal" />
            Your Portfolio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Connect your wallet to see your conditional token balances.
          </p>
        </CardContent>
      </Card>
    );
  }

  const tokens = [
    { label: "YES X", value: balances.yesX, color: "text-causal" },
    { label: "NO X", value: balances.noX, color: "text-destructive" },
    { label: "YES USDC", value: balances.yesUsdc, color: "text-causal" },
    { label: "NO USDC", value: balances.noUsdc, color: "text-destructive" },
  ] as const;

  const hasAnyBalance = tokens.some((t) => t.value > 0n);

  return (
    <Card className="glass-card rounded-xl border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wallet className="h-5 w-5 text-causal" />
          Your Portfolio
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !hasAnyBalance ? (
          <p className="text-sm text-muted-foreground">
            No conditional tokens yet. Split some tokens to get started.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {tokens.map((token) => (
              <div
                key={token.label}
                className="rounded-lg border border-border/50 p-3"
              >
                <div className="text-xs text-muted-foreground">{token.label}</div>
                <div className={`mt-1 text-lg font-semibold ${token.color}`}>
                  {formatBalance(token.value)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
