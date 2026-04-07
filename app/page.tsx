"use client";

import { motion } from "framer-motion";
import { ArrowRight, Zap, Lock, BarChart3, RefreshCw } from "lucide-react";

import { Topbar } from "@/components/layout/Topbar";
import { VaultCard } from "@/components/vault/VaultCard";
import { ProtocolStats } from "@/components/vault/ProtocolStats";
import { VAULT_CONFIGS, MOCK_VAULT_STATES } from "@/constants";

const FEATURES = [
  {
    icon: <Zap className="size-5" />,
    title: "Auto-Managed",
    description: "Strategy engine scans markets, sizes positions, and harvests profits — all automated.",
  },
  {
    icon: <Lock className="size-5" />,
    title: "Non-Custodial",
    description: "Your USDC stays in on-chain vaults. SPL vault tokens represent your share at all times.",
  },
  {
    icon: <BarChart3 className="size-5" />,
    title: "Yield on Idle",
    description: "Undeployed USDC earns lending yield via Jupiter Lend. No capital sits idle.",
  },
  {
    icon: <RefreshCw className="size-5" />,
    title: "Zero Management Fee",
    description: "No entry fee, no management fee. Performance fee only above high-water mark.",
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

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#080c14]">
      <Topbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,229,195,0.08)_0%,_transparent_60%)]" />
          <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-20 md:px-6 md:pt-28">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="max-w-3xl"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-[#00e5c3]/20 bg-[#00e5c3]/10 px-4 py-1.5 text-sm text-[#00e5c3]">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00e5c3] opacity-50" />
                  <span className="relative inline-flex size-2 rounded-full bg-[#00e5c3]" />
                </span>
                First prediction market ETFs on Solana
              </div>

              <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-[#e8edf5] md:text-6xl md:leading-[1.1]">
                Set-and-forget
                <br />
                <span className="bg-gradient-to-r from-[#00e5c3] to-[#00e5c3]/60 bg-clip-text text-transparent">
                  prediction market
                </span>
                <br />
                vaults
              </h1>

              <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#8b9cb3]">
                Deposit USDC into themed vaults. Our strategy engine diversifies
                across prediction markets while idle capital earns yield on
                Jupiter Lend. One click in, one click out.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="#vaults"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#00e5c3] px-6 py-3 text-sm font-bold text-[#080c14] transition-colors hover:bg-[#33ebd3]"
                >
                  Explore Vaults
                  <ArrowRight className="size-4" />
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#1a2235] bg-[#0d1420] px-6 py-3 text-sm font-medium text-[#e8edf5] transition-colors hover:border-[#00e5c3]/30 hover:bg-[#152030]"
                >
                  Read Docs
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats */}
        <section className="mx-auto max-w-7xl px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <ProtocolStats />
          </motion.div>
        </section>

        {/* Vault Catalog */}
        <section id="vaults" className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-[#e8edf5] md:text-3xl">
              Vault Catalog
            </h2>
            <p className="mt-2 text-sm text-[#8b9cb3]">
              Choose a strategy that matches your risk appetite. Each vault is a
              diversified portfolio managed by our autonomous engine.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {VAULT_CONFIGS.map((config, i) => (
              <motion.div
                key={config.id}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
              >
                <VaultCard
                  config={config}
                  state={MOCK_VAULT_STATES[config.id]}
                />
              </motion.div>
            ))}
          </div>
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
                },
                {
                  step: "02",
                  title: "Engine Deploys",
                  desc: "Strategy engine scans prediction markets via Jupiter API and sizes positions.",
                },
                {
                  step: "03",
                  title: "Yield Accrues",
                  desc: "Idle USDC routes to Jupiter Lend. Resolved predictions auto-reinvest.",
                },
                {
                  step: "04",
                  title: "Withdraw Anytime",
                  desc: "Redeem vault tokens for your proportional NAV share. No lock-up period.",
                },
              ].map(({ step, title, desc }, i) => (
                <motion.div
                  key={step}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  className="bg-[#0d1420] p-6"
                >
                  <div className="font-[family-name:var(--font-space-mono)] text-xs font-bold text-[#00e5c3]">
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
                className="rounded-xl border border-[#1a2235] bg-[#0d1420] p-5"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-[#00e5c3]/10 text-[#00e5c3]">
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
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#080c14]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 md:px-6">
          <span className="font-[family-name:var(--font-space-mono)] text-xs text-[#8b9cb3]">
            Spectra Vaults — Colosseum Hackathon 2025
          </span>
          <span className="text-xs text-[#8b9cb3]">
            Powered by Jupiter · Solana
          </span>
        </div>
      </footer>
    </div>
  );
}
