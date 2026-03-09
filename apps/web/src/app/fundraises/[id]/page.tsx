"use client";

import { use } from "react";
import Link from "next/link";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import {
  Clock,
  Users,
  ExternalLink,
  ArrowRight,
  Coins,
  Landmark,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FundraiseStatusBadge } from "@/components/fundraise/FundraiseStatusBadge";
import { FundraiseProgress } from "@/components/fundraise/FundraiseProgress";
import { ContributePanel } from "@/components/fundraise/ContributePanel";
import { ClaimPanel } from "@/components/fundraise/ClaimPanel";
import { FinalizePanel } from "@/components/fundraise/FinalizePanel";
import { useFundraiseInfo } from "@/hooks/useFundraiseInfo";
import { useUserContribution } from "@/hooks/useUserContribution";
import { useCountdown } from "@/hooks/useCountdown";

const USDC_DECIMALS = 6;
const TOKEN_DECIMALS = 18;

export default function FundraiseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const orgId = parseInt(id, 10);
  const { address } = useAccount();

  const {
    info,
    sale,
    status,
    tokenAddress,
    treasuryAddress,
    factoryAddress,
    contributorCount,
    tokenPrice,
    multiplier,
    isLoading,
    refetch,
  } = useFundraiseInfo(orgId);

  const { committed, allocation } = useUserContribution(orgId, address);
  const countdown = useCountdown(sale?.saleEnd ?? 0);

  if (isLoading || !info || !sale) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Loading fundraise...
      </div>
    );
  }

  const isExpired = sale.saleEnd > 0 && Date.now() / 1000 > sale.saleEnd;
  const effectiveTokenPrice =
    tokenPrice > 0n
      ? parseFloat(formatUnits(tokenPrice, USDC_DECIMALS))
      : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{info.name}</h1>
            <p className="mt-1 text-lg text-muted-foreground">${info.symbol}</p>
          </div>
          <FundraiseStatusBadge status={status} />
        </div>
        <p className="max-w-3xl text-muted-foreground">{info.description}</p>
        <p className="mt-2 truncate font-mono text-xs text-muted-foreground">
          Founded by {info.founder}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          {/* Funding Progress */}
          <Card className="glass-card rounded-xl border-border">
            <CardHeader>
              <CardTitle className="text-base">Funding Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FundraiseProgress
                raised={sale.usdcRaised}
                goal={sale.fundingGoal}
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Token Price</p>
                  <p className="mt-1 font-mono text-sm font-medium">
                    {effectiveTokenPrice > 0
                      ? `$${effectiveTokenPrice.toFixed(6)}`
                      : "N/A"}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Contributors</p>
                  <p className="mt-1 flex items-center gap-1.5 font-mono text-sm font-medium">
                    <Users className="h-3.5 w-3.5" />
                    {contributorCount}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">
                    {isExpired ? "Sale Ended" : "Time Remaining"}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                    <Clock className="h-3.5 w-3.5" />
                    {countdown}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">
                    Time Weight (alpha)
                  </p>
                  <p className="mt-1 font-mono text-sm font-medium">
                    {(
                      Number(sale.alpha) / 1e16
                    ).toFixed(0)}
                    %
                  </p>
                </div>
              </div>

              {multiplier &&
                multiplier.denominator > 0n &&
                status === "funding" &&
                !isExpired && (
                  <div className="rounded-lg border border-causal/20 bg-causal/5 p-3">
                    <p className="text-xs text-muted-foreground">
                      Current Early Bonus Multiplier
                    </p>
                    <p className="mt-1 font-mono text-sm font-medium text-causal">
                      {(
                        Number(multiplier.numerator) /
                        Number(multiplier.denominator)
                      ).toFixed(2)}
                      x
                    </p>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Token Info */}
          <Card className="glass-card rounded-xl border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Coins className="h-4 w-4 text-causal" />
                Token Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Supply</span>
                  <span className="font-mono">
                    {parseFloat(
                      formatUnits(sale.totalTokenSupply, TOKEN_DECIMALS),
                    ).toLocaleString()}{" "}
                    {info.symbol}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">For Sale</span>
                  <span className="font-mono">
                    {parseFloat(
                      formatUnits(sale.tokensForSale, TOKEN_DECIMALS),
                    ).toLocaleString()}{" "}
                    {info.symbol}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Treasury Reserve
                  </span>
                  <span className="font-mono">
                    {parseFloat(
                      formatUnits(
                        sale.totalTokenSupply - sale.tokensForSale,
                        TOKEN_DECIMALS,
                      ),
                    ).toLocaleString()}{" "}
                    {info.symbol}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Your Position */}
          {address && committed > 0n && (
            <Card className="glass-card rounded-xl border-border">
              <CardHeader>
                <CardTitle className="text-base">Your Position</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Committed</span>
                    <span className="font-mono">
                      {parseFloat(
                        formatUnits(committed, USDC_DECIMALS),
                      ).toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}{" "}
                      USDC
                    </span>
                  </div>
                  {allocation && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Est. Tokens
                        </span>
                        <span className="font-mono text-causal">
                          {parseFloat(
                            formatUnits(
                              allocation.estimatedTokens,
                              TOKEN_DECIMALS,
                            ),
                          ).toLocaleString(undefined, {
                            maximumFractionDigits: 4,
                          })}{" "}
                          {info.symbol}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Est. Refund
                        </span>
                        <span className="font-mono">
                          {parseFloat(
                            formatUnits(
                              allocation.estimatedRefund,
                              USDC_DECIMALS,
                            ),
                          ).toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}{" "}
                          USDC
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Your Share
                        </span>
                        <span className="font-mono">
                          {(allocation.finalShareBps / 100).toFixed(2)}%
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Contribute */}
          {status === "funding" && (
            <ContributePanel
              orgId={orgId}
              saleEnd={sale.saleEnd}
              active={sale.active}
              onSuccess={refetch}
            />
          )}

          {/* Founder Controls */}
          <FinalizePanel
            orgId={orgId}
            founder={info.founder}
            usdcRaised={sale.usdcRaised}
            fundingGoal={sale.fundingGoal}
            saleEnd={sale.saleEnd}
            finalized={sale.finalized}
            active={sale.active}
            onSuccess={refetch}
          />

          {/* Claim */}
          {sale.finalized && (
            <ClaimPanel
              orgId={orgId}
              finalized={sale.finalized}
              successful={sale.successful}
              tokenSymbol={info.symbol}
              onSuccess={refetch}
            />
          )}

          {/* Deployed Contracts */}
          {status === "finalized" && (
            <Card className="glass-card rounded-xl border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Landmark className="h-4 w-4 text-causal" />
                  Governance Infrastructure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tokenAddress && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      OrgToken ({info.symbol})
                    </p>
                    <p className="truncate font-mono text-xs">
                      {tokenAddress}
                    </p>
                  </div>
                )}
                {treasuryAddress && (
                  <div>
                    <p className="text-xs text-muted-foreground">Treasury</p>
                    <p className="truncate font-mono text-xs">
                      {treasuryAddress}
                    </p>
                  </div>
                )}
                {factoryAddress && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Proposal Factory
                    </p>
                    <p className="truncate font-mono text-xs">
                      {factoryAddress}
                    </p>
                  </div>
                )}

                <Link href="/proposals">
                  <Button
                    variant="outline"
                    className="mt-2 w-full"
                  >
                    View Proposals
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
