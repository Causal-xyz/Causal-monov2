"use client";

import { type ReactNode } from "react";
import { useWaitForTransactionReceipt } from "wagmi";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNetworkGuard } from "@/hooks/useNetworkGuard";
import { useOnceOnSuccess } from "@/hooks/useOnceOnSuccess";
import { useTransactionToast } from "@/hooks/useTransactionToast";

type TxStatus = "idle" | "pending" | "confirming" | "success" | "error";

interface TransactionButtonProps {
  readonly hash: `0x${string}` | undefined;
  readonly isPending: boolean;
  readonly error?: Error | null;
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly children: ReactNode;
  readonly className?: string;
  readonly onSuccess?: () => void;
  readonly toastLabels?: {
    readonly pending?: string;
    readonly success?: string;
    readonly error?: string;
  };
}

export function TransactionButton({
  hash,
  isPending,
  error,
  onClick,
  disabled = false,
  children,
  className,
  onSuccess,
  toastLabels,
}: TransactionButtonProps) {
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  const { isWrongNetwork, isSwitching, switchToFuji, expectedChainName } =
    useNetworkGuard();

  // Fire onSuccess exactly once per hash
  useOnceOnSuccess(isSuccess, onSuccess, hash);

  // Show toast notifications
  useTransactionToast({
    hash,
    isConfirming,
    isSuccess,
    error: error ?? null,
    labels: toastLabels,
  });

  if (isWrongNetwork) {
    return (
      <Button
        onClick={switchToFuji}
        disabled={isSwitching}
        variant="destructive"
        className={className}
      >
        {isSwitching ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Switching...
          </>
        ) : (
          <>
            <AlertTriangle className="mr-2 h-4 w-4" />
            Switch to {expectedChainName}
          </>
        )}
      </Button>
    );
  }

  const status: TxStatus = isPending
    ? "pending"
    : isConfirming
      ? "confirming"
      : isSuccess
        ? "success"
        : "idle";

  const statusLabel: Record<TxStatus, ReactNode> = {
    idle: children,
    pending: (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Confirm in wallet...
      </>
    ),
    confirming: (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Confirming...
      </>
    ),
    success: "Done!",
    error: children,
  };

  return (
    <Button
      onClick={onClick}
      disabled={disabled || isPending || isConfirming}
      className={className}
    >
      {statusLabel[status]}
    </Button>
  );
}
