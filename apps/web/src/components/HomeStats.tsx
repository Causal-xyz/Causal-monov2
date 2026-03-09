"use client";

import { useState, useEffect } from "react";
import { formatUnits, createPublicClient, http } from "viem";
import { avalancheFuji } from "viem/chains";
import { CONTRACTS, causalOrganizationsAbi } from "@causal/shared";

interface HomeStatsProps {
  totalOrgs: number;
}

export function HomeStats({ totalOrgs }: HomeStatsProps) {
  const [stats, setStats] = useState({ activeMarkets: 0, totalCapital: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const client = createPublicClient({
          chain: avalancheFuji,
          transport: http("https://api.avax-test.network/ext/bc/C/rpc"),
        });

        let totalCapital = 0;
        let activeCount = 0;
        const limit = Math.min(totalOrgs, 50);

        for (let i = 1; i <= limit; i++) {
          try {
            const orgSale = await client.readContract({
              address: CONTRACTS.causalOrganizations,
              abi: causalOrganizationsAbi,
              functionName: "orgSales",
              args: [BigInt(i)],
            });

            if (orgSale && Array.isArray(orgSale)) {
              const usdcRaised = Number(formatUnits((orgSale[1] as bigint) || 0n, 6));
              totalCapital += usdcRaised;
              const isActive = (orgSale[11] as boolean) || false;
              if (isActive) activeCount += 1;
            }
          } catch {
            // skip
          }
        }

        setStats({ activeMarkets: activeCount, totalCapital });
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    if (totalOrgs > 0) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [totalOrgs]);

  return (
    <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto">
      <div className="glass-card rounded-xl p-4 text-center">
        <div className="text-2xl font-bold text-[#4EDB72]">{totalOrgs}</div>
        <div className="text-xs text-theme-muted">Active Organizations</div>
      </div>
      <div className="glass-card rounded-xl p-4 text-center">
        <div className="text-2xl font-bold text-[#4EDB72]">{loading ? "-" : stats.activeMarkets}</div>
        <div className="text-xs text-theme-muted">Active Fundraisings</div>
      </div>
      <div className="glass-card rounded-xl p-4 text-center">
        <div className="text-2xl font-bold text-[#4EDB72]">
          ${loading ? "..." : stats.totalCapital.toLocaleString("en-US", { maximumFractionDigits: 0 })}
        </div>
        <div className="text-xs text-theme-muted">Capital Raised</div>
      </div>
    </div>
  );
}
