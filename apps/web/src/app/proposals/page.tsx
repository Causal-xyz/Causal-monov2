"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Clock, CheckCircle, Building2, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { useAllProposals } from "@/hooks/useAllProposals";
import type { Outcome } from "@causal/shared";

type Filter = "all" | "Unresolved" | "Yes" | "No";

export default function ProposalsPage() {
  const { proposals, count, isLoading } = useAllProposals();
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const router = useRouter();
  const PAGE_SIZE = 10;

  const filtered = (
    filter === "all" ? proposals : proposals.filter((p) => p.outcome === filter)
  ).slice().reverse();

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
            onClick={() => { setFilter(f); setPage(1); }}
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
          {paginated.map((proposal) => {
            const deadline = new Date(proposal.resolutionTimestamp * 1000);
            const isPast = deadline.getTime() < Date.now();

            return (
              <Card
                key={proposal.address}
                className="glass-card cursor-pointer rounded-xl border-border transition-all hover:border-causal/30"
                onClick={() => router.push(`/proposals/${proposal.address}?from=${proposal.orgId}`)}
              >
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <CardTitle className="text-base font-semibold leading-tight">
                    {proposal.title || `Proposal #${proposal.id}`}
                  </CardTitle>
                  <StatusBadge outcome={proposal.outcome} />
                </CardHeader>
                <CardContent>
                  {proposal.orgName && (
                    <Link
                      href={`/fundraises/${proposal.orgId}/dashboard`}
                      className="mb-2 inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Building2 className="h-3 w-3" />
                      {proposal.orgName}
                    </Link>
                  )}
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
                  <div className="mt-2 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                    <span className="truncate">{proposal.address}</span>
                    <a
                      href={`https://testnet.snowtrace.io/address/${proposal.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 hover:text-causal transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="sm"
              className="w-9"
              onClick={() => setPage(p)}
            >
              {p}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
