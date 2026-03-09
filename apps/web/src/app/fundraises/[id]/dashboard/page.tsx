"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useReadContracts,
} from "wagmi";
import { Button } from "@/components/ui/button";
import { useFundraiseInfo } from "@/hooks/useFundraiseInfo";
import { useUserContribution } from "@/hooks/useUserContribution";
import { useOrgLogos } from "@/hooks/useOrgLogos";
import {
  futarchyFactoryAbi,
  futarchyProposalAbi,
  treasuryAbi,
  erc20Abi,
} from "@causal/shared";
import { ExternalLink, Plus, Loader2, Lock, Vote } from "lucide-react";

const USDC_DECIMALS = 6;
const TOKEN_DECIMALS = 18;
const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

const OUTCOME_LABELS: Record<number, string> = {
  0: "Trading",
  1: "Resolved YES",
  2: "Resolved NO",
};

const OUTCOME_COLORS: Record<number, string> = {
  0: "bg-blue-400/15 text-blue-400",
  1: "bg-causal/15 text-causal",
  2: "bg-red-400/15 text-red-400",
};

export default function OrgDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const orgId = parseInt(id, 10);
  const { address: userAddress } = useAccount();
  const router = useRouter();

  const { info, sale, status, tokenAddress, treasuryAddress, factoryAddress, refetch } =
    useFundraiseInfo(orgId);
  const { committed, allocation } = useUserContribution(orgId, userAddress);
  const logos = useOrgLogos();
  const logoUrl = logos[String(orgId)];

  const hasFactory =
    !!factoryAddress && factoryAddress !== ZERO_ADDR;
  const hasTreasury =
    !!treasuryAddress && treasuryAddress !== ZERO_ADDR;
  const hasToken = !!tokenAddress && tokenAddress !== ZERO_ADDR;

  const isFounder =
    userAddress?.toLowerCase() === info?.founder?.toLowerCase();

  // Treasury balance
  const { data: treasuryBalance } = useReadContract({
    address: hasTreasury ? (treasuryAddress as `0x${string}`) : undefined,
    abi: treasuryAbi,
    functionName: "getBalance",
    query: { enabled: hasTreasury, refetchInterval: 5000 },
  });

  // Token data
  const { data: tokenBalance } = useReadContract({
    address: hasToken ? (tokenAddress as `0x${string}`) : undefined,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: hasToken && !!userAddress },
  });
  const { data: tokenSupply } = useReadContract({
    address: hasToken ? (tokenAddress as `0x${string}`) : undefined,
    abi: erc20Abi,
    functionName: "totalSupply",
    query: { enabled: hasToken },
  });

  // Proposal factory reads
  const { data: proposalCountRaw } = useReadContract({
    address: hasFactory ? (factoryAddress as `0x${string}`) : undefined,
    abi: futarchyFactoryAbi,
    functionName: "proposalCount",
    query: { enabled: hasFactory, refetchInterval: 5000 },
  });

  const proposalCountNum = Number(proposalCountRaw ?? 0n);
  const proposalIndices = Array.from({ length: proposalCountNum }, (_, i) => i);

  const { data: proposalAddressResults } = useReadContracts({
    contracts: proposalIndices.map((i) => ({
      address: factoryAddress as `0x${string}`,
      abi: futarchyFactoryAbi,
      functionName: "proposals" as const,
      args: [BigInt(i)] as const,
    })),
    query: { enabled: hasFactory && proposalCountNum > 0 },
  });

  const proposalAddrs = (proposalAddressResults ?? [])
    .map((r) => r.result as `0x${string}`)
    .filter(Boolean);

  const { data: proposalDetails, refetch: refetchProposals } = useReadContracts({
    contracts: proposalAddrs.flatMap((addr) => [
      { address: addr, abi: futarchyProposalAbi, functionName: "title" as const },
      { address: addr, abi: futarchyProposalAbi, functionName: "outcome" as const },
      { address: addr, abi: futarchyProposalAbi, functionName: "usdcRequested" as const },
      { address: addr, abi: futarchyProposalAbi, functionName: "resolutionTimestamp" as const },
    ]),
    query: { enabled: proposalAddrs.length > 0, refetchInterval: 5000 },
  });

  const proposals = proposalAddrs.map((addr, i) => {
    const base = i * 4;
    const d = proposalDetails ?? [];
    return {
      address: addr,
      title: (d[base]?.result as string) ?? "Untitled",
      outcome: Number(d[base + 1]?.result ?? 0),
      usdcRequested: (d[base + 2]?.result as bigint) ?? 0n,
      resolutionTimestamp: Number(d[base + 3]?.result ?? 0),
    };
  });

  function goToCreateProposal() {
    const params = new URLSearchParams();
    if (factoryAddress && factoryAddress !== ZERO_ADDR) params.set("factory", factoryAddress);
    if (tokenAddress && tokenAddress !== ZERO_ADDR) params.set("tokenX", tokenAddress);
    if (treasuryAddress && treasuryAddress !== ZERO_ADDR) params.set("treasury", treasuryAddress);
    params.set("from", String(orgId));
    router.push(`/proposals/create?${params.toString()}`);
  }

  const treasuryFormatted =
    treasuryBalance != null
      ? parseFloat(formatUnits(treasuryBalance as bigint, USDC_DECIMALS))
      : null;
  const tokenBalanceNum = tokenBalance
    ? parseFloat(formatUnits(tokenBalance as bigint, TOKEN_DECIMALS))
    : 0;
  const totalSupplyNum = tokenSupply
    ? parseFloat(formatUnits(tokenSupply as bigint, TOKEN_DECIMALS))
    : 0;
  const votingPower =
    totalSupplyNum > 0 ? (tokenBalanceNum / totalSupplyNum) * 100 : 0;
  const refundNum = allocation
    ? parseFloat(formatUnits(allocation.estimatedRefund, USDC_DECIMALS))
    : 0;
  const committedNum = committed
    ? parseFloat(formatUnits(committed, USDC_DECIMALS))
    : 0;
  const netContributedNum = committedNum - refundNum;

  if (!info || !sale) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Loading dashboard...
      </div>
    );
  }

  if (status !== "finalized") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="glass rounded-2xl p-12">
          <div className="mb-4 flex justify-center">
            <Lock className="h-12 w-12 text-causal" />
          </div>
          <h2 className="mb-2 text-2xl font-bold">Dashboard not available yet</h2>
          <p className="mb-6 text-muted-foreground">
            The DAO dashboard becomes available once the fundraise is finalized and
            governance infrastructure is deployed.
          </p>
          <Link href={`/fundraises/${id}`}>
            <Button variant="outline">Back to Fundraise</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/fundraises" className="hover:text-foreground">
          Fundraises
        </Link>
        <span>/</span>
        <Link href={`/fundraises/${id}`} className="hover:text-foreground">
          {info.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">Dashboard</span>
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={info.name}
              className="h-14 w-14 shrink-0 rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-muted/60 text-xl font-bold text-muted-foreground">
              {info.name[0]?.toUpperCase() ?? "#"}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold">{info.name} DAO</h1>
            <p className="mt-1 text-muted-foreground">
              ${info.symbol} governance dashboard
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasToken && (
            <a
              href={`https://testnet.snowtrace.io/address/${tokenAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground hover:border-causal/40 hover:text-causal transition-colors"
            >
              ${info.symbol} token
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          {hasFactory && (
            <Button
              onClick={goToCreateProposal}
              className="btn-glow border-0 text-primary-foreground"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              New Proposal
            </Button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="glass-card rounded-2xl border-border p-5">
          <p className="mb-1 text-xs text-muted-foreground">Treasury</p>
          <p className="text-2xl font-bold text-causal">
            {treasuryFormatted != null
              ? `$${treasuryFormatted.toLocaleString()}`
              : "..."}
          </p>
          {hasTreasury && (
            <a
              href={`https://testnet.snowtrace.io/address/${treasuryAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block font-mono text-xs text-causal hover:underline"
            >
              {treasuryAddress!.slice(0, 6)}…{treasuryAddress!.slice(-4)} ↗
            </a>
          )}
        </div>

        <div className="glass-card rounded-2xl border-border p-5">
          <p className="mb-1 text-xs text-muted-foreground">Monthly Budget</p>
          <p className="text-2xl font-bold text-foreground">
            $
            {parseFloat(
              formatUnits(sale.discretionaryCap, USDC_DECIMALS),
            ).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">per month cap</p>
        </div>

        <div className="glass-card rounded-2xl border-border p-5">
          <p className="mb-1 text-xs text-muted-foreground">Proposals</p>
          <p className="text-2xl font-bold text-foreground">{proposalCountNum}</p>
          <p className="mt-1 text-xs text-muted-foreground">on-chain</p>
        </div>

        <div className="glass-card rounded-2xl border-border p-5">
          <p className="mb-1 text-xs text-muted-foreground">Your Voting Power</p>
          <p className="text-2xl font-bold text-causal">
            {votingPower.toFixed(2)}%
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {tokenBalanceNum.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}{" "}
            {info.symbol}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Proposals — 2/3 */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Proposals</h2>
            <span className="text-xs text-muted-foreground">
              {proposals.length} on-chain
            </span>
          </div>

          {!hasFactory && (
            <div className="glass-card flex items-center gap-3 rounded-2xl border border-border p-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin shrink-0 text-causal" />
              Waiting for proposal factory to be deployed…
            </div>
          )}

          {/* Empty state */}
          {hasFactory && proposals.length === 0 && (
            <div className="glass-card rounded-2xl p-10 text-center">
              <div className="mb-3 flex justify-center">
                <Vote className="h-10 w-10 text-causal" />
              </div>
              <p className="mb-4 text-muted-foreground">
                No proposals yet. Start governing your DAO.
              </p>
              <Button
                onClick={goToCreateProposal}
                className="btn-glow border-0 text-primary-foreground"
              >
                Create First Proposal
              </Button>
            </div>
          )}

          {/* Proposal list */}
          {[...proposals].reverse().map((p, idx) => (
            <Link
              key={p.address}
              href={`/proposals/${p.address}?from=${orgId}`}
              className="glass-card block rounded-2xl border border-transparent p-6 transition-all hover:border-causal/30"
            >
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      #{proposals.length - idx}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${OUTCOME_COLORS[p.outcome] ?? ""}`}
                    >
                      {OUTCOME_LABELS[p.outcome] ?? "Unknown"}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold">{p.title}</h3>
                </div>
                <span className="text-xs text-causal">View →</span>
              </div>
              <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                {p.usdcRequested > 0n && (
                  <span>
                    $
                    {Number(
                      formatUnits(p.usdcRequested, USDC_DECIMALS),
                    ).toLocaleString()}{" "}
                    USDC
                  </span>
                )}
                <span className="font-mono">
                  {p.address.slice(0, 8)}…
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Your Position */}
          {committedNum > 0 && (
            <div className="glass-card rounded-2xl p-5">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your Position
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contributed</span>
                  <span className="font-semibold">
                    ${netContributedNum.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC
                  </span>
                </div>
                {refundNum > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Refunded</span>
                    <span className="text-muted-foreground">
                      −${refundNum.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tokens held</span>
                  <span className="font-semibold text-causal">
                    {tokenBalanceNum.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}{" "}
                    {info.symbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Voting power</span>
                  <span className="font-semibold text-causal">
                    {votingPower.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Founder Tools */}
          {isFounder && (
            <div className="glass-card rounded-2xl border border-yellow-400/20 p-5">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-yellow-400">
                Founder Tools
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Treasury</span>
                  <span className="font-semibold text-causal">
                    {treasuryFormatted != null
                      ? `$${treasuryFormatted.toLocaleString()}`
                      : "…"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly cap</span>
                  <span>
                    $
                    {parseFloat(
                      formatUnits(sale.discretionaryCap, USDC_DECIMALS),
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Token Contract */}
          {hasToken && (
            <div className="glass-card rounded-2xl p-5">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Token Contract
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Symbol</span>
                  <span className="font-semibold">{info.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Supply</span>
                  <span>
                    {(totalSupplyNum / 1e6).toFixed(1)}M
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Address</span>
                  <a
                    href={`https://testnet.snowtrace.io/address/${tokenAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-causal hover:underline"
                  >
                    {tokenAddress!.slice(0, 6)}…{tokenAddress!.slice(-4)} ↗
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Proposal Factory */}
          {hasFactory && (
            <div className="glass-card rounded-2xl p-5">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Proposal Factory
              </h3>
              <a
                href={`https://testnet.snowtrace.io/address/${factoryAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all font-mono text-sm text-causal hover:underline"
              >
                {factoryAddress!.slice(0, 6)}…{factoryAddress!.slice(-4)} ↗
              </a>
              <p className="mt-2 text-xs text-muted-foreground">
                {proposalCountNum} proposals created
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
