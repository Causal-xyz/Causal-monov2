"use client";

import { use, useState } from "react";
import Link from "next/link";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import {
  Clock,
  Users,
  ArrowRight,
  Coins,
  Landmark,
  Globe,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

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
import { useOrgLogos } from "@/hooks/useOrgLogos";
import { useOrgMeta } from "@/hooks/useOrgMeta";

const USDC_DECIMALS = 6;
const TOKEN_DECIMALS = 18;

function formatLargeNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function FundraiseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const orgId = parseInt(id, 10);
  const { address } = useAccount();
  const [aboutExpanded, setAboutExpanded] = useState(false);

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
  const logos = useOrgLogos();
  const logoUrl = logos[String(orgId)];
  const meta = useOrgMeta(orgId);

  if (isLoading || !info || !sale) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Loading fundraise...
      </div>
    );
  }

  const isExpired = sale.saleEnd > 0 && Date.now() / 1000 > sale.saleEnd;

  const totalSupplyNum = parseFloat(formatUnits(sale.totalTokenSupply, TOKEN_DECIMALS));
  const tokensForSaleNum = parseFloat(formatUnits(sale.tokensForSale, TOKEN_DECIMALS));
  const fundingGoalNum = parseFloat(formatUnits(sale.fundingGoal, USDC_DECIMALS));

  // ICO price = funding goal / tokens for sale
  const icoPrice = tokensForSaleNum > 0 ? fundingGoalNum / tokensForSaleNum : 0;
  // FDV = ICO price * total supply
  const fdv = icoPrice * totalSupplyNum;

  const fullDescription = meta.description || info.description || "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

        {/* ── Left Column ── */}
        <div className="space-y-6">

          {/* Org identity block */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-start gap-4">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={info.name}
                  className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-muted/60 text-2xl font-bold text-muted-foreground">
                  {info.name[0]?.toUpperCase() ?? "#"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold leading-tight">{info.name}</h1>
                  <FundraiseStatusBadge status={status} />
                </div>

                {meta.shortDescription && (
                  <p className="mt-1 text-sm text-muted-foreground leading-snug">
                    {meta.shortDescription}
                  </p>
                )}

                {(meta.website || meta.twitter) && (
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {meta.website && (
                      <a
                        href={meta.website.startsWith("http") ? meta.website : `https://${meta.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-causal hover:underline"
                      >
                        <Globe className="h-3 w-3" />
                        Website
                      </a>
                    )}
                    {meta.twitter && (
                      <a
                        href={meta.twitter.startsWith("http") ? meta.twitter : `https://x.com/${meta.twitter.replace(/^@/, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-causal hover:underline"
                      >
                        <XIcon className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Key metrics strip */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-muted/50 px-3 py-2.5">
                <p className="text-xs text-muted-foreground">Ticker</p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-causal">${info.symbol}</p>
              </div>
              <div className="rounded-xl bg-muted/50 px-3 py-2.5">
                <p className="text-xs text-muted-foreground">ICO Price</p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-causal">
                  {icoPrice > 0 ? `$${icoPrice.toFixed(icoPrice < 0.01 ? 6 : 4)}` : "—"}
                </p>
              </div>
              <div className="rounded-xl bg-muted/50 px-3 py-2.5">
                <p className="text-xs text-muted-foreground">FDV</p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-causal">
                  {fdv > 0 ? `$${formatLargeNumber(fdv)}` : "—"}
                </p>
              </div>
              <div className="rounded-xl bg-muted/50 px-3 py-2.5">
                <p className="text-xs text-muted-foreground">Supply</p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-causal">
                  {formatLargeNumber(totalSupplyNum)}
                </p>
              </div>
            </div>

            {/* Funding progress */}
            <div className="mt-5">
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Funding progress</span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {contributorCount} funders
                </span>
              </div>
              <FundraiseProgress raised={sale.usdcRaised} goal={sale.fundingGoal} />
              <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {parseFloat(formatUnits(sale.usdcRaised, USDC_DECIMALS)).toLocaleString(undefined, { maximumFractionDigits: 0 })} USDC raised
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {isExpired ? "Sale ended" : countdown}
                </span>
              </div>
            </div>
          </div>

          {/* About section */}
          {fullDescription && (
            <div className="glass-card rounded-2xl p-6">
              <h2 className="mb-3 text-base font-semibold">About</h2>
              <div className={aboutExpanded ? "" : "line-clamp-4"}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {fullDescription}
                </p>
              </div>
              {fullDescription.length > 300 && (
                <button
                  onClick={() => setAboutExpanded((p) => !p)}
                  className="mt-2 flex items-center gap-1 text-xs font-medium text-causal hover:underline"
                >
                  {aboutExpanded ? (
                    <><ChevronUp className="h-3.5 w-3.5" /> Show less</>
                  ) : (
                    <><ChevronDown className="h-3.5 w-3.5" /> Read more</>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Token Details */}
          <Card className="glass-card rounded-2xl border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Coins className="h-4 w-4 text-causal" />
                Token Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Total Supply</p>
                  <p className="mt-1 font-mono text-sm font-medium">{formatLargeNumber(totalSupplyNum)}</p>
                  <p className="font-mono text-xs text-muted-foreground">{info.symbol}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">For Sale</p>
                  <p className="mt-1 font-mono text-sm font-medium">{formatLargeNumber(tokensForSaleNum)}</p>
                  <p className="font-mono text-xs text-muted-foreground">{info.symbol}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Treasury</p>
                  <p className="mt-1 font-mono text-sm font-medium">
                    {formatLargeNumber(totalSupplyNum - tokensForSaleNum)}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">{info.symbol}</p>
                </div>
              </div>

              {multiplier && multiplier.denominator > 0n && status === "funding" && !isExpired && (
                <div className="mt-3 rounded-xl border border-causal/20 bg-causal/5 p-3">
                  <p className="text-xs text-muted-foreground">Current Early Bonus Multiplier</p>
                  <p className="mt-1 font-mono text-sm font-medium text-causal">
                    {(Number(multiplier.numerator) / Number(multiplier.denominator)).toFixed(2)}x
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Your Position */}
          {address && committed > 0n && (
            <Card className="glass-card rounded-2xl border-border">
              <CardHeader>
                <CardTitle className="text-base">Your Position</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Your Contribution</p>
                    <p className="mt-1 font-mono text-sm font-medium">
                      {parseFloat(formatUnits(committed, USDC_DECIMALS)).toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC
                    </p>
                  </div>
                  {allocation && (
                    <>
                      <div className="rounded-xl bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">Tokens to Receive</p>
                        <p className="mt-1 font-mono text-sm font-medium text-causal">
                          {parseFloat(formatUnits(allocation.estimatedTokens, TOKEN_DECIMALS)).toLocaleString(undefined, { maximumFractionDigits: 0 })} {info.symbol}
                        </p>
                      </div>
                      <div className="rounded-xl bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">USDC Refund</p>
                        <p className="mt-1 font-mono text-sm font-medium">
                          {parseFloat(formatUnits(allocation.estimatedRefund, USDC_DECIMALS)).toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC
                        </p>
                      </div>
                      <div className="rounded-xl bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">Your Share</p>
                        <p className="mt-1 font-mono text-sm font-medium">{(allocation.finalShareBps / 100).toFixed(2)}%</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        {/* ── Right Column ── */}
        <div className="space-y-4">
          {/* Dashboard + Create Proposal buttons — finalized only */}
          {status === "finalized" && (
            <div className="flex gap-2">
              <Link href={`/fundraises/${id}/dashboard`} className="flex-1">
                <Button className="btn-glow w-full border-0 text-primary-foreground">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              {factoryAddress && (
                <Link
                  href={`/proposals/create?factory=${factoryAddress}${tokenAddress ? `&tokenX=${tokenAddress}` : ""}${treasuryAddress ? `&treasury=${treasuryAddress}` : ""}`}
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full">
                    Create Proposal
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          )}

          {status === "funding" && (
            <ContributePanel
              orgId={orgId}
              saleEnd={sale.saleEnd}
              active={sale.active}
              onSuccess={refetch}
            />
          )}

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

          {sale.finalized && (
            <ClaimPanel
              orgId={orgId}
              finalized={sale.finalized}
              successful={sale.successful}
              tokenSymbol={info.symbol}
              onSuccess={refetch}
            />
          )}

          {/* Quick stats sidebar card */}
          <div className="glass-card rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-semibold">Sale Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Goal</span>
                <span className="font-mono font-medium">
                  ${parseFloat(formatUnits(sale.fundingGoal, USDC_DECIMALS)).toLocaleString()} USDC
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Raised</span>
                <span className="font-mono font-medium text-causal">
                  ${parseFloat(formatUnits(sale.usdcRaised, USDC_DECIMALS)).toLocaleString(undefined, { maximumFractionDigits: 0 })} USDC
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Funders</span>
                <span className="font-mono font-medium">{contributorCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time Weight (α)</span>
                <span className="font-mono font-medium">{(Number(sale.alpha) / 1e16).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {isExpired ? "Sale ended" : "Ends in"}
                </span>
                <span className="font-mono font-medium">{countdown}</span>
              </div>
            </div>
            <p className="truncate font-mono text-xs text-muted-foreground pt-1 border-t border-border">
              Founder: {info.founder}
            </p>
          </div>

          {/* Governance — finalized only */}
          {status === "finalized" && (
            <Card className="glass-card rounded-2xl border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Landmark className="h-4 w-4 text-causal" />
                  Governance Infrastructure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tokenAddress && (
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">OrgToken ({info.symbol})</p>
                    <p className="mt-1 truncate font-mono text-xs">{tokenAddress}</p>
                  </div>
                )}
                {treasuryAddress && (
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Treasury</p>
                    <p className="mt-1 truncate font-mono text-xs">{treasuryAddress}</p>
                  </div>
                )}
                {factoryAddress && (
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Proposal Factory</p>
                    <p className="mt-1 truncate font-mono text-xs">{factoryAddress}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}
