"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { useAllProposals } from "@/hooks/useAllProposals";
import type { Outcome } from "@causal/shared";

type Filter = "all" | "Unresolved" | "Yes" | "No";

export default function ProposalsPage() {
  const { proposals, count, isLoading } = useAllProposals();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered =
    filter === "all"
      ? proposals
      : proposals.filter((p) => p.outcome === filter);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Proposals</h1>
          <p className="mt-1 text-muted-foreground">
            {count} proposal{count !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link href="/proposals/create">
          <Button className="btn-glow border-0 text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" />
            Create
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {(["all", "Unresolved", "Yes", "No"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f === "Unresolved" ? "Active" : `Resolved ${f}`}
          </Button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground">
          Loading proposals...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          {count === 0
            ? "No proposals yet. Create the first one!"
            : "No proposals match this filter."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((proposal) => {
            const deadline = new Date(proposal.resolutionTimestamp * 1000);
            const isPast = deadline.getTime() < Date.now();

            return (
              <Link
                key={proposal.address}
                href={`/proposals/${proposal.address}`}
              >
                <Card className="glass-card cursor-pointer rounded-xl border-border transition-all hover:border-causal/30">
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <CardTitle className="text-base font-semibold leading-tight">
                      {proposal.title || `Proposal #${proposal.id}`}
                    </CardTitle>
                    <StatusBadge outcome={proposal.outcome} />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {isPast ? (
                        <CheckCircle className="h-3.5 w-3.5" />
                      ) : (
                        <Clock className="h-3.5 w-3.5" />
                      )}
                      <span>
                        {isPast ? "Ended" : "Ends"}{" "}
                        {deadline.toLocaleDateString()}{" "}
                        {deadline.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="mt-2 truncate font-mono text-xs text-muted-foreground">
                      {proposal.address}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
