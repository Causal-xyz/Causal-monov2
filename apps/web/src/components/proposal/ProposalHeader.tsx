"use client";

import { Clock, CheckCircle, ExternalLink } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { useCountdown } from "@/hooks/useCountdown";

interface ProposalHeaderProps {
  readonly proposal: {
    readonly id: number;
    readonly title: string;
    readonly outcome: "Unresolved" | "Yes" | "No";
    readonly resolutionTimestamp: number;
    readonly address: `0x${string}`;
    readonly tokenX: `0x${string}`;
    readonly hasAmms: boolean;
  };
}

export function ProposalHeader({ proposal }: ProposalHeaderProps) {
  const countdown = useCountdown(proposal.resolutionTimestamp);
  const isResolved = proposal.outcome !== "Unresolved";

  return (
    <Card className="glass-card rounded-xl border-border">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              <StatusBadge outcome={proposal.outcome} />
              {!proposal.hasAmms && !isResolved && (
                <span className="rounded-md bg-causal-warning/10 px-2 py-0.5 text-xs text-causal-warning">
                  AMMs not set
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold">
              {proposal.title || `Proposal #${proposal.id}`}
            </h1>
            <a
              href={`https://testnet.snowtrace.io/address/${proposal.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-causal transition-colors"
            >
              <span>{proposal.address}</span>
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          </div>

          <div className="text-right">
            {isResolved ? (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-causal" />
                <span>
                  Resolved:{" "}
                  <span className="font-bold text-causal">
                    {proposal.outcome}
                  </span>
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{countdown}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
