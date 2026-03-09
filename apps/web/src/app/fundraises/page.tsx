"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Clock, CheckCircle, XCircle } from "lucide-react";
import { formatUnits } from "viem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FundraiseStatusBadge } from "@/components/fundraise/FundraiseStatusBadge";
import { FundraiseProgress } from "@/components/fundraise/FundraiseProgress";
import { useAllFundraises } from "@/hooks/useAllFundraises";
import { useOrgLogos } from "@/hooks/useOrgLogos";
import type { FundraiseStatus } from "@causal/shared";

type Filter = "all" | FundraiseStatus;

export default function FundraisesPage() {
  const { fundraises, count, isLoading } = useAllFundraises();
  const logos = useOrgLogos();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered =
    filter === "all"
      ? fundraises
      : fundraises.filter((f) => f.status === filter);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fundraises</h1>
          <p className="mt-1 text-muted-foreground">
            {count} project{count !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link href="/fundraises/create">
          <Button className="btn-glow border-0 text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" />
            Launch Organization
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {(["all", "funding", "finalized", "failed"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === "all"
              ? "All"
              : f === "funding"
                ? "Active"
                : f === "finalized"
                  ? "Finalized"
                  : "Failed"}
          </Button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground">
          Loading fundraises...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          {count === 0
            ? "No fundraises yet. Create the first one!"
            : "No fundraises match this filter."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((org) => {
            const deadline = new Date(org.saleEnd * 1000);
            const isPast = deadline.getTime() < Date.now();

            return (
              <Link key={org.id} href={`/fundraises/${org.id}`}>
                <Card className="glass-card cursor-pointer rounded-xl border-border transition-all hover:border-causal/30">
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {logos[String(org.id)] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={logos[String(org.id)]}
                          alt={org.name}
                          className="h-10 w-10 shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-base font-bold text-muted-foreground">
                          {(org.name || "#")[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <CardTitle className="text-base font-semibold leading-tight">
                          {org.name || `Project #${org.id}`}
                        </CardTitle>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          ${org.symbol}
                        </p>
                      </div>
                    </div>
                    <FundraiseStatusBadge status={org.status} />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <FundraiseProgress
                      raised={org.usdcRaised}
                      goal={org.fundingGoal}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {org.status === "finalized" ? (
                          <CheckCircle className="h-3.5 w-3.5 text-blue-400" />
                        ) : org.status === "failed" ? (
                          <XCircle className="h-3.5 w-3.5 text-destructive" />
                        ) : (
                          <Clock className="h-3.5 w-3.5" />
                        )}
                        <span>
                          {org.status === "funding"
                            ? isPast
                              ? "Sale ended"
                              : `Ends ${deadline.toLocaleString()}`
                            : org.status === "finalized"
                              ? "Successfully funded"
                              : "Did not reach goal"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {parseFloat(
                          formatUnits(org.tokensForSale, 18),
                        ).toLocaleString()}{" "}
                        tokens
                      </span>
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
