"use client";

import { Badge } from "@/components/ui/badge";
import type { Outcome } from "@causal/shared";

const OUTCOME_CONFIG = {
  Unresolved: { label: "Trading", variant: "outline" as const, className: "border-causal/30 text-causal" },
  Yes: { label: "Resolved YES", variant: "default" as const, className: "bg-causal text-primary-foreground" },
  No: { label: "Resolved NO", variant: "destructive" as const, className: "" },
} as const;

interface StatusBadgeProps {
  readonly outcome: Outcome;
}

export function StatusBadge({ outcome }: StatusBadgeProps) {
  const config = OUTCOME_CONFIG[outcome];

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}
