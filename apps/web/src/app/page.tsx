"use client";

import Link from "next/link";
import { useReadContract } from "wagmi";
import { HomeStats } from "@/components/HomeStats";
import { CAUSAL_ORGANIZATIONS_ADDRESS, CAUSAL_ORGANIZATIONS_ABI } from "@/lib/contracts";

export default function Home() {
  const { data: orgCount } = useReadContract({
    address: CAUSAL_ORGANIZATIONS_ADDRESS,
    abi: CAUSAL_ORGANIZATIONS_ABI,
    functionName: "orgCount",
  });

  const totalOrgs = orgCount ? Number(orgCount) : 0;

  return (
    <div className="bg-animated min-h-screen relative">
      {/* Hero */}
      <section className="relative z-10 pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="gradient-text">Build. Fund. Execute.</span>
            </h1>
            <p className="text-2xl md:text-3xl text-theme-secondary mb-4">
              The execution economy for on-chain organizations.
            </p>
            <p className="text-lg text-theme-muted max-w-2xl mx-auto mb-12">
              CAUSAL enables crypto organizations to allocate capital through outcome trading instead of voting.
              Markets evaluate decisions before they are executed on-chain.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/fundraises/create" className="px-8 py-4 btn-glow text-black rounded-xl font-semibold text-lg">
                Launch Organization
              </Link>
              <Link href="/fundraises" className="px-8 py-4 glass hover:bg-[var(--bg-card-hover)] text-theme-primary rounded-xl font-semibold text-lg transition">
                Browse Organizations
              </Link>
            </div>
            <HomeStats totalOrgs={totalOrgs} />
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="relative z-10 py-24 border-t border-theme">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-theme-primary">
            Capital Should Be Allocated Through <span className="gradient-text">Execution Quality</span>
          </h2>
          <p className="text-theme-muted text-center mb-16 max-w-2xl mx-auto">
            Replace speculation with accountability. Markets price decisions before execution.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-card rounded-2xl p-8">
              <div className="w-12 h-12 rounded-xl bg-[#4EDB72]/10 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[#4EDB72]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-theme-primary mb-3">Market-Based Execution</h3>
              <p className="text-theme-muted">Participants stake capital on whether decisions will create or destroy value.</p>
            </div>
            <div className="glass-card rounded-2xl p-8">
              <div className="w-12 h-12 rounded-xl bg-[#4EDB72]/10 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[#4EDB72]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-theme-primary mb-3">Capital Alignment</h3>
              <p className="text-theme-muted">Align founders, investors, and communities around measurable economic outcomes.</p>
            </div>
            <div className="glass-card rounded-2xl p-8">
              <div className="w-12 h-12 rounded-xl bg-[#4EDB72]/10 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[#4EDB72]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-theme-primary mb-3">Automated Governance Execution</h3>
              <p className="text-theme-muted">Smart contracts execute approved decisions automatically.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-24 border-t border-theme">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-theme-primary">
            How <span className="gradient-text">Execution Markets</span> Work
          </h2>
          <div className="max-w-3xl mx-auto space-y-8">
            {[
              { step: "01", title: "Proposal Creation", desc: "Organization submits a decision for market evaluation" },
              { step: "02", title: "Stake Activation", desc: "Collateral required to activate the market" },
              { step: "03", title: "Outcome Trading", desc: "PASS / FAIL markets open for trading" },
              { step: "04", title: "TWAP Consensus", desc: "Time-weighted average price determines outcome" },
              { step: "05", title: "Smart Contract Execution", desc: "Approved decisions execute automatically" },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-[#4EDB72] to-[#28CE91] flex items-center justify-center text-black font-bold text-sm">
                  {item.step}
                </div>
                <div className="flex-1 glass-card rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-theme-primary mb-2">{item.title}</h3>
                  <p className="text-theme-muted text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Two-Sided Network */}
      <section className="relative z-10 py-24 border-t border-theme">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-theme-primary">
            A Two-Sided <span className="gradient-text">Economic Network</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="glass-card rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-[#4EDB72] mb-6">Organizations</h3>
              <ul className="space-y-4">
                {["Treasury Management", "Product Strategy", "Token Economics", "Capital Deployment"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-theme-secondary">
                    <div className="w-2 h-2 rounded-full bg-[#4EDB72]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-card rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-[#4EDB72] mb-6">Market Participants</h3>
              <ul className="space-y-4">
                {["Traders", "Capital Allocators", "Information Arbitrage", "Risk Assessment"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-theme-secondary">
                    <div className="w-2 h-2 rounded-full bg-[#4EDB72]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-center text-theme-muted mt-12 text-lg italic">
            &ldquo;Without traders, there is no signal. Without organizations, there is no demand.&rdquo;
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-24 border-t border-theme">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-theme-primary">
            <span className="gradient-text">Launch. Grow. Execute.</span>
          </h2>
          <p className="text-theme-muted mb-12 max-w-2xl mx-auto">
            CAUSAL allows founders to launch projects with market-aligned capital governance from day one.
            Build with your community, not speculation cycles.
          </p>
          <Link href="/fundraises/create" className="inline-block px-8 py-4 btn-glow text-black rounded-xl font-semibold text-lg">
            Launch Your Organization
          </Link>
        </div>
      </section>

      {/* Footer tagline */}
      <section className="relative z-10 py-16 border-t border-theme">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-theme-muted">
            <span className="text-[#4EDB72] font-semibold">CAUSAL</span> — Decision execution infrastructure for the on-chain economy.
          </p>
        </div>
      </section>
    </div>
  );
}
