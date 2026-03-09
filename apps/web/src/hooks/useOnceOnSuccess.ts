"use client";

import { useEffect, useRef } from "react";

/**
 * Calls `callback` exactly once when `isSuccess` transitions from false → true.
 * Resets when the `hash` changes (new transaction).
 */
export function useOnceOnSuccess(
  isSuccess: boolean,
  callback: (() => void) | undefined,
  hash: `0x${string}` | undefined,
) {
  const calledRef = useRef(false);
  const lastHashRef = useRef<string | undefined>(undefined);

  // Reset when hash changes (new transaction started)
  useEffect(() => {
    if (hash !== lastHashRef.current) {
      lastHashRef.current = hash;
      calledRef.current = false;
    }
  }, [hash]);

  useEffect(() => {
    if (isSuccess && !calledRef.current && callback) {
      calledRef.current = true;
      callback();
    }
  }, [isSuccess, callback]);
}
