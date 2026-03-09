"use client";

import { use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAccount, useReadContract } from "wagmi";
import { causalOrganizationsAbi, CONTRACTS } from "@causal/shared";
import { useProposalInfo } from "@/hooks/useProposalInfo";
import { ProposalHeader } from "@/components/proposal/ProposalHeader";
import { SplitMergePanel } from "@/components/proposal/SplitMergePanel";
import { PortfolioPanel } from "@/components/proposal/PortfolioPanel";
import { ResolutionPanel } from "@/components/proposal/ResolutionPanel";
import { RedemptionPanel } from "@/components/proposal/RedemptionPanel";
import { MarketOverview } from "@/components/proposal/MarketOverview";
import { Loader2, ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ address: string }>;
}

export default function ProposalDetailPage({ params }: Props) {
  const { address: rawAddress } = use(params);
  const proposalAddress = rawAddress as `0x${string}`;
  const { address: userAddress } = useAccount();
  const { proposal, isLoading, refetch } = useProposalInfo(proposalAddress);
  const searchParams = useSearchParams();
  const fromId = searchParams.get("from");

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
    !isResolved && Date.now() / 1000 >= proposal.resolutionTimestamp && proposal.hasAmms;

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

          {!isResolved && (
            <SplitMergePanel
              proposalAddress={proposalAddress}
              tokenX={proposal.tokenX}
              usdc={proposal.usdc}
              userAddress={userAddress}
              onSuccess={refetch}
            />
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <PortfolioPanel
            proposalAddress={proposalAddress}
            userAddress={userAddress}
          />

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
    </div>
  );
}
