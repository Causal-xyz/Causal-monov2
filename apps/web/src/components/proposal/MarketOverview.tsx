"use client";

import { useAccount } from "wagmi";
import { useReadContracts } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SetupAmmPanel } from "@/components/proposal/SetupAmmPanel";
import { PriceDisplay } from "@/components/proposal/PriceDisplay";
import { TradingPanel } from "@/components/proposal/TradingPanel";
import { futarchyProposalAbi } from "@causal/shared";
import { TrendingUp, AlertCircle } from "lucide-react";
import { ProposalChart } from "@/components/proposal/ProposalChart";
import { TradesTable } from "@/components/proposal/TradesTable";

interface MarketOverviewProps {
  readonly proposal: {
    readonly outcome: "Unresolved" | "Yes" | "No";
    readonly hasAmms: boolean;
    readonly ammYesPair: `0x${string}`;
    readonly ammNoPair: `0x${string}`;
    readonly owner: `0x${string}`;
    readonly tokenX: `0x${string}`;
    readonly usdc: `0x${string}`;
    readonly address: `0x${string}`;
  };
  readonly onRefetch?: () => void;
}

export function MarketOverview({ proposal, onRefetch }: MarketOverviewProps) {
  const { address } = useAccount();
  const isOwner = address?.toLowerCase() === proposal.owner.toLowerCase();

  // Read conditional token addresses for trading
  const { data: tokenData } = useReadContracts({
    contracts: [
      { address: proposal.address, abi: futarchyProposalAbi, functionName: "yesX" },
      { address: proposal.address, abi: futarchyProposalAbi, functionName: "noX" },
    ],
    query: { enabled: proposal.hasAmms },
  });

  const yesX = tokenData?.[0]?.result as `0x${string}` | undefined;
  const noX = tokenData?.[1]?.result as `0x${string}` | undefined;

  if (!proposal.hasAmms) {
    if (isOwner) {
      return (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-causal/30 bg-causal/5 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-causal" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Step 2: Set up AMM pools
              </p>
              <p className="text-sm text-muted-foreground">
                Your proposal is deployed. Set up Uniswap V3 pools below so trading
                can begin on the YES and NO conditional tokens.
              </p>
            </div>
          </div>
          <SetupAmmPanel
            proposalAddress={proposal.address}
            tokenX={proposal.tokenX}
            usdc={proposal.usdc}
            onSuccess={onRefetch}
          />
        </div>
      );
    }

    return (
      <Card className="glass-card rounded-xl border-border">
        <CardHeader>
          <CardTitle className="text-lg">Market Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Awaiting AMM setup by the proposal owner. Once pools are created,
            conditional tokens can be traded.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isResolved = proposal.outcome !== "Unresolved";

  return (
    <Card className="glass-card rounded-xl border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-causal" />
          Market Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Live prices */}
        <PriceDisplay
          ammYesPair={proposal.ammYesPair}
          ammNoPair={proposal.ammNoPair}
          yesX={yesX}
          noX={noX}
          usdc={proposal.usdc}
        />

        {/* Pool addresses */}
        <div className="grid grid-cols-2 gap-2">
          <div className="text-xs text-muted-foreground">
            <span className="text-causal">YES:</span>{" "}
            <span className="font-mono">{proposal.ammYesPair.slice(0, 10)}...</span>
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="text-destructive">NO:</span>{" "}
            <span className="font-mono">{proposal.ammNoPair.slice(0, 10)}...</span>
          </div>
        </div>

        {/* Trading panel — only when unresolved */}
        {!isResolved && (
          <TradingPanel
            yesX={yesX}
            noX={noX}
            usdc={proposal.usdc}
            ammYesPair={proposal.ammYesPair}
            ammNoPair={proposal.ammNoPair}
            userAddress={address}
            onSuccess={onRefetch ?? (() => {})}
          />
        )}

        {isResolved && (
          <p className="text-center text-xs text-muted-foreground">
            Market resolved — trading is closed.
          </p>
        )}

        {/* Chart + Trades side by side */}
        <div className="flex gap-4">
          <div className="flex-1 min-w-0">
            <ProposalChart
              ammYesPair={proposal.ammYesPair}
              ammNoPair={proposal.ammNoPair}
              yesX={yesX}
              noX={noX}
              usdc={proposal.usdc}
            />
          </div>
          <div className="w-[380px] shrink-0">
            <TradesTable
              ammYesPair={proposal.ammYesPair}
              ammNoPair={proposal.ammNoPair}
              yesX={yesX}
              noX={noX}
              usdc={proposal.usdc}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
