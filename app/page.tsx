"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Zap,
  Lock,
  BarChart3,
  RefreshCw,
  Shield,
  Target,
  Gem,
} from "lucide-react";

import { Topbar } from "@/components/layout/Topbar";
import { MorphingText } from "@/components/ui/morphing-text";
import { VAULT_CONFIGS } from "@/constants";

const ColorBends = dynamic(() => import("@/components/ui/ColorBends"), {
  ssr: false,
});

const SPECTRA_COLORS = ["#00e5c3", "#6366f1", "#a855f7", "#0ea5e9"];

const HERO_PHRASES = [
  "prediction markets",
  "DeFi yield",
  "smart portfolios",
  "automated alpha",
];

const FAQ_ITEMS = [
  {
    q: "What do I need to do first?",
    a: "Open Vaults, connect your wallet, choose one strategy, and deposit USDC. That's enough to get started.",
  },
  {
    q: "Do I need to trade manually every day?",
    a: "No. The strategy engine handles scanning and execution. You can monitor performance and withdraw when you want.",
  },
  {
    q: "Where can I see my position?",
    a: "Use the Vault and Portfolio pages to track NAV, price per share (PPS), and your wallet's vault shares.",
  },
  {
    q: "Can I withdraw anytime?",
    a: "Yes. There is no lock-up period. Withdrawals are based on your share of the vault NAV.",
  },
  {
    q: "How does idle USDC earn?",
    a: "When strategy capital is not deployed, idle USDC can be routed to Jupiter Lend to earn yield.",
  },
  {
    q: "How can I contact Axiom?",
    a: "You can email axiomvaults1@gmail.com or message us on X at @axiom_vaults.",
  },
];

