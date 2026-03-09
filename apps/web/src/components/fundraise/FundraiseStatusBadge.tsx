"use client";

import type { FundraiseStatus } from "@causal/shared";
import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<
  FundraiseStatus,
  { label: string; className: string }
> = {
  funding: {
    label: "Funding",
    className:
      "bg-causal/15 text-causal border-causal/30 hover:bg-causal/20",
  },
  finalized: {
    label: "Finalized",
    className:
      "bg-blue-500/15 text-blue-400 border-blue-400/30 hover:bg-blue-500/20",
  },
  failed: {
    label: "Failed",
    className:
      "bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20",
  },
};

interface FundraiseStatusBadgeProps {
  readonly status: FundraiseStatus;
}

export function FundraiseStatusBadge({ status }: FundraiseStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
