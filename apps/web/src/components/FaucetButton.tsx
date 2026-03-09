"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { Droplets, Loader2, Check } from "lucide-react";
import { CONTRACTS } from "@causal/shared";
import { Button } from "@/components/ui/button";
import { useFaucet } from "@/hooks/useFaucet";
import { useTokenBalance } from "@/hooks/useTokenBalance";

export function FaucetButton() {
  const { address, isConnected } = useAccount();
  const { balance, decimals } = useTokenBalance(CONTRACTS.mockUsdc, address);
  const { requestFaucet, isPending, isConfirming, isSuccess } = useFaucet();
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isSuccess) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  if (!isConnected) return null;

  const formattedBalance = Number(formatUnits(balance, decimals)).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });

  const isLoading = isPending || isConfirming;

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={requestFaucet}
      disabled={isLoading}
      className="hidden gap-1.5 text-xs sm:inline-flex"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {isPending ? "Confirm..." : "Minting..."}
        </>
      ) : showSuccess ? (
        <>
          <Check className="h-3.5 w-3.5 text-causal" />
          +10k mUSDC
        </>
      ) : (
        <>
          <Droplets className="h-3.5 w-3.5" />
          {formattedBalance} mUSDC
        </>
      )}
    </Button>
  );
}
