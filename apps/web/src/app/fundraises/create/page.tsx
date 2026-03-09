"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { parseUnits } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { causalOrganizationsAbi, CONTRACTS } from "@causal/shared";
import { Button } from "@/components/ui/button";
import { useCreateOrganization } from "@/hooks/useCreateOrganization";
import { useTransactionToast } from "@/hooks/useTransactionToast";
import { saveOrgLogo } from "@/hooks/useOrgLogos";
import { saveOrgMeta } from "@/hooks/useOrgMeta";
import { Loader2, Globe, Upload, CheckCircle2, List } from "lucide-react";

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

type DurationUnit = "minutes" | "hours" | "days";

interface FormState {
  readonly name: string;
  readonly symbol: string;
  readonly imageUrl: string;
  readonly website: string;
  readonly twitter: string;
  readonly shortDescription: string;
  readonly description: string;
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
  imageUrl: "",
  website: "",
  twitter: "",
  shortDescription: "",
  description: "",
  totalTokenSupply: "1000000",
  tokensForSale: "500000",
  fundingGoal: "10000",
  saleDurationValue: "7",
  saleDurationUnit: "days",
  alpha: "50",
};

const USDC_DECIMALS = 6;
const TOKEN_DECIMALS = 18;

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
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingLogoRef = useRef<{ orgId: number; url: string } | null>(null);
  const pendingMetaRef = useRef<{ orgId: number; website: string; twitter: string; shortDescription: string; description: string } | null>(null);

  // Read current orgCount so we know the ID the next org will get
  const { data: orgCountRaw } = useReadContract({
    address: CONTRACTS.causalOrganizations,
    abi: causalOrganizationsAbi,
    functionName: "orgCount",
  });

  // After tx confirms, persist logo + meta to our server store
  useEffect(() => {
    if (isSuccess) {
      if (pendingLogoRef.current) {
        const { orgId, url } = pendingLogoRef.current;
        saveOrgLogo(orgId, url).catch(console.error);
        pendingLogoRef.current = null;
      }
      if (pendingMetaRef.current) {
        const { orgId, ...meta } = pendingMetaRef.current;
        saveOrgMeta(orgId, meta).catch(console.error);
        pendingMetaRef.current = null;
      }
    }
  }, [isSuccess]);

  useTransactionToast({
    hash,
    isConfirming,
    isSuccess,
    error,
    labels: { success: "Organization launched!", pending: "Launching organization..." },
  });

  const updateField = useCallback(
    (field: keyof FormState, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));

    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body });
      if (!res.ok) throw new Error(await res.text());
      const { url } = await res.json() as { url: string };
      updateField("imageUrl", url);
    } catch (err) {
      console.error("Image upload failed:", err);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Capture the future org ID (current count = next slot)
    const nextOrgId = Number(orgCountRaw ?? 0n);
    if (form.imageUrl) {
      pendingLogoRef.current = { orgId: nextOrgId, url: form.imageUrl };
    }
    pendingMetaRef.current = {
      orgId: nextOrgId,
      website: form.website,
      twitter: form.twitter,
      shortDescription: form.shortDescription,
      description: form.description,
    };

    const alphaPercent = parseFloat(form.alpha) || 0;
    const alphaPrecision = BigInt(Math.round(alphaPercent * 1e16));

    createOrganization({
      name: form.name,
      symbol: form.symbol.toUpperCase(),
      description: form.description,
      imageUrl: "",  // stored off-chain in our server, not on the blockchain
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

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-sm placeholder:text-muted-foreground outline-none transition-colors focus:border-causal/50 focus:ring-1 focus:ring-causal/30";

  const textareaClass =
    "w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-sm placeholder:text-muted-foreground outline-none transition-colors focus:border-causal/50 focus:ring-1 focus:ring-causal/30 resize-none";

  if (isSuccess) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="glass max-w-md rounded-2xl p-12 text-center">
          <div className="mb-6 flex justify-center">
            <CheckCircle2 className="h-16 w-16 text-causal" />
          </div>
          <h2 className="mb-4 text-3xl font-bold">
            <span className="gradient-text">Organization Launched!</span>
          </h2>
          <p className="mb-8 text-muted-foreground">
            Your organization is now live. Investors can contribute USDC.
          </p>
          <Button
            onClick={() => router.push("/fundraises")}
            className="btn-glow border-0 text-primary-foreground"
          >
            View All Organizations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="mb-3 text-4xl font-bold">Launch Organization</h1>
          <p className="text-muted-foreground">
            Launch a new project. Raise USDC from investors and unlock futarchy governance.
          </p>
        </div>

        {!isConnected ? (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-lg text-muted-foreground">
              Please connect your wallet to launch an organization.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Basic Information */}
            <div className="glass rounded-2xl p-8">
              <h2 className="mb-6 text-2xl font-bold">Basic Information</h2>

              <div className="flex gap-5">
                {/* Logo upload */}
                <div className="shrink-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-24 w-24 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-white/5/50 text-muted-foreground transition-colors hover:border-causal/50 hover:text-causal overflow-hidden"
                    title="Upload logo (400×400 recommended)"
                  >
                    {logoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logoPreview}
                        alt="Logo"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <>
                        <Upload className="mb-1 h-6 w-6" />
                        <span className="text-center text-xs leading-tight">Upload<br />logo</span>
                      </>
                    )}
                  </button>
                  <p className="mt-1 text-center text-xs text-muted-foreground">Preview</p>
                </div>

                {/* Name + Symbol */}
                <div className="flex flex-1 flex-col gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Organization Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      placeholder="e.g. Avalanche DeFi Hub"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Token Symbol *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.symbol}
                      onChange={(e) => updateField("symbol", e.target.value)}
                      placeholder="e.g. ADHUB"
                      className={`${inputClass} uppercase`}
                    />
                  </div>
                </div>
              </div>

              {form.imageUrl && (
                <p className="mt-3 text-xs text-causal">
                  ✓ Logo uploaded — it will be saved to our server when you submit.
                </p>
              )}

              {/* Social Links */}
              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold">Social Links</label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <input
                      type="url"
                      value={form.website}
                      onChange={(e) => updateField("website", e.target.value)}
                      placeholder="https://yourproject.com"
                      className={inputClass}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <XIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <input
                      type="text"
                      value={form.twitter}
                      onChange={(e) => updateField("twitter", e.target.value)}
                      placeholder="@yourhandle or https://x.com/yourhandle"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div className="glass rounded-2xl p-8">
              <h2 className="mb-6 text-2xl font-bold">Project Details</h2>
              <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold">Short Description</label>
                <input
                  type="text"
                  maxLength={140}
                  value={form.shortDescription}
                  onChange={(e) => updateField("shortDescription", e.target.value)}
                  placeholder="One-liner pitch — shown as a subtitle on your fundraise page (max 140 chars)"
                  className={inputClass}
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {form.shortDescription.length}/140
                </p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">Description *</label>
                <textarea
                  required
                  rows={10}
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Tell investors about your project — the problem you're solving, your solution, your team, and your vision."
                  className={textareaClass}
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Stored on our server. Displayed on your fundraise page.
                </p>
              </div>
              </div>
            </div>

            {/* Token Economics */}
            <div className="glass rounded-2xl p-8">
              <h2 className="mb-6 text-2xl font-bold">Token Economics</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Total Token Supply *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={form.totalTokenSupply}
                    onChange={(e) => updateField("totalTokenSupply", e.target.value)}
                    placeholder="1000000"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Tokens for Sale *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={form.tokensForSale}
                    onChange={(e) => updateField("tokensForSale", e.target.value)}
                    placeholder="500000"
                    className={inputClass}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Remaining tokens go to the treasury.
                  </p>
                </div>
              </div>
            </div>

            {/* Fundraise Configuration */}
            <div className="glass rounded-2xl p-8">
              <h2 className="mb-6 text-2xl font-bold">Fundraise Configuration</h2>
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Funding Goal (USDC) *
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      required
                      value={form.fundingGoal}
                      onChange={(e) => updateField("fundingGoal", e.target.value)}
                      placeholder="10000"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Sale Duration *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        value={form.saleDurationValue}
                        onChange={(e) => updateField("saleDurationValue", e.target.value)}
                        placeholder="7"
                        className={inputClass}
                      />
                      <select
                        value={form.saleDurationUnit}
                        onChange={(e) => updateField("saleDurationUnit", e.target.value)}
                        className="rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-sm outline-none transition-colors focus:border-causal/50 focus:ring-1 focus:ring-causal/30"
                      >
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Time-Weight Alpha (%) *
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={form.alpha}
                    onChange={(e) => updateField("alpha", e.target.value)}
                    placeholder="50"
                    className={inputClass}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    0% = pure pro-rata, 100% = fully time-weighted. Early investors get more weight with higher alpha.
                  </p>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="rounded-2xl border border-causal/20 bg-causal/5 p-6">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-bold"><List className="h-4 w-4 text-causal" /> How It Works</h3>
              <ol className="ml-4 list-decimal space-y-2 text-sm text-muted-foreground">
                <li>Launch your organization with detailed project information</li>
                <li>Contributors invest USDC to support your project during the sale window</li>
                <li>If the funding goal is reached, the campaign is marked as funded</li>
                <li>Token holders can vote on proposals via futarchy governance</li>
                <li>Market-based outcomes determine fund release to the founder</li>
              </ol>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                {error.message}
              </div>
            )}

            <Button
              type="submit"
              disabled={isPending || isConfirming}
              className="btn-glow w-full border-0 py-4 text-lg font-semibold text-primary-foreground"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Confirm in wallet...
                </>
              ) : isConfirming ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Launching organization...
                </>
              ) : (
                "Launch Organization"
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
