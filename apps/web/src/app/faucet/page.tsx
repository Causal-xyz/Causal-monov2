"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { Droplets, ArrowRight, Coins } from "lucide-react";
import { CONTRACTS } from "@causal/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TransactionButton } from "@/components/TransactionButton";
import { useFaucet } from "@/hooks/useFaucet";
import { useTokenBalance } from "@/hooks/useTokenBalance";

export default function FaucetPage() {
  const { address, isConnected } = useAccount();
  const { balance, decimals, symbol } = useTokenBalance(CONTRACTS.mockUsdc, address);
  const { requestFaucet, hash, isPending, error } = useFaucet();

  const formattedBalance = Number(formatUnits(balance, decimals)).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });

  return (
    <div className="flex flex-col items-center px-4 pb-24 pt-16 sm:px-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-causal/10">
            <Droplets className="h-8 w-8 text-causal" />
          </div>
          <h1 className="text-3xl font-bold">
            Testnet <span className="gradient-text">Faucet</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            Get free mUSDC tokens to test the Causal platform on Avalanche Fuji.
            Each request mints 10,000 mUSDC.
          </p>
        </div>

        {/* Faucet Card */}
        <Card className="glass-card rounded-xl border-border">
          <CardContent className="space-y-6 p-6">
            {/* Balance */}
            {isConnected && (
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="mb-1 text-sm text-muted-foreground">Your Balance</p>
                <p className="text-2xl font-bold">
                  {formattedBalance} <span className="text-lg text-muted-foreground">{symbol}</span>
                </p>
              </div>
            )}

            {/* Faucet Button */}
            {isConnected ? (
              <TransactionButton
                hash={hash}
                isPending={isPending}
                onClick={requestFaucet}
                className="btn-glow w-full border-0 text-primary-foreground"
              >
                <Coins className="mr-2 h-4 w-4" />
                Get 10,000 mUSDC
              </TransactionButton>
            ) : (
              <div className="rounded-lg border border-border p-4 text-center text-sm text-muted-foreground">
                Connect your wallet to use the faucet
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {error.message.split("\n")[0]}
              </div>
            )}
          </CardContent>
        </Card>

        {/* What is mUSDC */}
        <div className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold">What is mUSDC?</h2>
          <p className="text-sm text-muted-foreground">
            mUSDC (Mock USDC) is a test stablecoin deployed on Avalanche Fuji testnet.
            It mimics real USDC with 6 decimals and is used for contributing to fundraises
            and providing liquidity in futarchy markets.
          </p>
        </div>

        {/* Next Steps */}
        <div className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold">Next Steps</h2>
          <div className="flex flex-col gap-3">
            <Link href="/fundraises">
              <Button variant="outline" className="w-full justify-between">
                Browse Fundraises
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/fundraises/create">
              <Button variant="outline" className="w-full justify-between">
                Launch a Project
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
