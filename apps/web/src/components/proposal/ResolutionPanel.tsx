"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useResolve } from "@/hooks/useResolve";
import { useOnceOnSuccess } from "@/hooks/useOnceOnSuccess";
import { useTransactionToast } from "@/hooks/useTransactionToast";
import { Gavel, Loader2 } from "lucide-react";

interface ResolutionPanelProps {
  readonly proposalAddress: `0x${string}`;
  readonly onSuccess: () => void;
}

export function ResolutionPanel({ proposalAddress, onSuccess }: ResolutionPanelProps) {
  const { resolve, hash, isPending, isConfirming, isSuccess, error } =
    useResolve(proposalAddress);

  useOnceOnSuccess(isSuccess, onSuccess, hash);

  useTransactionToast({
    hash,
    isConfirming,
    isSuccess,
    error,
    labels: { success: "Proposal resolved!", pending: "Resolving proposal..." },
  });

  return (
    <Card className="glass-card rounded-xl border-causal/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gavel className="h-5 w-5 text-causal" />
          Resolution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          The resolution period has passed. Anyone can trigger resolution.
          The contract will compare 1-hour TWAP prices from the YES and NO
          pools to determine the outcome.
        </p>

        <div className="rounded-lg border border-causal/20 bg-causal/5 p-3 text-sm">
          <strong className="text-causal">How resolution works:</strong>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li>If YES TWAP &gt; NO TWAP → Outcome is <strong className="text-causal">YES</strong></li>
            <li>If NO TWAP &ge; YES TWAP → Outcome is <strong className="text-destructive">NO</strong></li>
          </ul>
        </div>

        <Button
          onClick={resolve}
          disabled={isPending || isConfirming}
          className="btn-glow w-full border-0 text-primary-foreground"
        >
          {isPending || isConfirming ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isPending ? "Confirm in wallet..." : "Resolving..."}
            </>
          ) : (
            "Resolve Proposal"
          )}
        </Button>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
            {error.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