const FEATURES = [
  {
    icon: <Zap className="size-5" />,
    title: "Auto-Managed",
    description:
      "Strategy engine scans markets, sizes positions, and harvests profits — all automated.",
  },
  {
    icon: <Lock className="size-5" />,
    title: "Non-Custodial",
    description:
      "Your USDC stays in on-chain vaults. SPL vault tokens represent your share at all times.",
  },
  {
    icon: <BarChart3 className="size-5" />,
    title: "Yield on Idle",
    description:
      "Undeployed USDC earns lending yield via Jupiter Lend. No capital sits idle.",
  },
  {
    icon: <RefreshCw className="size-5" />,
    title: "Zero Management Fee",
    description:
      "No entry fee, no management fee. Performance fee only above high-water mark.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const VAULT_TEASER_ICONS: Record<string, React.ReactNode> = {
  "safe-consensus": <Shield className="size-5" />,
  "macro-contrarian": <Target className="size-5" />,
  "yield-maximizer": <Gem className="size-5" />,
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#080c14]">
      <Topbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* ColorBends background — fills the hero with an animated shader */}
          <div className="absolute inset-0" style={{ zIndex: 0 }}>
            <div className="w-full h-full" style={{ minHeight: "85vh" }}>
              <ColorBends
                colors={SPECTRA_COLORS}
                rotation={35}
                speed={0.2}
                scale={1}
                frequency={1}
                warpStrength={1}
                mouseInfluence={0.5}
                parallax={0.3}
                noise={0.08}
                transparent={false}
                autoRotate={3}
              />
            </div>
          </div>

          {/* Dark overlay for readability */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              zIndex: 1,
              background:
                "linear-gradient(to bottom, rgba(8,12,20,0.55) 0%, rgba(8,12,20,0.45) 40%, rgba(8,12,20,0.6) 70%, rgba(8,12,20,0.95) 92%, #080c14 100%)",
            }}
          />
          {/* Extra left-side darken for text area */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              zIndex: 1,
              background:
                "linear-gradient(to right, rgba(8,12,20,0.5) 0%, rgba(8,12,20,0.2) 50%, transparent 70%)",
            }}
          />

          {/* Hero content */}
          <div
            className="relative mx-auto max-w-7xl px-4 pb-28 pt-28 md:px-6 md:pt-36"
            style={{ zIndex: 2, minHeight: "85vh", display: "flex", alignItems: "center" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="max-w-3xl w-full"
            >
              {/* Logo above tagline */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mb-6 flex items-center gap-3"
              >
                <div className="relative flex size-12 items-center justify-center">
                  <Image
                    src="/axiom-logo.png"
                    alt="Axiom"
                    width={48}
                    height={48}
                    className="object-contain"
                    priority
                  />
                </div>
                <Image
                  src="/axiom-text.png"
                  alt="Axiom"
                  width={100}
                  height={30}
                  className="object-contain"
                  priority
                />
              </motion.div>

              <div className="inline-flex items-center gap-2 rounded-full border border-[#00e5c3]/20 bg-[#00e5c3]/10 px-4 py-1.5 text-sm text-[#00e5c3] backdrop-blur-md">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00e5c3] opacity-50" />
                  <span className="relative inline-flex size-2 rounded-full bg-[#00e5c3]" />
                </span>
                First prediction market ETFs on Solana
              </div>

              <h1
                className="mt-8 text-4xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl md:leading-[1.1]"
                style={{ textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}
              >
                <span className="text-white">Set-and-forget</span>
                <br />
                <MorphingText
                  texts={HERO_PHRASES}
                  className="mx-0 mt-1 h-[1.15em] max-w-none text-left font-bold text-white"
                />
                <span className="text-white">vaults on Solana</span>
              </h1>

              <p
                className="mt-6 max-w-xl text-lg leading-relaxed text-[#c0c9d8]"
                style={{ textShadow: "0 1px 10px rgba(0,0,0,0.4)" }}
              >
                Deposit USDC in a vault, let Axiom run the strategy, and track
                everything in one place. No complex setup, no constant chart
                watching, and you can withdraw anytime.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/vaults"
                  className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00e5c3] to-[#00e5c3]/90 px-6 py-3.5 text-sm font-bold text-[#080c14] transition-all hover:shadow-[0_0_30px_rgba(0,229,195,0.3)] hover:scale-[1.02]"
                >
                  Explore Vaults
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-medium text-[#e8edf5] backdrop-blur-md transition-all hover:border-[#6366f1]/40 hover:bg-white/10"
                >
                  About Axiom
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Strategies teaser → dedicated /vaults page */}
        <section className="mx-auto max-w-7xl px-4 md:px-6 -mt-10 relative z-10 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="rounded-2xl border border-[#1a2235] bg-[#0d1420]/90 p-6 shadow-xl backdrop-blur-md md:p-8"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#e8edf5] md:text-2xl">
                  Three on-chain strategies
                </h2>
                <p className="mt-2 max-w-xl text-sm text-[#8b9cb3]">
                  Live TVL, PPS, and deposit / withdraw live on the Vaults page — powered by your
                  devnet RPC.
                </p>
              </div>
              <Link
                href="/vaults"
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#00e5c3] px-5 py-2.5 text-sm font-bold text-[#080c14] hover:bg-[#33ebd3]"
              >
                Open Vaults
                <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {VAULT_CONFIGS.map((config, i) => (
                <motion.div
                  key={config.id}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                >
                  <Link
                    href={`/vaults/${config.id}`}
                    className="group block rounded-xl border border-white/10 bg-[#080c14]/80 p-4 transition-all hover:border-[#00e5c3]/35 hover:bg-[#080c14]"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex size-10 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: `${config.accentColor}22`,
                          color: config.accentColor,
                        }}
                      >
                        {VAULT_TEASER_ICONS[config.id]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-[#e8edf5] group-hover:text-white truncate">
                          {config.name}
                        </div>
                        <div className="text-xs text-[#8b9cb3]">{config.ticker}</div>
                      </div>
                      <ArrowRight className="size-4 shrink-0 text-[#8b9cb3] opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </div>
                    <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-[#8b9cb3]">
                      {config.description}
                    </p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* How it works */}
        <section className="border-t border-white/5 bg-[#0d1420]/50">
          <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
            <h2 className="text-2xl font-bold text-[#e8edf5] md:text-3xl">
              How It Works
            </h2>
            <p className="mt-2 max-w-lg text-sm text-[#8b9cb3]">
              Four steps from USDC deposit to diversified prediction market
              exposure with yield on idle capital.
            </p>

            <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-[#1a2235] bg-[#1a2235] md:grid-cols-4">
              {[
                {
                  step: "01",
                  title: "Deposit USDC",
                  desc: "Connect wallet and deposit USDC into any vault. Receive SPL vault share tokens.",
                  color: "#00e5c3",
                },
                {
                  step: "02",
                  title: "Engine Deploys",
                  desc: "Strategy engine scans prediction markets via Jupiter API and sizes positions.",
                  color: "#0ea5e9",
                },
                {
                  step: "03",
                  title: "Yield Accrues",
                  desc: "Idle USDC routes to Jupiter Lend. Resolved predictions auto-reinvest.",
                  color: "#6366f1",
                },
                {
                  step: "04",
                  title: "Withdraw Anytime",
                  desc: "Redeem vault tokens for your proportional NAV share. No lock-up period.",
                  color: "#a855f7",
                },
              ].map(({ step, title, desc, color }, i) => (
                <motion.div
                  key={step}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  className="bg-[#0d1420] p-6"
                >
                  <div
                    className="font-[family-name:var(--font-space-mono)] text-xs font-bold"
                    style={{ color }}
                  >
                    {step}
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-[#e8edf5]">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#8b9cb3]">
                    {desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
          <h2 className="text-2xl font-bold text-[#e8edf5] md:text-3xl">
            Built Different
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon, title, description }, i) => (
              <motion.div
                key={title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="group rounded-xl border border-[#1a2235] bg-[#0d1420] p-5 transition-all duration-300 hover:border-[#6366f1]/30"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#00e5c3]/15 to-[#6366f1]/15 text-[#00e5c3] transition-colors group-hover:text-[#6366f1]">
                  {icon}
                </div>
                <h3 className="mt-4 text-sm font-semibold text-[#e8edf5]">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#8b9cb3]">
                  {description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQ + contact */}
        <section className="border-t border-white/5 bg-[#0d1420]/40">
          <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-16">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#e8edf5] md:text-3xl">FAQ</h2>
              <p className="mt-2 max-w-2xl text-sm text-[#8b9cb3]">
                Quick answers to common questions before you deposit.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {FAQ_ITEMS.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-xl border border-[#1a2235] bg-[#0d1420] p-4"
                >
                  <summary className="cursor-pointer list-none text-sm font-semibold text-[#e8edf5]">
                    {item.q}
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-[#8b9cb3]">{item.a}</p>
                </details>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#e8edf5] md:text-3xl">Still have questions?</h2>
                <p className="mt-2 max-w-2xl text-sm text-[#8b9cb3]">
                  Read the FAQ for quick answers, or contact us directly by email or on X.
                </p>
              </div>
              <Link
                href="/faq"
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#00e5c3] px-5 py-2.5 text-sm font-bold text-[#080c14] hover:bg-[#33ebd3]"
              >
                Open FAQ
                <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <a
                href="mailto:axiomvaults1@gmail.com"
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-[#e8edf5] hover:bg-white/10"
              >
                Email: axiomvaults1@gmail.com
              </a>
              <a
                href="https://x.com/axiom_vaults"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-[#e8edf5] hover:bg-white/10"
              >
                X: @axiom_vaults
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#080c14]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <span className="font-[family-name:var(--font-space-mono)] text-xs text-[#8b9cb3]">
              Axiom Vaults — Colosseum Hackathon 2026
            </span>
            <p className="mt-1 text-xs text-[#8b9cb3]/80">
              Powered by Jupiter · RPC · Dune SIM · Solana
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#8b9cb3]">
            <Link href="/vaults" className="hover:text-[#00e5c3]">
              Vaults
            </Link>
            <Link href="/about" className="hover:text-[#00e5c3]">
              About
            </Link>
            <Link href="/faq" className="hover:text-[#00e5c3]">
              FAQ
            </Link>
            <Link href="/portfolio" className="hover:text-[#00e5c3]">
              Portfolio
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
