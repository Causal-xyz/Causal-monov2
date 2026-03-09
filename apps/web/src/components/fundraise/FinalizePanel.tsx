"use client";

import { useState } from "react";
import { parseUnits, formatUnits } from "viem";
import { useAccount } from "wagmi";
import { Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useFinalizeRaise, useForceFinalize } from "@/hooks/useFinalize";
import { useOnceOnSuccess } from "@/hooks/useOnceOnSuccess";
import { useTransactionToast } from "@/hooks/useTransactionToast";

interface FinalizePanelProps {
  readonly orgId: number;
  readonly founder: `0x${string}`;
  readonly usdcRaised: bigint;
  readonly fundingGoal: bigint;
  readonly saleEnd: number;
  readonly finalized: boolean;
  readonly active: boolean;
  readonly onSuccess?: () => void;
}

const USDC_DECIMALS = 6;

export function FinalizePanel({
  orgId,
  founder,
  usdcRaised,
  fundingGoal,
  saleEnd,
  finalized,
  active,
  onSuccess,
}: FinalizePanelProps) {
  const { address } = useAccount();
  const [finalCap, setFinalCap] = useState("");

  const {
    finalizeRaise,
    hash: finalizeHash,
    isPending: isFinalizePending,
    isConfirming: isFinalizeConfirming,
    isSuccess: isFinalizeSuccess,
    error: finalizeError,
  } = useFinalizeRaise();

  const {
    forceFinalize,
    hash: forceHash,
    isPending: isForcePending,
    isConfirming: isForceConfirming,
    isSuccess: isForceSuccess,
    error: forceError,
  } = useForceFinalize();

  const isFounder =
    address?.toLowerCase() === founder?.toLowerCase();
  const isExpired = saleEnd > 0 && Date.now() / 1000 > saleEnd;
  const goalReached = usdcRaised >= fundingGoal;

  // Fire onSuccess exactly once per tx
  useOnceOnSuccess(isFinalizeSuccess, onSuccess, finalizeHash);
  useOnceOnSuccess(isForceSuccess, onSuccess, forceHash);

  // Toast notifications
  useTransactionToast({
    hash: finalizeHash,
    isConfirming: isFinalizeConfirming,
    isSuccess: isFinalizeSuccess,
    error: finalizeError,
    labels: { success: "Fundraise finalized!", pending: "Finalizing raise..." },
  });
  useTransactionToast({
    hash: forceHash,
    isConfirming: isForceConfirming,
    isSuccess: isForceSuccess,
    error: forceError,
    labels: { success: "Force finalized!", pending: "Force finalizing..." },
  });

  if (finalized || !isFounder) return null;

  const handleFinalize = () => {
    const cap = finalCap
      ? parseUnits(finalCap, USDC_DECIMALS)
      : usdcRaised;
    finalizeRaise(orgId, cap);
  };

  const handleForceFinalize = () => {
    forceFinalize(orgId);
  };

  const error = finalizeError || forceError;
  const isProcessing =
    isFinalizePending ||
    isFinalizeConfirming ||
    isForcePending ||
    isForceConfirming;

  return (
    <Card className="glass-card rounded-xl border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-4 w-4 text-causal" />
          Founder Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {goalReached && !isExpired && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Funding goal reached! Finalization will be available once the
              sale period ends.
            </p>
          </div>
        )}

        {goalReached && isExpired && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Funding goal reached! You can finalize the raise and deploy
              governance infrastructure.
            </p>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Final Cap (optional)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={finalCap}
                onChange={(e) => setFinalCap(e.target.value)}
                placeholder={`Default: ${parseFloat(formatUnits(usdcRaised, USDC_DECIMALS)).toLocaleString()} USDC`}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none transition-colors focus:border-causal/50 focus:ring-1 focus:ring-causal/30"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Set a cap below total raised to trigger pro-rata refunds.
                Leave empty to accept all funds.
              </p>
            </div>
            <Button
              onClick={handleFinalize}
              disabled={isProcessing}
              className="btn-glow w-full border-0 text-primary-foreground"
            >
              {isFinalizePending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirm in wallet...
                </>
              ) : isFinalizeConfirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finalizing...
                </>
              ) : (
                "Finalize Raise"
              )}
            </Button>
          </div>
        )}

        {isExpired && !goalReached && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Sale has ended without reaching the funding goal. Force finalize
              to allow investors to claim refunds.
            </p>
            <Button
              onClick={handleForceFinalize}
              disabled={isProcessing}
              variant="outline"
              className="w-full"
            >
              {isForcePending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirm in wallet...
                </>
              ) : isForceConfirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Force finalizing...
                </>
              ) : (
                "Force Finalize (Failed)"
              )}
            </Button>
          </div>
        )}

        {!isExpired && !goalReached && active && (
          <p className="text-center text-sm text-muted-foreground">
            Waiting for funding goal to be reached or sale to end.
          </p>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
