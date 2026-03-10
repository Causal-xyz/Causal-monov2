"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { causalOrganizationsAbi, futarchyProposalAbi, CONTRACTS } from "@causal/shared";
import { useProposalInfo } from "@/hooks/useProposalInfo";
import { ProposalHeader } from "@/components/proposal/ProposalHeader";
import { SplitMergePanel } from "@/components/proposal/SplitMergePanel";
import { PortfolioPanel } from "@/components/proposal/PortfolioPanel";
import { ResolutionPanel } from "@/components/proposal/ResolutionPanel";
import { RedemptionPanel } from "@/components/proposal/RedemptionPanel";
import { MarketOverview } from "@/components/proposal/MarketOverview";
import { ProposalChart } from "@/components/proposal/ProposalChart";
import { TradesTable } from "@/components/proposal/TradesTable";
import { Loader2, ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ address: string }>;
}

export default function ProposalDetailPage({ params }: Props) {
  const { address: rawAddress } = use(params);
  const proposalAddress = rawAddress as `0x${string}`;
  const { address: userAddress } = useAccount();
  const { proposal, isLoading, refetch } = useProposalInfo(proposalAddress);
  const [now, setNow] = useState(() => Date.now() / 1000);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() / 1000), 5000);
    return () => clearInterval(id);
  }, []);
  const searchParams = useSearchParams();
  const fromId = searchParams.get("from");

  const { data: tokenData } = useReadContracts({
    contracts: [
      { address: proposalAddress, abi: futarchyProposalAbi, functionName: "yesX" },
      { address: proposalAddress, abi: futarchyProposalAbi, functionName: "noX" },
    ],
    query: { enabled: !!proposal?.hasAmms },
  });
  const yesX = tokenData?.[0]?.result as `0x${string}` | undefined;
  const noX = tokenData?.[1]?.result as `0x${string}` | undefined;

  const { data: orgInfo } = useReadContract({
    address: CONTRACTS.causalOrganizations,
    abi: causalOrganizationsAbi,
    functionName: "getOrgInfo",
    args: fromId != null ? [BigInt(fromId)] : undefined,
    query: { enabled: fromId != null },
  });
  const orgName = (orgInfo as [string, ...unknown[]] | undefined)?.[0] ?? "";

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-causal" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Proposal not found at {proposalAddress}
      </div>
    );
  }

  const isResolved = proposal.outcome !== "Unresolved";
  const canResolve =
    !isResolved && now >= proposal.resolutionTimestamp && proposal.hasAmms;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {fromId && (
        <div className="mb-6">
          <Link
            href={`/fundraises/${fromId}/dashboard`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {orgName ? orgName : "Back to dashboard"}
          </Link>
        </div>
      )}
      <ProposalHeader proposal={proposal} />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          <MarketOverview proposal={proposal} onRefetch={refetch} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <PortfolioPanel
            proposalAddress={proposalAddress}
            userAddress={userAddress}
          />

          {!isResolved && (
            <SplitMergePanel
              proposalAddress={proposalAddress}
              tokenX={proposal.tokenX}
              usdc={proposal.usdc}
              userAddress={userAddress}
              onSuccess={refetch}
            />
          )}

          {canResolve && (
            <ResolutionPanel
              proposalAddress={proposalAddress}
              onSuccess={refetch}
            />
          )}

          {isResolved && (
            <RedemptionPanel
              proposalAddress={proposalAddress}
              outcome={proposal.outcome}
              userAddress={userAddress}
              onSuccess={refetch}
            />
          )}
        </div>
      </div>

      {/* Chart + Trades — full width below both columns */}
      {proposal.hasAmms && (
        <div className="mt-6 grid grid-cols-2 gap-4 items-start">
          <ProposalChart
            ammYesPair={proposal.ammYesPair}
            ammNoPair={proposal.ammNoPair}
            yesX={yesX}
            noX={noX}
            usdc={proposal.usdc}
          />
          <TradesTable
            ammYesPair={proposal.ammYesPair}
            ammNoPair={proposal.ammNoPair}
            yesX={yesX}
            noX={noX}
            usdc={proposal.usdc}
          />
        </div>
      )}
    </div>
  );
}
