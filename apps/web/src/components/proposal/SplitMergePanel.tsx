"use client";

import { useState, useEffect, useRef } from "react";
import { parseUnits, formatUnits } from "viem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useApprovalFlow } from "@/hooks/useApprovalFlow";
import { useSplitX, useSplitUsdc } from "@/hooks/useSplit";
import { useMergeX, useMergeUsdc } from "@/hooks/useMerge";
import { useConditionalBalances } from "@/hooks/useConditionalBalances";
import { useOnceOnSuccess } from "@/hooks/useOnceOnSuccess";
import { useTransactionToast } from "@/hooks/useTransactionToast";
import { Loader2, ArrowDownUp } from "lucide-react";

type Tab = "split" | "merge";
type TokenType = "tokenX" | "usdc";

interface SplitMergePanelProps {
  readonly proposalAddress: `0x${string}`;
  readonly tokenX: `0x${string}`;
  readonly usdc: `0x${string}`;
  readonly userAddress: `0x${string}` | undefined;
  readonly onSuccess: () => void;
}

export function SplitMergePanel({
  proposalAddress,
  tokenX,
  usdc,
  userAddress,
  onSuccess,
}: SplitMergePanelProps) {
  const [tab, setTab] = useState<Tab>("split");
  const [tokenType, setTokenType] = useState<TokenType>("tokenX");
  const [amount, setAmount] = useState("");

  const activeToken = tokenType === "tokenX" ? tokenX : usdc;
  const { balance, symbol, decimals, refetch: refetchBalance } = useTokenBalance(activeToken, userAddress);
  const { balances: condBalances, refetch: refetchCond } = useConditionalBalances(proposalAddress, userAddress);

  const parsedAmount = amount ? parseUnits(amount, decimals) : 0n;

  // Approval
  const approval = useApprovalFlow(activeToken, proposalAddress, userAddress, parsedAmount);

  // Split hooks
  const splitX = useSplitX(proposalAddress);
  const splitUsdc = useSplitUsdc(proposalAddress);
  const activeSplit = tokenType === "tokenX" ? splitX : splitUsdc;

  // Merge hooks
  const mergeX = useMergeX(proposalAddress);
  const mergeUsdc = useMergeUsdc(proposalAddress);
  const activeMerge = tokenType === "tokenX" ? mergeX : mergeUsdc;

  const isProcessing =
    activeSplit.isPending || activeSplit.isConfirming ||
    activeMerge.isPending || activeMerge.isConfirming ||
    approval.isApprovePending || approval.isApproveConfirming;

  // Refetch on success — guarded
  const handleSplitMergeSuccess = () => {
    setAmount("");
    refetchBalance();
    refetchCond();
    onSuccess();
  };

  useOnceOnSuccess(activeSplit.isSuccess, handleSplitMergeSuccess, activeSplit.hash);
  useOnceOnSuccess(activeMerge.isSuccess, handleSplitMergeSuccess, activeMerge.hash);

  // Toast for split
  useTransactionToast({
    hash: activeSplit.hash,
    isConfirming: activeSplit.isConfirming,
    isSuccess: activeSplit.isSuccess,
    error: activeSplit.error,
    labels: { success: `Split ${symbol} confirmed!`, pending: `Splitting ${symbol}...` },
  });

  // Toast for merge
  useTransactionToast({
    hash: activeMerge.hash,
    isConfirming: activeMerge.isConfirming,
    isSuccess: activeMerge.isSuccess,
    error: activeMerge.error,
    labels: { success: `Merge ${symbol} confirmed!`, pending: `Merging ${symbol}...` },
  });

  // Refetch allowance after approval — guarded
  const approvalRefetchedRef = useRef(false);
  useEffect(() => {
    if (approval.isApproveConfirmed && !approvalRefetchedRef.current) {
      approvalRefetchedRef.current = true;
      approval.refetchAllowance();
    }
  }, [approval.isApproveConfirmed, approval.refetchAllowance]);

  // Reset guard when approval hash changes
  useEffect(() => {
    approvalRefetchedRef.current = false;
  }, [approval.approveHash]);

  // Merge max: minimum of yes/no balances for the chosen token type
  const mergeMaxBalance = tokenType === "tokenX"
    ? (condBalances.yesX < condBalances.noX ? condBalances.yesX : condBalances.noX)
    : (condBalances.yesUsdc < condBalances.noUsdc ? condBalances.yesUsdc : condBalances.noUsdc);

  const maxBalance = tab === "split" ? balance : mergeMaxBalance;

  function handleAction() {
    if (!userAddress || parsedAmount === 0n) return;

    if (tab === "split") {
      if (approval.needsApproval) {
        approval.requestApproval();
        return;
      }
      activeSplit.split(parsedAmount, userAddress);
    } else {
      activeMerge.merge(parsedAmount, userAddress);
    }
  }

  function setMaxAmount() {
    if (maxBalance > 0n) {
      setAmount(formatUnits(maxBalance, decimals));
    }
  }

  return (
    <Card className="glass-card rounded-xl border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ArrowDownUp className="h-5 w-5 text-causal" />
          Split & Merge
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-2">
          <Button
            variant={tab === "split" ? "default" : "outline"}
            size="sm"
            onClick={() => { setTab("split"); setAmount(""); }}
          >
            Split
          </Button>
          <Button
            variant={tab === "merge" ? "default" : "outline"}
            size="sm"
            onClick={() => { setTab("merge"); setAmount(""); }}
          >
            Merge
          </Button>
        </div>

        {/* Token type selector */}
        <div className="flex gap-2">
          <Button
            variant={tokenType === "tokenX" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => { setTokenType("tokenX"); setAmount(""); }}
          >
            Token X
          </Button>
          <Button
            variant={tokenType === "usdc" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => { setTokenType("usdc"); setAmount(""); }}
          >
            USDC
          </Button>
        </div>

        {/* Info text */}
        <p className="text-xs text-muted-foreground">
          {tab === "split"
            ? `Split ${symbol} into equal amounts of YES and NO conditional tokens.`
            : `Merge equal amounts of YES + NO tokens back into ${symbol}.`}
        </p>

        {/* Amount input */}
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Amount</span>
            <button onClick={setMaxAmount} className="hover:text-causal">
              Balance: {parseFloat(formatUnits(maxBalance, decimals)).toLocaleString(undefined, { maximumFractionDigits: 4 })} {symbol}
            </button>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-lg outline-none transition-colors focus:border-causal/50"
            />
            <Button variant="outline" size="sm" onClick={setMaxAmount}>
              MAX
            </Button>
          </div>
        </div>

        {/* Preview */}
        {parsedAmount > 0n && (
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-sm">
            {tab === "split" ? (
              <>
                <div className="text-muted-foreground">You receive:</div>
                <div className="mt-1 font-medium text-causal">
                  {amount} yes{symbol} + {amount} no{symbol}
                </div>
              </>
            ) : (
              <>
                <div className="text-muted-foreground">You burn:</div>
                <div className="mt-1">
                  {amount} yes{symbol} + {amount} no{symbol}
                </div>
                <div className="mt-1 text-muted-foreground">You receive:</div>
                <div className="font-medium text-causal">{amount} {symbol}</div>
              </>
            )}
          </div>
        )}

        {/* Action button */}
        <Button
          onClick={handleAction}
          disabled={!userAddress || parsedAmount === 0n || isProcessing}
          className="btn-glow w-full border-0 text-primary-foreground"
        >
          {isProcessing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {!userAddress
            ? "Connect wallet"
            : parsedAmount === 0n
              ? "Enter amount"
              : tab === "split" && approval.needsApproval
                ? `Approve ${symbol}`
                : tab === "split"
                  ? `Split ${symbol}`
                  : `Merge ${symbol}`}
        </Button>

        {(activeSplit.error || activeMerge.error) && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
            {(activeSplit.error || activeMerge.error)?.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
