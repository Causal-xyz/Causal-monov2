"use client";

import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useFundraiseClaim } from "@/hooks/useFundraiseClaim";
import { useUserContribution } from "@/hooks/useUserContribution";
import { useOnceOnSuccess } from "@/hooks/useOnceOnSuccess";
import { useTransactionToast } from "@/hooks/useTransactionToast";

interface ClaimPanelProps {
  readonly orgId: number;
  readonly finalized: boolean;
  readonly successful: boolean;
  readonly tokenSymbol: string;
  readonly onSuccess?: () => void;
}

const USDC_DECIMALS = 6;
const TOKEN_DECIMALS = 18;

export function ClaimPanel({
  orgId,
  finalized,
  successful,
  tokenSymbol,
  onSuccess,
}: ClaimPanelProps) {
  const { address, isConnected } = useAccount();
  const { committed, hasClaimed, allocation } = useUserContribution(
    orgId,
    address,
  );
  const { claim, hash, isPending, isConfirming, isSuccess, error } =
    useFundraiseClaim();

  useOnceOnSuccess(isSuccess, onSuccess, hash);

  useTransactionToast({
    hash,
    isConfirming,
    isSuccess,
    error,
    labels: {
      success: successful ? "Tokens claimed!" : "Refund claimed!",
      pending: successful ? "Claiming tokens..." : "Claiming refund...",
    },
  });

  const hasContributed = committed > 0n;

  if (!hasContributed || !finalized) return null;

  const handleClaim = () => claim(orgId);

  return (
    <Card className="glass-card rounded-xl border-border">
      <CardHeader>
        <CardTitle className="text-base">
          {successful ? "Claim Tokens" : "Claim Refund"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 rounded-lg bg-muted/50 p-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Your contribution</span>
            <span className="font-mono">
              {parseFloat(
                formatUnits(committed, USDC_DECIMALS),
              ).toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
              USDC
            </span>
          </div>

          {successful && allocation && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tokens to receive</span>
                <span className="font-mono text-causal">
                  {parseFloat(
                    formatUnits(allocation.estimatedTokens, TOKEN_DECIMALS),
                  ).toLocaleString(undefined, { maximumFractionDigits: 4 })}{" "}
                  {tokenSymbol}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">USDC refund</span>
                <span className="font-mono">
                  {parseFloat(
                    formatUnits(allocation.estimatedRefund, USDC_DECIMALS),
                  ).toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
                  USDC
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Your share</span>
                <span className="font-mono">
                  {(allocation.finalShareBps / 100).toFixed(2)}%
                </span>
              </div>
            </>
          )}

          {!successful && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Full refund</span>
              <span className="font-mono">
                {parseFloat(
                  formatUnits(committed, USDC_DECIMALS),
                ).toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
                USDC
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error.message}
          </div>
        )}

        {hasClaimed ? (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-causal/10 p-3 text-sm text-causal">
            <Check className="h-4 w-4" />
            Already claimed
          </div>
        ) : (
          <Button
            onClick={handleClaim}
            disabled={!isConnected || isPending || isConfirming || hasClaimed}
            className="btn-glow w-full border-0 text-primary-foreground"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirm in wallet...
              </>
            ) : isConfirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Claiming...
              </>
            ) : successful ? (
              `Claim ${tokenSymbol} + Refund`
            ) : (
              "Claim Full Refund"
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
