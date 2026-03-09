"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * Shows toast notifications for transaction lifecycle.
 * Uses a ref guard to fire exactly once per hash transition.
 *
 * @param hash - transaction hash from writeContract
 * @param isConfirming - true while tx is being mined
 * @param isSuccess - true once tx is confirmed
 * @param error - error from writeContract or receipt
 * @param options - labels for each state
 */
export function useTransactionToast({
  hash,
  isConfirming,
  isSuccess,
  error,
  labels,
}: {
  readonly hash: `0x${string}` | undefined;
  readonly isConfirming: boolean;
  readonly isSuccess: boolean;
  readonly error: Error | null;
  readonly labels?: {
    readonly pending?: string;
    readonly success?: string;
    readonly error?: string;
  };
}) {
  const toastIdRef = useRef<string | number | undefined>(undefined);
  const lastHashRef = useRef<string | undefined>(undefined);

  // Show "confirming" toast when hash appears
  useEffect(() => {
    if (hash && hash !== lastHashRef.current) {
      lastHashRef.current = hash;
      toastIdRef.current = toast.loading(
        labels?.pending ?? "Transaction submitted, waiting for confirmation...",
      );
    }
  }, [hash, labels?.pending]);

  // Update to success
  useEffect(() => {
    if (isSuccess && toastIdRef.current) {
      toast.success(labels?.success ?? "Transaction confirmed!", {
        id: toastIdRef.current,
      });
      toastIdRef.current = undefined;
    }
  }, [isSuccess, labels?.success]);

  // Update to error
  useEffect(() => {
    if (error) {
      const message =
        labels?.error ?? error.message?.split("\n")[0] ?? "Transaction failed";

      if (toastIdRef.current) {
        toast.error(message, { id: toastIdRef.current });
        toastIdRef.current = undefined;
      } else {
        toast.error(message);
      }
      lastHashRef.current = undefined;
    }
  }, [error, labels?.error]);
}
