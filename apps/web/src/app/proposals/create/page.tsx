"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { parseUnits, isAddress } from "viem";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CONTRACTS } from "@causal/shared";
import { useCreateProposal } from "@/hooks/useCreateProposal";
import { useTransactionToast } from "@/hooks/useTransactionToast";
import { Loader2 } from "lucide-react";

interface FormState {
  readonly title: string;
  readonly tokenX: string;
  readonly usdc: string;
  readonly resolutionDate: string;
  readonly resolutionTime: string;
  readonly twapWindowMinutes: string;
  readonly transferToken: string;
  readonly recipient: string;
  readonly transferAmount: string;
}

function buildInitialForm(searchParams: URLSearchParams): FormState {
  const tokenXParam = searchParams.get("tokenX") ?? "";
  return {
    title: "",
    tokenX: isAddress(tokenXParam) ? tokenXParam : (CONTRACTS.mockTokenX || ""),
    usdc: CONTRACTS.mockUsdc || "",
    resolutionDate: "",
    resolutionTime: "",
    twapWindowMinutes: "60",
    transferToken: isAddress(tokenXParam) ? tokenXParam : "",
    recipient: "",
    transferAmount: "0",
  };
}

export default function CreateProposalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const factoryParam = searchParams.get("factory") ?? "";
  const factoryAddress = (isAddress(factoryParam) ? factoryParam : CONTRACTS.factory) as `0x${string}`;
  const hasValidFactory = isAddress(factoryAddress);

  const { address, isConnected } = useAccount();
  const { createProposal, isPending, isConfirming, isSuccess, hash, error } =
    useCreateProposal(factoryAddress);
  const [form, setForm] = useState<FormState>(() => buildInitialForm(searchParams));

  useTransactionToast({
    hash,
    isConfirming,
    isSuccess,
    error,
    labels: { success: "Proposal created!", pending: "Deploying proposal..." },
  });

  const updateField = useCallback(
    (field: keyof FormState, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const resolutionTimestamp = BigInt(
      Math.floor(
        new Date(`${form.resolutionDate}T${form.resolutionTime}`).getTime() / 1000,
      ),
    );

    createProposal({
      title: form.title,
      tokenX: form.tokenX as `0x${string}`,
      usdc: form.usdc as `0x${string}`,
      resolutionTimestamp,
      transferToken: (form.transferToken || form.tokenX) as `0x${string}`,
      recipient: (form.recipient || address!) as `0x${string}`,
      transferAmount: parseUnits(form.transferAmount || "0", 18),
      twapWindow: Math.max(60, parseInt(form.twapWindowMinutes || "60", 10) * 60),
    });
  }

  if (isSuccess) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <h1 className="mb-4 text-3xl font-bold">
          <span className="gradient-text">Proposal Created!</span>
        </h1>
        <p className="mb-6 text-muted-foreground">
          Your proposal has been deployed to the blockchain.
        </p>
        <Button
          onClick={() => router.push("/proposals")}
          className="btn-glow border-0 text-primary-foreground"
        >
          View All Proposals
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="mb-2 text-3xl font-bold">Create Proposal</h1>
      <p className="mb-8 text-muted-foreground">
        Define a governance action and let the market decide its outcome.
      </p>

      {!hasValidFactory && (
        <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-400">
          No factory address provided. Navigate to a finalized fundraise and click
          &ldquo;Create Proposal&rdquo; to use the org&apos;s proposal factory.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="glass-card rounded-xl border-border">
          <CardHeader>
            <CardTitle>Proposal Details</CardTitle>
            <CardDescription>
              Configure the proposal parameters for the futarchy market.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Title */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Title</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="e.g. Fund marketing initiative with 10,000 CTK"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-causal/50 focus:ring-1 focus:ring-causal/30"
              />
            </div>

            {/* Token addresses */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Token X (Governance Token)
                </label>
                <input
                  type="text"
                  required
                  value={form.tokenX}
                  onChange={(e) => updateField("tokenX", e.target.value)}
                  placeholder="0x..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs outline-none transition-colors focus:border-causal/50 focus:ring-1 focus:ring-causal/30"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Stablecoin (USDC)
                </label>
                <input
                  type="text"
                  required
                  value={form.usdc}
                  onChange={(e) => updateField("usdc", e.target.value)}
                  placeholder="0x..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs outline-none transition-colors focus:border-causal/50 focus:ring-1 focus:ring-causal/30"
                />
              </div>
            </div>

            {/* Resolution timestamp */}
            <div className="space-y-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Resolution Date
                  </label>
                  <input
                    type="date"
                    required
                    value={form.resolutionDate}
                    onChange={(e) => updateField("resolutionDate", e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-causal/50 focus:ring-1 focus:ring-causal/30"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Resolution Time
                  </label>
                  <input
                    type="time"
                    required
                    value={form.resolutionTime}
                    onChange={(e) => updateField("resolutionTime", e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-causal/50 focus:ring-1 focus:ring-causal/30"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground self-center">Quick:</span>
                {[5, 10, 30, 60].map((minutes) => {
                  const label = minutes < 60 ? `${minutes}m` : `${minutes / 60}h`;
                  return (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => {
                        const d = new Date(Date.now() + minutes * 60_000);
                        updateField("resolutionDate", d.toISOString().slice(0, 10));
                        updateField(
                          "resolutionTime",
                          d.toTimeString().slice(0, 5),
                        );
                      }}
                      className="rounded-md border border-border bg-background px-2 py-1 text-xs transition-colors hover:border-causal/50 hover:bg-causal/10"
                    >
                      +{label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TWAP Window */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                TWAP Window (minutes)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={form.twapWindowMinutes}
                  onChange={(e) => updateField("twapWindowMinutes", e.target.value)}
                  placeholder="60"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-causal/50 focus:ring-1 focus:ring-causal/30"
                />
                <div className="flex gap-1">
                  {[1, 5, 10, 60].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => updateField("twapWindowMinutes", String(m))}
                      className="whitespace-nowrap rounded-md border border-border bg-background px-2 py-1 text-xs transition-colors hover:border-causal/50 hover:bg-causal/10"
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Oracle observation window for TWAP price. Min 1 minute. Use short windows for testing.
              </p>
            </div>

            {/* Transfer action (if YES wins) */}
            <div className="rounded-lg border border-border/50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                Execution Action (if YES wins)
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Transfer Token
                  </label>
                  <input
                    type="text"
                    value={form.transferToken}
                    onChange={(e) => updateField("transferToken", e.target.value)}
                    placeholder="Same as Token X if empty"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs outline-none transition-colors focus:border-causal/50 focus:ring-1 focus:ring-causal/30"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Recipient
                    </label>
                    <input
                      type="text"
                      value={form.recipient}
                      onChange={(e) => updateField("recipient", e.target.value)}
                      placeholder="Your address if empty"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs outline-none transition-colors focus:border-causal/50 focus:ring-1 focus:ring-causal/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Amount
                    </label>
                    <input
                      type="text"
                      value={form.transferAmount}
                      onChange={(e) => updateField("transferAmount", e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-causal/50 focus:ring-1 focus:ring-causal/30"
                    />
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error.message}
              </div>
            )}

            <Button
              type="submit"
              disabled={!isConnected || !hasValidFactory || isPending || isConfirming}
              className="btn-glow w-full border-0 py-3 text-primary-foreground"
            >
              {!isConnected ? (
                "Connect wallet first"
              ) : !hasValidFactory ? (
                "No factory address"
              ) : isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirm in wallet...
                </>
              ) : isConfirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deploying proposal...
                </>
              ) : (
                "Create Proposal"
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
