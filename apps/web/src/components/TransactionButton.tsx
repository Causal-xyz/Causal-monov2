"use client";

import { type ReactNode } from "react";
import { useWaitForTransactionReceipt } from "wagmi";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type TxStatus = "idle" | "pending" | "confirming" | "success" | "error";

interface TransactionButtonProps {
  readonly hash: `0x${string}` | undefined;
  readonly isPending: boolean;
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly children: ReactNode;
  readonly className?: string;
  readonly onSuccess?: () => void;
}

export function TransactionButton({
  hash,
  isPending,
  onClick,
  disabled = false,
  children,
  className,
  onSuccess,
}: TransactionButtonProps) {
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  if (isSuccess && onSuccess) {
    onSuccess();
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
