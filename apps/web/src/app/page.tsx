import Link from "next/link";
import { ArrowRight, BarChart3, Scale, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const VALUE_PROPS = [
  {
    icon: Scale,
    title: "Futarchy Governance",
    description: "Decisions made by markets, not votes. Harness collective intelligence to find the best outcomes.",
  },
  {
    icon: BarChart3,
    title: "Prediction Markets",
    description: "Trade conditional tokens that reflect the market's belief about proposal outcomes.",
  },
  {
    icon: Zap,
    title: "On-Chain Resolution",
    description: "Automated resolution via Uniswap V3 TWAP oracle. No trusted intermediaries needed.",
  },
] as const;

const STEPS = [
  { num: "01", title: "Create Proposal", description: "Define the governance action and set a resolution deadline" },
  { num: "02", title: "Split Tokens", description: "Split base tokens into YES/NO conditional pairs" },
  { num: "03", title: "Trade", description: "Buy/sell conditional tokens on Uniswap V3 pools" },
  { num: "04", title: "Resolve", description: "TWAP oracle compares YES vs NO prices after deadline" },
  { num: "05", title: "Redeem", description: "Winners redeem conditional tokens for the underlying asset" },
] as const;

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center px-4 pb-20 pt-24 text-center sm:px-6">
        <h1 className="max-w-4xl text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
          Trade on Beliefs,{" "}
          <span className="gradient-text">Govern with Markets</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Causal Trading is a futarchy-based prediction market where proposal
          outcomes are determined by market prices, not votes.
        </p>
        <div className="mt-10 flex gap-4">
          <Link href="/proposals">
            <Button className="btn-glow border-0 px-6 py-3 text-primary-foreground">
              View Proposals
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/proposals/create">
            <Button variant="outline" className="px-6 py-3">
              Create Proposal
            </Button>
          </Link>
        </div>
      </section>

      {/* Value Props */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
          {VALUE_PROPS.map((prop) => (
            <Card key={prop.title} className="glass-card rounded-xl border-border">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-causal/10">
                  <prop.icon className="h-6 w-6 text-causal" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{prop.title}</h3>
                <p className="text-sm text-muted-foreground">{prop.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-3xl font-bold">
            How <span className="gradient-text">Futarchy</span> Works
          </h2>
          <div className="space-y-6">
            {STEPS.map((step) => (
              <div
                key={step.num}
                className="glass-card flex items-start gap-4 rounded-xl border-border p-5"
              >
                <span className="gradient-text flex-shrink-0 text-2xl font-bold">
                  {step.num}
                </span>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
