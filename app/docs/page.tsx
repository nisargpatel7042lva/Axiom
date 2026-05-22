"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Code2,
  ExternalLink,
  FileText,
  HelpCircle,
  Layers,
  Lock,
  Shield,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";

import { useDevnetVaults } from "@/hooks/useDevnetVaults";
import { formatUsdCompact } from "@/components/format";
import { Skeleton } from "@/components/ui/Skeleton";

import { Topbar } from "@/components/layout/Topbar";
import { SiteAuroraBackdrop } from "@/components/layout/SiteAuroraBackdrop";

/* ─── Section registry ─── */
const SECTIONS = [
  { id: "overview",        label: "Overview",          icon: BookOpen },
  { id: "how-it-works",   label: "How It Works",      icon: Layers },
  { id: "three-vaults",   label: "The Three Vaults",  icon: Sparkles },
  { id: "strategy-engine",label: "Strategy Engine",   icon: Zap },
  { id: "nav-performance",label: "NAV & Performance",  icon: TrendingUp },
  { id: "integrations",   label: "Integrations",       icon: Code2 },
  { id: "security-trust", label: "Security & Trust",   icon: Shield },
  { id: "faq",            label: "FAQ",                icon: HelpCircle },
] as const;

const SPRING = {
  stiff:  { type: "spring" as const, stiffness: 350, damping: 28 },
  smooth: { type: "spring" as const, stiffness: 300, damping: 30 },
};

/* ─── Reusable section wrapper ─── */
function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28">
      {children}
    </section>
  );
}

/* ─── Inline code block ─── */
function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="mt-4 overflow-x-auto rounded-xl border border-[#1a2235] bg-[#060a10] p-4 text-xs leading-relaxed text-[#00e5c3] font-[family-name:var(--font-space-mono)]">
      <code>{children}</code>
    </pre>
  );
}

