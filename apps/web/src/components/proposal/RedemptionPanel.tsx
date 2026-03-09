"use client";

import { useState, useEffect } from "react";
import { parseUnits, formatUnits } from "viem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useConditionalBalances } from "@/hooks/useConditionalBalances";
import { useRedeemX, useRedeemUsdc } from "@/hooks/useRedeem";
import { Trophy, Loader2 } from "lucide-react";
import type { Outcome } from "@causal/shared";

interface RedemptionPanelProps {
  readonly proposalAddress: `0x${string}`;
  readonly outcome: Outcome;
  readonly userAddress: `0x${string}` | undefined;
  readonly onSuccess: () => void;
}

export function RedemptionPanel({
  proposalAddress,
  outcome,
  userAddress,
  onSuccess,
}: RedemptionPanelProps) {
  const { balances, refetch: refetchCond } = useConditionalBalances(proposalAddress, userAddress);
  const redeemX = useRedeemX(proposalAddress);
  const redeemUsdc = useRedeemUsdc(proposalAddress);

  // Winning balances
  const winningX = outcome === "Yes" ? balances.yesX : balances.noX;
  const winningUsdc = outcome === "Yes" ? balances.yesUsdc : balances.noUsdc;

  useEffect(() => {
    if (redeemX.isSuccess || redeemUsdc.isSuccess) {
      refetchCond();
      onSuccess();
    }
  }, [redeemX.isSuccess, redeemUsdc.isSuccess]);

  if (!userAddress) {
    return (
      <Card className="glass-card rounded-xl border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-causal" />
            Redemption
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Connect your wallet to redeem winning tokens.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasWinningTokens = winningX > 0n || winningUsdc > 0n;

  return (
    <Card className="glass-card rounded-xl border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-causal" />
          Redemption
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-causal/20 bg-causal/5 p-3 text-sm">
          Outcome:{" "}
          <strong className={outcome === "Yes" ? "text-causal" : "text-destructive"}>
            {outcome}
          </strong>
          {" — "}
          {outcome === "Yes" ? "YES" : "NO"} token holders can redeem for underlying assets.
        </div>

        {!hasWinningTokens ? (
          <p className="text-sm text-muted-foreground">
            You don't have any winning tokens to redeem.
          </p>
        ) : (
          <div className="space-y-3">
            {winningX > 0n && (
              <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                <div>
                  <div className="text-xs text-muted-foreground">
                    {outcome === "Yes" ? "YES" : "NO"} X tokens
                  </div>
                  <div className="text-lg font-semibold">
                    {parseFloat(formatUnits(winningX, 18)).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                  </div>
                </div>
                <Button
                  size="sm"
                  className="btn-glow border-0 text-primary-foreground"
                  disabled={redeemX.isPending || redeemX.isConfirming}
                  onClick={() => redeemX.redeem(winningX, userAddress)}
                >
                  {redeemX.isPending || redeemX.isConfirming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Redeem X"
                  )}
                </Button>
              </div>
            )}

            {winningUsdc > 0n && (
              <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                <div>
                  <div className="text-xs text-muted-foreground">
                    {outcome === "Yes" ? "YES" : "NO"} USDC tokens
                  </div>
                  <div className="text-lg font-semibold">
                    {parseFloat(formatUnits(winningUsdc, 6)).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                  </div>
                </div>
                <Button
                  size="sm"
                  className="btn-glow border-0 text-primary-foreground"
                  disabled={redeemUsdc.isPending || redeemUsdc.isConfirming}
                  onClick={() => redeemUsdc.redeem(winningUsdc, userAddress)}
                >
                  {redeemUsdc.isPending || redeemUsdc.isConfirming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Redeem USDC"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {(redeemX.error || redeemUsdc.error) && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
            {(redeemX.error || redeemUsdc.error)?.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
