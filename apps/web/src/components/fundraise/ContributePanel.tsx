"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { parseUnits, formatUnits } from "viem";
import { useAccount } from "wagmi";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CONTRACTS } from "@causal/shared";
import { useCommit } from "@/hooks/useCommit";
import { useApprovalFlow } from "@/hooks/useApprovalFlow";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useOnceOnSuccess } from "@/hooks/useOnceOnSuccess";
import { useTransactionToast } from "@/hooks/useTransactionToast";

interface ContributePanelProps {
  readonly orgId: number;
  readonly saleEnd: number;
  readonly active: boolean;
  readonly onSuccess?: () => void;
}

const USDC_DECIMALS = 6;

export function ContributePanel({
  orgId,
  saleEnd,
  active,
  onSuccess,
}: ContributePanelProps) {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("");
  const { commit, hash, isPending, isConfirming, isSuccess, error } =
    useCommit();

  const parsedAmount =
    amount && parseFloat(amount) > 0
      ? parseUnits(amount, USDC_DECIMALS)
      : 0n;

  const {
    balance: usdcBalance,
    symbol: usdcSymbol,
  } = useTokenBalance(CONTRACTS.mockUsdc, address);

  const {
    needsApproval,
    requestApproval,
    isApprovePending,
    isApproveConfirming,
    isApproveConfirmed,
    approveHash,
  } = useApprovalFlow(
    CONTRACTS.mockUsdc,
    CONTRACTS.causalOrganizations,
    address,
    parsedAmount,
  );

  // Auto-commit after approval confirms — guarded to fire once
  const autoCommittedRef = useRef(false);
  useEffect(() => {
    if (isApproveConfirmed && !needsApproval && parsedAmount > 0n && !autoCommittedRef.current) {
      autoCommittedRef.current = true;
      commit(orgId, parsedAmount);
    }
  }, [isApproveConfirmed, needsApproval, parsedAmount, commit, orgId]);

  // Reset guard when approval hash changes (new approval)
  useEffect(() => {
    autoCommittedRef.current = false;
  }, [approveHash]);

  const isExpired = saleEnd > 0 && Date.now() / 1000 > saleEnd;
  const canCommit =
    isConnected && active && !isExpired && parsedAmount > 0n;

  const handleCommit = useCallback(() => {
    if (!canCommit) return;
    if (needsApproval) {
      requestApproval();
      return;
    }
    commit(orgId, parsedAmount);
  }, [canCommit, needsApproval, requestApproval, commit, orgId, parsedAmount]);

  const handleMax = useCallback(() => {
    if (usdcBalance) {
      setAmount(formatUnits(usdcBalance, USDC_DECIMALS));
    }
  }, [usdcBalance]);

  // Fire onSuccess exactly once per tx
  useOnceOnSuccess(isSuccess, onSuccess, hash);

  // Toast notifications
  useTransactionToast({
    hash,
    isConfirming,
    isSuccess,
    error,
    labels: { success: "Contribution confirmed!", pending: "Contributing USDC..." },
  });

  const isProcessing =
    isPending || isConfirming || isApprovePending || isApproveConfirming;

  return (
    <Card className="glass-card rounded-xl border-border">
      <CardHeader>
        <CardTitle className="text-base">Contribute USDC</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Amount</span>
            <button
              type="button"
              onClick={handleMax}
              className="text-xs text-causal hover:underline"
            >
              Balance:{" "}
              {usdcBalance
                ? parseFloat(
                    formatUnits(usdcBalance, USDC_DECIMALS),
                  ).toLocaleString(undefined, { maximumFractionDigits: 2 })
                : "0"}{" "}
              {usdcSymbol ?? "USDC"}
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none transition-colors focus:border-causal/50 focus:ring-1 focus:ring-causal/30"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleMax}
              className="text-xs"
            >
              MAX
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error.message}
          </div>
        )}

        <Button
          onClick={handleCommit}
          disabled={!canCommit || isProcessing}
          className="btn-glow w-full border-0 text-primary-foreground"
        >
          {!isConnected ? (
            "Connect wallet first"
          ) : isExpired ? (
            "Sale ended"
          ) : !active ? (
            "Sale not active"
          ) : isApprovePending || isApproveConfirming ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Approving USDC...
            </>
          ) : isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Confirm in wallet...
            </>
          ) : isConfirming ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Contributing...
            </>
          ) : needsApproval ? (
            "Approve & Contribute"
          ) : (
            "Contribute"
          )}
        </Button>

        {isExpired && (
          <p className="text-center text-xs text-muted-foreground">
            The funding window has closed.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