/* ─── Section heading ─── */
function SectionHeading({
  label,
  title,
  subtitle,
}: {
  label: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8">
      <div className="inline-flex items-center gap-1.5 rounded-full border border-[#00e5c3]/25 bg-[#00e5c3]/10 px-3 py-1">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#00e5c3]">
          {label}
        </span>
      </div>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#e8edf5] md:text-3xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#8b9cb3] md:text-base">
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* ─── Card ─── */
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-[#1a2235] bg-[#0d1420]/95 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

/* ─── Step badge ─── */
function StepBadge({ n, color = "#00e5c3" }: { n: number; color?: string }) {
  return (
    <span
      className="flex size-8 shrink-0 items-center justify-center rounded-lg font-[family-name:var(--font-space-mono)] text-sm font-bold"
      style={{ backgroundColor: `${color}18`, color }}
    >
      {n}
    </span>
  );
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const { totalTvl, onlineCount, loading: vaultLoading } = useDevnetVaults();

  /* Active section tracking via IntersectionObserver */
  useEffect(() => {
    const ids = SECTIONS.map((s) => s.id);
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const top = visible.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b
        );
        setActiveSection(top.target.id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );

    els.forEach((el) => observerRef.current!.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileNavOpen(false);
  };

  return (
    <div className="relative min-h-screen bg-[#080c14]">
      <SiteAuroraBackdrop />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Topbar />

        <main className="flex-1 pt-[5.75rem] min-[391px]:pt-[6rem]">
          {/* Mobile section nav */}
          <div className="sticky top-[5.75rem] z-30 border-b border-white/5 bg-[#080c14]/95 backdrop-blur-md lg:hidden">
            <div className="mx-auto max-w-6xl px-4">
              <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
                {SECTIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      activeSection === s.id
                        ? "bg-[#00e5c3]/15 text-[#00e5c3]"
                        : "text-[#8b9cb3] hover:text-white"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 md:px-6">
            <div className="flex gap-10 lg:gap-14">
              {/* Desktop sidebar */}
              <aside className="hidden lg:block">
                <div className="sticky top-28 w-48 shrink-0">
                  <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-[#8b9cb3]">
                    Contents
                  </p>
                  <nav className="flex flex-col gap-0.5">
                    {SECTIONS.map((s) => {
                      const Icon = s.icon;
                      const active = activeSection === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => scrollTo(s.id)}
                          className={`group flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-all duration-150 ${
                            active
                              ? "bg-[#00e5c3]/12 text-[#00e5c3]"
                              : "text-[#8b9cb3] hover:bg-white/[0.05] hover:text-[#c5d0df]"
                          }`}
                        >
                          <Icon
                            className={`size-3.5 shrink-0 transition-colors ${
                              active ? "text-[#00e5c3]" : "text-[#8b9cb3] group-hover:text-[#c5d0df]"
                            }`}
                          />
                          <span className="font-medium">{s.label}</span>
                          {active && (
                            <ChevronRight className="ml-auto size-3 text-[#00e5c3]" />
                          )}
                        </button>
                      );
                    })}
                  </nav>

                  <div className="mt-8 rounded-xl border border-[#1a2235] bg-[#0d1420] p-4">
                    <p className="text-xs font-medium text-[#e8edf5]">On Devnet</p>
                    <p className="mt-1 text-xs text-[#8b9cb3]">
                      No real funds at risk. Test USDC only.
                    </p>
                    <Link
                      href="/vaults"
                      className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[#00e5c3] hover:underline"
                    >
                      Open vaults <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </div>
              </aside>

              {/* Main content */}
              <div className="min-w-0 flex-1 space-y-16">

                {/* ── OVERVIEW ── */}
                <Section id="overview">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={SPRING.stiff}
                  >
                    <SectionHeading
                      label="Overview"
                      title="Axiom Vaults"
                      subtitle="The first set-and-forget prediction market ETF on Solana. Deposit USDC once, pick your risk level, and an autonomous engine manages everything — scanning markets, entering positions, managing exits, and routing idle capital to earn yield between trades."
                    />

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {/* TVL — live from on-chain */}
                      <Card className="text-center">
                        {vaultLoading ? (
                          <Skeleton className="mx-auto h-8 w-20 bg-white/5" />
                        ) : (
                          <p className="text-2xl font-bold text-[#00e5c3] font-[family-name:var(--font-space-mono)]">
                            {formatUsdCompact(totalTvl)}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-[#8b9cb3]">Total TVL</p>
                      </Card>
                      {/* Live Vaults — live from on-chain */}
                      <Card className="text-center">
                        {vaultLoading ? (
                          <Skeleton className="mx-auto h-8 w-10 bg-white/5" />
                        ) : (
                          <p className="text-2xl font-bold text-[#00e5c3] font-[family-name:var(--font-space-mono)]">
                            {onlineCount}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-[#8b9cb3]">Live Vaults</p>
                      </Card>
                      {/* Static facts */}
                      <Card className="text-center">
                        <p className="text-2xl font-bold text-[#00e5c3] font-[family-name:var(--font-space-mono)]">5</p>
                        <p className="mt-1 text-xs text-[#8b9cb3]">Jupiter APIs</p>
                      </Card>
                      <Card className="text-center">
                        <p className="text-2xl font-bold text-[#00e5c3] font-[family-name:var(--font-space-mono)]">23</p>
                        <p className="mt-1 text-xs text-[#8b9cb3]">On-Chain Instructions</p>
                      </Card>
                    </div>

                    <Card className="mt-5">
                      <p className="text-sm leading-relaxed text-[#c5d0df]">
                        Prediction markets have serious alpha. Capturing it requires 24/7 monitoring,
                        perfect timing, and constant attention. Axiom removes that requirement entirely.
                        Prediction markets are one of the most intellectually honest financial instruments
                        ever built — prices reflect the crowd's best estimate of reality. Axiom gives
                        anyone access to that alpha without needing to watch screens around the clock.
                      </p>
                    </Card>

                    <Card className="mt-4 border-[#00e5c3]/20 bg-[#00e5c3]/[0.05]">
                      <div className="flex items-start gap-3">
                        <FileText className="mt-0.5 size-4 shrink-0 text-[#00e5c3]" />
                        <div>
                          <p className="text-sm font-semibold text-[#e8edf5]">On-Chain Program</p>
                          <p className="mt-0.5 text-xs text-[#8b9cb3]">
                            JBagp4qXz26XMHce1tXMpEwgVKPBpRGj7ejvsJXaoQhH
                          </p>
                          <p className="mt-1 text-xs text-[#8b9cb3]">
                            23 instructions · 8 PDA account types · Solana Devnet · Anchor 0.31.1
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </Section>

                {/* ── HOW IT WORKS ── */}
                <Section id="how-it-works">
                  <SectionHeading
                    label="How It Works"
                    title="The user flow"
                    subtitle="The user flow is intentionally simple. The complexity lives in the engine, not the interface."
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        n: 1, title: "User Deposits USDC",
                        body: "Any wallet, any amount. Connect your Solana wallet and deposit any amount of USDC into any vault.",
                        color: "#00e5c3",
                      },
                      {
                        n: 2, title: "Vault Issues Shares",
                        body: "You receive vault shares (Token-2022) representing your proportional ownership. Live Price Per Share tracked on-chain.",
                        color: "#6366f1",
                      },
                      {
                        n: 3, title: "Engine Scans Markets",
                        body: "Jupiter Prediction API is hit every 30 minutes. Opportunities are scored by probability, liquidity, and signal strength.",
                        color: "#a855f7",
                      },
                      {
                        n: 4, title: "Position Opened",
                        body: "Limit orders are placed via Jupiter Trigger — not market orders. This delivers 3–5% better entry prices on average.",
                        color: "#0ea5e9",
                      },
                      {
                        n: 5, title: "Idle Capital → Lend",
                        body: "Capital between trades is routed to Jupiter Lend at 6%+ APY automatically. It never sits still.",
                        color: "#f59e0b",
                      },
                      {
                        n: 6, title: "NAV Synced On-Chain",
                        body: "Every 30 minutes the vault's NAV is computed and written on-chain via sync_nav. Fully verifiable.",
                        color: "#ec4899",
                      },
                    ].map((step) => (
                      <Card key={step.n} className="flex gap-4">
                        <StepBadge n={step.n} color={step.color} />
                        <div>
                          <p className="text-sm font-semibold text-[#e8edf5]">{step.title}</p>
                          <p className="mt-1 text-xs leading-relaxed text-[#8b9cb3]">{step.body}</p>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    {[
                      {
                        title: "Deposit USDC",
                        body: "Connect your Solana wallet and deposit any amount of USDC into any vault. You receive vault shares (Token-2022) representing your proportional ownership.",
                      },
                      {
                        title: "Engine Takes Over",
                        body: "The strategy engine runs continuously — scanning markets every 30 minutes, opening positions, routing idle capital to Jupiter Lend, and syncing NAV on-chain.",
                      },
                      {
                        title: "Earn Passively",
                        body: "Your share price increases as the vault earns. Withdraw at any time to receive your proportional share of the vault's current NAV.",
                      },
                    ].map((item) => (
                      <Card key={item.title}>
                        <p className="text-sm font-semibold text-[#e8edf5]">{item.title}</p>
                        <p className="mt-2 text-xs leading-relaxed text-[#8b9cb3]">{item.body}</p>
                      </Card>
                    ))}
                  </div>

                  <Card className="mt-4 border-[#6366f1]/20 bg-[#6366f1]/[0.05]">
                    <div className="flex items-start gap-3">
                      <Lock className="mt-0.5 size-4 shrink-0 text-[#a5b4fc]" />
                      <p className="text-sm leading-relaxed text-[#c5d0df]">
                        <span className="font-semibold text-[#e8edf5]">Full Transparency.</span>{" "}
                        Every engine decision — why it entered, why it skipped, expected vs filled
                        price — is logged publicly on the{" "}
                        <Link href="/transparency" className="text-[#00e5c3] hover:underline">
                          Transparency dashboard
                        </Link>
                        .
                      </p>
                    </div>
                  </Card>
                </Section>

                {/* ── THREE VAULTS ── */}
                <Section id="three-vaults">
                  <SectionHeading
                    label="The Three Vaults"
                    title="Choose your risk profile"
                    subtitle="Each vault has a distinct mandate, risk profile, and capital allocation strategy. Choose based on your risk appetite."
                  />

                  <div className="space-y-4">
                    {/* AX-SAFE */}
                    <Card className="border-[#00e5c3]/25">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-lg border border-[#00e5c3]/30 bg-[#00e5c3]/10 px-2.5 py-0.5 font-[family-name:var(--font-space-mono)] text-xs font-bold text-[#00e5c3]">
                              AX-SAFE
                            </span>
                            <span className="text-sm font-medium text-[#8b9cb3]">Safe Consensus</span>
                          </div>
                          <p className="mt-2 text-sm text-[#c5d0df]">
                            High-conviction, high-probability outcomes with capital-preservation tilt.
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[#8b9cb3]">Target APY</p>
                          <p className="text-lg font-bold text-[#00e5c3]">4–10%</p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="rounded-xl border border-white/5 bg-[#080c14]/60 p-3 text-center">
                          <p className="text-xs text-[#8b9cb3]">Risk</p>
                          <p className="mt-0.5 text-sm font-semibold text-[#22c55e]">Low</p>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-[#080c14]/60 p-3 text-center">
                          <p className="text-xs text-[#8b9cb3]">Min Probability</p>
                          <p className="mt-0.5 text-sm font-semibold text-[#e8edf5]">≥ 0.80</p>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-[#080c14]/60 p-3 text-center">
                          <p className="text-xs text-[#8b9cb3]">Min Score</p>
                          <p className="mt-0.5 text-sm font-semibold text-[#e8edf5]">≥ 0.15</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-[#00e5c3]/20 bg-[#00e5c3]/10 px-2.5 py-0.5 text-[#00e5c3]">Predictions 62%</span>
                        <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-[#8b9cb3]">Jupiter Lend 33%</span>
                        <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-[#8b9cb3]">Idle Buffer 5%</span>
                      </div>
                    </Card>

                    {/* AX-MACRO */}
                    <Card className="border-[#6366f1]/25">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-lg border border-[#6366f1]/30 bg-[#6366f1]/10 px-2.5 py-0.5 font-[family-name:var(--font-space-mono)] text-xs font-bold text-[#a5b4fc]">
                              AX-MACRO
                            </span>
                            <span className="text-sm font-medium text-[#8b9cb3]">Macro Contrarian</span>
                          </div>
                          <p className="mt-2 text-sm text-[#c5d0df]">
                            Seeks dislocations in mid-band probabilities where crowd may be mispriced.
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[#8b9cb3]">Target APY</p>
                          <p className="text-lg font-bold text-[#a5b4fc]">8–22%</p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="rounded-xl border border-white/5 bg-[#080c14]/60 p-3 text-center">
                          <p className="text-xs text-[#8b9cb3]">Risk</p>
                          <p className="mt-0.5 text-sm font-semibold text-[#f59e0b]">Medium</p>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-[#080c14]/60 p-3 text-center">
                          <p className="text-xs text-[#8b9cb3]">Probability Band</p>
                          <p className="mt-0.5 text-sm font-semibold text-[#e8edf5]">0.40–0.65</p>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-[#080c14]/60 p-3 text-center">
                          <p className="text-xs text-[#8b9cb3]">Min Score</p>
                          <p className="mt-0.5 text-sm font-semibold text-[#e8edf5]">≥ 0.20</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-[#6366f1]/20 bg-[#6366f1]/10 px-2.5 py-0.5 text-[#a5b4fc]">Predictions 78%</span>
                        <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-[#8b9cb3]">Jupiter Lend 15%</span>
                        <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-[#8b9cb3]">Idle Buffer 7%</span>
                      </div>
                    </Card>

                    {/* AX-YIELD */}
                    <Card className="border-[#a855f7]/25">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-lg border border-[#a855f7]/30 bg-[#a855f7]/10 px-2.5 py-0.5 font-[family-name:var(--font-space-mono)] text-xs font-bold text-[#d8b4fe]">
                              AX-YIELD
                            </span>
                            <span className="text-sm font-medium text-[#8b9cb3]">Yield Maximizer</span>
                          </div>
                          <p className="mt-2 text-sm text-[#c5d0df]">
                            Prioritizes lending yield while keeping a smaller sleeve of high-confidence predictions.
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[#8b9cb3]">Target APY</p>
                          <p className="text-lg font-bold text-[#d8b4fe]">10–28%</p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="rounded-xl border border-white/5 bg-[#080c14]/60 p-3 text-center">
                          <p className="text-xs text-[#8b9cb3]">Risk</p>
                          <p className="mt-0.5 text-sm font-semibold text-[#ef4444]">High</p>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-[#080c14]/60 p-3 text-center">
                          <p className="text-xs text-[#8b9cb3]">Min Probability</p>
                          <p className="mt-0.5 text-sm font-semibold text-[#e8edf5]">≥ 0.70</p>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-[#080c14]/60 p-3 text-center">
                          <p className="text-xs text-[#8b9cb3]">Min Score</p>
                          <p className="mt-0.5 text-sm font-semibold text-[#e8edf5]">≥ 0.12</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-[#a855f7]/20 bg-[#a855f7]/10 px-2.5 py-0.5 text-[#d8b4fe]">Predictions 28%</span>
                        <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-[#8b9cb3]">Jupiter Lend 67%</span>
                        <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-[#8b9cb3]">Idle Buffer 5%</span>
                      </div>
                    </Card>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Link
                      href="/vaults"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#00e5c3] px-5 py-2.5 text-sm font-bold text-[#080c14] hover:bg-[#33ebd3]"
                    >
                      Compare vaults
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </Section>

                {/* ── STRATEGY ENGINE ── */}
                <Section id="strategy-engine">
                  <SectionHeading
                    label="Strategy Engine"
                    title="The autonomous engine"
                    subtitle="A Node.js / TypeScript service with four cron jobs running in sequence. It operates completely autonomously — no human intervention required or possible."
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      {
                        icon: "⚡",
                        name: "Market Scanner",
                        cadence: "Every 30 min",
                        desc: "Hits Jupiter Prediction API. Scores opportunities by probability, liquidity, and signal strength. Deterministic algorithm — not an LLM.",
                        accent: "#00e5c3",
                      },
                      {
                        icon: "↗",
                        name: "Yield Router",
                        cadence: "Hourly",
                        desc: "Routes idle USDC to Jupiter Lend (6%+ APY). Capital never sits still between trades. Automatic rebalancing when positions resolve.",
                        accent: "#22c55e",
                      },
                      {
                        icon: "◈",
                        name: "NAV Calculator",
                        cadence: "Every 30 min",
                        desc: "Computes real-time vault NAV. Syncs on-chain via sync_nav instruction. Reconciles with Dune SIM for independent verification.",
                        accent: "#6366f1",
                      },
                      {
                        icon: "◉",
                        name: "Position Manager",
                        cadence: "Every 15 min",
                        desc: "Tracks active positions. Manages exits on resolution. Logs slippage and execution quality for the transparency dashboard.",
                        accent: "#a855f7",
                      },
                    ].map((item) => (
                      <Card key={item.name}>
                        <div className="flex items-start gap-3">
                          <div
                            className="flex size-10 shrink-0 items-center justify-center rounded-xl text-lg"
                            style={{ backgroundColor: `${item.accent}18` }}
                          >
                            {item.icon}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-[#e8edf5]">{item.name}</p>
                              <span
                                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                                style={{ backgroundColor: `${item.accent}18`, color: item.accent }}
                              >
                                {item.cadence}
                              </span>
                            </div>
                            <p className="mt-1.5 text-xs leading-relaxed text-[#8b9cb3]">{item.desc}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <Card className="mt-5">
                    <p className="text-sm font-semibold text-[#e8edf5]">Scoring Algorithm</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#8b9cb3]">
                      The market scanner uses a proprietary deterministic scoring algorithm — not an
                      LLM. Hallucinations in a financial product managing user capital are
                      unacceptable. The algo scorer runs in milliseconds, never fails, and produces
                      consistent repeatable results.
                    </p>
                    <CodeBlock>{`// Simplified scoring logic
score = (probability_band_weight * 0.4)
      + (liquidity_depth_score * 0.35)
      + (signal_strength * 0.25)

// Thresholds per vault
Safe Consensus:    score >= 0.15, probability >= 0.80
Macro Contrarian:  score >= 0.20, probability 0.40–0.65
Yield Maximizer:   score >= 0.12, probability >= 0.70`}</CodeBlock>
                  </Card>

                  <Card className="mt-4 border-[#0ea5e9]/25 bg-[#0ea5e9]/[0.04]">
                    <p className="text-sm font-semibold text-[#e8edf5]">Jupiter Trigger Integration</p>
                    <p className="mt-2 text-xs leading-relaxed text-[#8b9cb3]">
                      Instead of market-ordering into prediction positions, the engine sets limit
                      entries via Jupiter Trigger — &ldquo;buy YES on this market only if price drops
                      to $X.&rdquo; This gives the vault 3–5% better entry prices on average and
                      eliminates the volatility penalty of market orders. This is not a documented use
                      case for the Trigger API — we found it by reading the API deeply.
                    </p>
                  </Card>
                </Section>

                {/* ── NAV & PERFORMANCE ── */}
                <Section id="nav-performance">
                  <SectionHeading
                    label="NAV & Performance"
                    title="How NAV works"
                    subtitle="NAV (Net Asset Value) is the total value of everything a vault holds — prediction positions, lending deposits, and idle USDC — divided by shares outstanding. This gives the Price Per Share (PPS), updated on-chain every 30 minutes."
                  />

                  <div className="grid gap-4 sm:grid-cols-3">
                    {[
                      {
                        ticker: "AX-SAFE",
                        name: "Safe Consensus",
                        start: "$0.564",
                        current: "$1.408",
                        color: "#00e5c3",
                      },
                      {
                        ticker: "AX-MACRO",
                        name: "Macro Contrarian",
                        start: "$1.241",
                        current: "$1.241",
                        color: "#a5b4fc",
                      },
                      {
                        ticker: "AX-YIELD",
                        name: "Yield Maximizer",
                        start: "$0.972",
                        current: "$2.734",
                        color: "#d8b4fe",
                      },
                    ].map((vault) => (
                      <Card key={vault.ticker}>
                        <span
                          className="rounded px-1.5 py-0.5 font-[family-name:var(--font-space-mono)] text-[10px] font-bold"
                          style={{ backgroundColor: `${vault.color}18`, color: vault.color }}
                        >
                          {vault.ticker}
                        </span>
                        <p className="mt-2 text-xs text-[#8b9cb3]">{vault.name}</p>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                          <div className="rounded-lg border border-white/5 bg-[#080c14]/60 p-2">
                            <p className="text-[10px] text-[#8b9cb3]">Start PPS</p>
                            <p className="mt-0.5 text-sm font-bold text-[#e8edf5]">{vault.start}</p>
                          </div>
                          <div
                            className="rounded-lg border p-2"
                            style={{ borderColor: `${vault.color}30`, backgroundColor: `${vault.color}08` }}
                          >
                            <p className="text-[10px] text-[#8b9cb3]">Current PPS</p>
                            <p className="mt-0.5 text-sm font-bold" style={{ color: vault.color }}>
                              {vault.current}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <p className="mt-2 text-[11px] text-[#8b9cb3]">
                    * Paper mode positions. NAV growth reflects simulated prediction positions opened
                    by the autonomous engine against live Jupiter Prediction API markets. Not financial
                    advice.
                  </p>

                  <Card className="mt-5">
                    <p className="text-sm font-semibold text-[#e8edf5]">NAV Formula</p>
                    <CodeBlock>{`NAV = Σ(prediction_positions_value)
    + Σ(jupiter_lend_deposits)
    + idle_usdc

PPS = NAV / total_shares_outstanding

// On-chain sync every 30 minutes via sync_nav instruction
// Redeemable NAV = idle_usdc only (positions not yet resolved)
// Computed NAV  = full value including open positions`}</CodeBlock>
                  </Card>

                  <Card className="mt-4 border-amber-500/20 bg-amber-500/[0.04]">
                    <div className="flex items-start gap-3">
                      <HelpCircle className="mt-0.5 size-4 shrink-0 text-amber-400" />
                      <div>
                        <p className="text-sm font-semibold text-[#e8edf5]">
                          Why is NAV sometimes lower than computed total?
                        </p>
                        <p className="mt-1.5 text-xs leading-relaxed text-[#8b9cb3]">
                          The on-chain synced NAV reflects only redeemable idle USDC — capital you
                          can withdraw right now. Open prediction positions are not redeemable until
                          they resolve, so computed NAV (which includes open positions) is always
                          higher. The transparency dashboard explains this clearly.
                        </p>
                      </div>
                    </div>
                  </Card>
                </Section>

                {/* ── INTEGRATIONS ── */}
                <Section id="integrations">
                  <SectionHeading
                    label="Integrations"
                    title="Infrastructure stack"
                    subtitle="Axiom is built on top of battle-tested infrastructure. Every integration is production-grade and actively used by the engine on every cycle."
                  />

                  <Card>
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-lg bg-[#00e5c3]/15 flex items-center justify-center">
                        <Zap className="size-3.5 text-[#00e5c3]" />
                      </div>
                      <p className="text-sm font-semibold text-[#e8edf5]">Jupiter Developer Platform</p>
                    </div>
                    <p className="mt-2 text-xs text-[#8b9cb3]">
                      All Jupiter APIs accessed through a single API key from developers.jup.ag. One
                      key, five APIs, zero auth fragmentation.
                    </p>
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-white/5">
                            <th className="pb-2 text-left font-medium text-[#8b9cb3]">API</th>
                            <th className="pb-2 text-left font-medium text-[#8b9cb3]">Usage</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {[
                            {
                              api: "Prediction API",
                              use: "Market scanning, order execution, position tracking",
                            },
                            {
                              api: "Price API v2",
                              use: "NAV calculation, USDC depeg protection",
                            },
                            {
                              api: "Tokens API",
                              use: "Token metadata enrichment in scanner and UI",
                            },
                            {
                              api: "Trigger API",
                              use: "Smart limit orders for prediction market entries",
                            },
                            {
                              api: "Lend/Earn API",
                              use: "Idle USDC yield routing (6%+ APY)",
                            },
                          ].map((row) => (
                            <tr key={row.api}>
                              <td className="py-2.5 pr-4 font-medium text-[#00e5c3]">{row.api}</td>
                              <td className="py-2.5 text-[#c5d0df]">{row.use}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    {[
                      {
                        name: "Dune SIM",
                        desc: "Live wallet balances and transaction history via SVM endpoint. Powers the portfolio page and deposit modal.",
                        color: "#f59e0b",
                      },
                      {
                        name: "RPC Fast",
                        desc: "Low-latency Solana RPC with WebSocket streaming. Real-time vault account monitoring. Debounced NAV recalculation on every vault state change.",
                        color: "#0ea5e9",
                      },
                      {
                        name: "Solana Name Service",
                        desc: ".sol domain resolution for vault engine wallets and user portfolio pages. On-chain agent identity layer.",
                        color: "#a855f7",
                      },
                    ].map((item) => (
                      <Card key={item.name}>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: item.color }}
                        >
                          {item.name}
                        </p>
                        <p className="mt-2 text-xs leading-relaxed text-[#8b9cb3]">{item.desc}</p>
                      </Card>
                    ))}
                  </div>
                </Section>

                {/* ── SECURITY & TRUST ── */}
                <Section id="security-trust">
                  <SectionHeading
                    label="Security & Trust"
                    title="Built for real funds"
                    subtitle="Axiom is built with production-grade security from day one. Every architectural decision was made with the assumption that real user funds are at stake."
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      {
                        icon: Shield,
                        title: "Transparency Dashboard",
                        body: "Every NAV, trade, and engine decision is publicly queryable. Real-time slippage tracking. All transactions link to Solscan.",
                        accent: "#00e5c3",
                      },
                      {
                        icon: Layers,
                        title: "Token-2022 Share Tokens",
                        body: "Real ETF mechanics. Users receive vault shares with live Price-Per-Share tracking. Performance fee only above high-water mark.",
                        accent: "#6366f1",
                      },
                      {
                        icon: FileText,
                        title: "On-Chain Program",
                        body: "JBagp4qXz26XMHce1tXMpEwgVKPBpRGj7ejvsJXaoQhH — 23 instructions, 8 PDA account types, deployed on Solana Devnet.",
                        accent: "#0ea5e9",
                      },
                      {
                        icon: TrendingUp,
                        title: "High-Water Mark Fees",
                        body: "Performance fees only collected when vault NAV exceeds its previous peak. You only pay when you profit.",
                        accent: "#a855f7",
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <Card key={item.title}>
                          <div
                            className="flex size-10 items-center justify-center rounded-xl"
                            style={{ backgroundColor: `${item.accent}18`, color: item.accent }}
                          >
                            <Icon className="size-5" />
                          </div>
                          <p className="mt-3 text-sm font-semibold text-[#e8edf5]">{item.title}</p>
                          <p className="mt-2 text-xs leading-relaxed text-[#8b9cb3]">{item.body}</p>
                        </Card>
                      );
                    })}
                  </div>

                  <Card className="mt-4 border-amber-500/25 bg-amber-500/[0.05]">
                    <div className="flex items-start gap-3">
                      <Lock className="mt-0.5 size-4 shrink-0 text-amber-400" />
                      <div>
                        <p className="text-sm font-semibold text-[#e8edf5]">
                          Pre-launch security checklist
                        </p>
                        <p className="mt-1.5 text-xs leading-relaxed text-[#8b9cb3]">
                          Before mainnet deployment Axiom will complete a professional smart contract
                          audit covering vault PDA authority, Token-2022 share minting, NAV sync
                          centralization risks, and performance fee math. The $50,000 in Adevar Labs
                          audit credits from Colosseum Frontier will be applied toward this.
                        </p>
                      </div>
                    </div>
                  </Card>
                </Section>

                {/* ── FAQ ── */}
                <Section id="faq">
                  <SectionHeading
                    label="FAQ"
                    title="Common questions"
                    subtitle="Short answers to the most common questions about Axiom Vaults."
                  />

                  <div className="space-y-3">
                    {[
                      {
                        q: "Is my USDC safe on devnet?",
                        a: "Devnet uses test USDC only. No real funds are at risk on devnet. Mainnet launch will follow a professional security audit.",
                      },
                      {
                        q: "How does Axiom make money?",
                        a: "Performance fees above the high-water mark only. If the vault NAV does not exceed its previous peak, Axiom takes no fee. You only pay when you profit.",
                      },
                      {
                        q: "Can I withdraw at any time?",
                        a: "Yes. Vault shares are redeemable at any time for the current idle USDC portion of the vault NAV. Full redemption including position P&L occurs when positions resolve.",
                      },
                      {
                        q: "Why Solana?",
                        a: "Sub-cent transaction fees make a 15-minute rebalancing engine economically viable. The same product on Ethereum would cost thousands of dollars per day in gas. Solana also enables composability with all five Jupiter APIs from day one.",
                      },
                      {
                        q: "What happens when the engine finds no opportunities?",
                        a: "Idle capital routes to Jupiter Lend automatically, earning 6%+ APY. Capital never sits still.",
                      },
                      {
                        q: "Do I need to trade prediction markets manually?",
                        a: "No. The engine handles scanning and execution based on vault strategy rules. You do not place every trade manually — that is the entire point.",
                      },
                      {
                        q: "Why limit orders instead of market orders?",
                        a: "The engine places limit entries via Jupiter Trigger. This delivers 3–5% better entry prices on average and eliminates the volatility penalty of market orders. Positions only open if price reaches the target — otherwise capital stays in yield.",
                      },
                      {
                        q: "Where can I track performance?",
                        a: "Each vault page shows NAV, price-per-share history, recent activity, and strategy context. The Portfolio page summarizes all your vault positions. The Transparency page logs every engine decision with reasoning.",
                      },
                    ].map((item) => (
                      <Card key={item.q}>
                        <p className="text-sm font-semibold text-[#e8edf5]">{item.q}</p>
                        <p className="mt-2 text-xs leading-relaxed text-[#8b9cb3]">{item.a}</p>
                      </Card>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-[#6366f1]/25 bg-[#6366f1]/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#e8edf5]">See every question in one place</p>
                      <p className="mt-0.5 text-xs text-[#8b9cb3]">
                        The dedicated FAQ page has the full list with expandable answers.
                      </p>
                    </div>
                    <Link
                      href="/faq"
                      className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#6366f1] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#7c7ef5]"
                    >
                      Go to FAQ
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>

                  <Card className="mt-4 border-[#00e5c3]/20 bg-[#00e5c3]/[0.05]">
                    <p className="text-sm font-semibold text-[#e8edf5]">Have more questions?</p>
                    <p className="mt-1 text-xs text-[#8b9cb3]">
                      Reach out and we will help you quickly.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a
                        href="mailto:axiomvaults1@gmail.com"
                        className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs text-[#e8edf5] transition-colors hover:bg-white/10"
                      >
                        axiomvaults1@gmail.com
                        <ExternalLink className="size-3 opacity-60" />
                      </a>
                      <a
                        href="https://x.com/axiom_vaults"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs text-[#e8edf5] transition-colors hover:bg-white/10"
                      >
                        @axiom_vaults
                        <ExternalLink className="size-3 opacity-60" />
                      </a>
                    </div>
                  </Card>
                </Section>
              </div>
            </div>
          </div>
        </main>

        <footer className="border-t border-white/5 bg-[#080c14]">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-[#8b9cb3] md:flex-row md:items-center md:justify-between md:px-6">
            <div className="flex items-center gap-2.5">
              <Image
                src="/axiom-logo.png"
                alt="Axiom"
                width={20}
                height={20}
                className="object-contain opacity-60"
              />
              <span className="font-[family-name:var(--font-space-mono)]">
                Axiom Vaults — devnet
              </span>
            </div>
            <nav className="flex flex-wrap gap-x-4 gap-y-2">
              <Link href="/" className="transition-colors hover:text-[#00e5c3]">Home</Link>
              <Link href="/vaults" className="transition-colors hover:text-[#00e5c3]">Vaults</Link>
              <Link href="/docs" className="transition-colors hover:text-[#00e5c3]">Docs</Link>
              <Link href="/faq" className="transition-colors hover:text-[#00e5c3]">FAQ</Link>
              <Link href="/transparency" className="transition-colors hover:text-[#00e5c3]">Transparency</Link>
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}
