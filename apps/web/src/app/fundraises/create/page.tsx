"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { parseUnits } from "viem";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useCreateOrganization } from "@/hooks/useCreateOrganization";
import { Loader2 } from "lucide-react";

type DurationUnit = "minutes" | "hours" | "days";

interface FormState {
  readonly name: string;
  readonly symbol: string;
  readonly description: string;
  readonly imageUrl: string;
  readonly totalTokenSupply: string;
  readonly tokensForSale: string;
  readonly fundingGoal: string;
  readonly saleDurationValue: string;
  readonly saleDurationUnit: DurationUnit;
  readonly alpha: string;
}

const UNIT_MULTIPLIERS: Record<DurationUnit, number> = {
  minutes: 60,
  hours: 3600,
  days: 86400,
};

const INITIAL_FORM: FormState = {
  name: "",
  symbol: "",
  description: "",
  imageUrl: "",
  totalTokenSupply: "1000000",
  tokensForSale: "500000",
  fundingGoal: "10000",
  saleDurationValue: "7",
  saleDurationUnit: "days",
  alpha: "50",
};

const USDC_DECIMALS = 6;
const TOKEN_DECIMALS = 18;
const PRECISION = 10n ** 18n;

export default function CreateFundraisePage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const {
    createOrganization,
    isPending,
    isConfirming,
    isSuccess,
    hash,
    error,
  } = useCreateOrganization();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  const updateField = useCallback(
    (field: keyof FormState, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const alphaPercent = parseFloat(form.alpha) || 0;
    const alphaPrecision = BigInt(Math.round(alphaPercent * 1e16)); // alpha as fraction of 1e18

    createOrganization({
      name: form.name,
      symbol: form.symbol.toUpperCase(),
      description: form.description,
      imageUrl: form.imageUrl,
      totalTokenSupply: parseUnits(form.totalTokenSupply || "0", TOKEN_DECIMALS),
      tokensForSale: parseUnits(form.tokensForSale || "0", TOKEN_DECIMALS),
      fundingGoal: parseUnits(form.fundingGoal || "0", USDC_DECIMALS),
      saleDuration: BigInt(
        Math.floor(
          parseFloat(form.saleDurationValue || "0") *
            UNIT_MULTIPLIERS[form.saleDurationUnit],
        ),
      ),
      alpha: alphaPrecision,
    });
  }

  if (isSuccess) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <h1 className="mb-4 text-3xl font-bold">
          <span className="gradient-text">Fundraise Created!</span>
        </h1>
        <p className="mb-6 text-muted-foreground">
          Your fundraise has been deployed. Investors can now contribute USDC.
        </p>
        <Button
          onClick={() => router.push("/fundraises")}
          className="btn-glow border-0 text-primary-foreground"
        >
          View All Fundraises
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="mb-2 text-3xl font-bold">Create Fundraise</h1>
      <p className="mb-8 text-muted-foreground">
        Launch a new project. Raise USDC from investors and unlock futarchy
        governance.
      </p>

      <form onSubmit={handleSubmit}>
        <Card className="glass-card rounded-xl border-border">
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Define your project and token parameters.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Name + Symbol */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g. Avalanche DeFi Hub"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-causal/50 focus:ring-1 focus:ring-causal/30"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Token Symbol
                </label>
                <input
                  type="text"
                  required
                  value={form.symbol}
                  onChange={(e) => updateField("symbol", e.target.value)}
                  placeholder="e.g. ADHUB"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm uppercase outline-none transition-colors focus:border-causal/50 focus:ring-1 focus:ring-causal/30"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Description
              </label>
              <textarea
                required
                rows={3}
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Describe your project, its goals, and what the funds will be used for..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-causal/50 focus:ring-1 focus:ring-causal/30"
              />
            </div>

            {/* Image URL */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Image URL (optional)
              </label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => updateField("imageUrl", e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-causal/50 focus:ring-1 focus:ring-causal/30"
              />
            </div>

            {/* Token Supply */}
            <div className="rounded-lg border border-border/50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                Token Economics
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Total Token Supply
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={form.totalTokenSupply}
                    onChange={(e) =>
                      updateField("totalTokenSupply", e.target.value)
                    }
                    placeholder="1000000"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-causal/50 focus:ring-1 focus:ring-causal/30"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Tokens for Sale
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={form.tokensForSale}
                    onChange={(e) =>
                      updateField("tokensForSale", e.target.value)
                    }
                    placeholder="500000"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-causal/50 focus:ring-1 focus:ring-causal/30"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Remaining tokens go to the treasury.
                  </p>
                </div>
              </div>
            </div>

            {/* Fundraise Config */}
            <div className="rounded-lg border border-border/50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                Fundraise Configuration
              </h3>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Funding Goal (USDC)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      required
                      value={form.fundingGoal}
                      onChange={(e) =>
                        updateField("fundingGoal", e.target.value)
                      }
                      placeholder="10000"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-causal/50 focus:ring-1 focus:ring-causal/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Sale Duration
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        value={form.saleDurationValue}
                        onChange={(e) =>
                          updateField("saleDurationValue", e.target.value)
                        }
                        placeholder="7"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-causal/50 focus:ring-1 focus:ring-causal/30"
                      />
                      <select
                        value={form.saleDurationUnit}
                        onChange={(e) =>
                          updateField("saleDurationUnit", e.target.value)
                        }
                        className="rounded-lg border border-border bg-background px-2 py-2 text-sm outline-none transition-colors focus:border-causal/50 focus:ring-1 focus:ring-causal/30"
                      >
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Time-Weight Alpha (%)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={form.alpha}
                    onChange={(e) => updateField("alpha", e.target.value)}
                    placeholder="50"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-causal/50 focus:ring-1 focus:ring-causal/30"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    0% = pure pro-rata, 100% = fully time-weighted. Early
                    investors get more weight with higher alpha.
                  </p>
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
              disabled={!isConnected || isPending || isConfirming}
              className="btn-glow w-full border-0 py-3 text-primary-foreground"
            >
              {!isConnected ? (
                "Connect wallet first"
              ) : isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirm in wallet...
                </>
              ) : isConfirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating fundraise...
                </>
              ) : (
                "Create Fundraise"
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
