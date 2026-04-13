"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  Shield,
  Cpu,
  Wallet,
  LineChart,
  ArrowRight,
  Scale,
} from "lucide-react";

import { Topbar } from "@/components/layout/Topbar";

const sections = [
  {
    icon: <Sparkles className="size-5 text-[#00e5c3]" />,
    title: "What is Spectra?",
    body: "Spectra is a set of on-chain USDC vaults on Solana. Each vault follows a different strategy profile — from conservative high-consensus prediction markets to balanced lend-plus-alpha allocations. You deposit USDC, receive vault share tokens, and redeem based on on-chain NAV.",
  },
  {
    icon: <Shield className="size-5 text-[#6366f1]" />,
    title: "Non-custodial by design",
    body: "Funds live in program-controlled PDAs and your wallet always holds the keys. Deposits and withdrawals are signed by you; the program enforces share minting and burning according to vault math.",
  },
  {
    icon: <Cpu className="size-5 text-[#a855f7]" />,
    title: "Strategy engine",
    body: "An off-chain engine scans Jupiter Prediction and related surfaces, sizes positions, and can sync NAV back on-chain. The UI shows live devnet vault state plus optional wallet activity from Dune SIM when configured.",
  },
  {
    icon: <LineChart className="size-5 text-[#0ea5e9]" />,
    title: "How to explore",
    body: "Start on the Vaults page for live TVL and PPS, open any strategy for charts and deposit/withdraw modals, and use Portfolio to see share balances and redeemable value for your connected wallet.",
  },
  {
    icon: <Scale className="size-5 text-[#f472b6]" />,
    title: "Yield transparency & Spectra grades",
    body: "Each vault ships with a Spectra risk sheet: letter grade plus four stress dimensions (liquidity, model/oracle, counterparty stack, operational/engine). Grades are a disclosure rubric inspired by rating-agency clarity — not a regulated credit opinion. NAV vs target capacity and named venue chips show where economics live instead of hiding behind anonymous UI tiles.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#080c14]">
      <Topbar />

      <main className="flex-1 pt-[6rem]">
        <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-[#00e5c3]">
              About
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#e8edf5] md:text-4xl">
              Spectra Vaults
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[#8b9cb3]">
              Prediction-market-aware vaults with yield-aware idle capital — built for Solana devnet
              demos and hackathon judging, with a path to mainnet deployment.
            </p>
          </motion.div>

          <div className="mt-12 space-y-10">
            {sections.map((s, i) => (
              <motion.section
                key={s.title}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * (i + 1) }}
                className="rounded-2xl border border-[#1a2235] bg-[#0d1420] p-6"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-white/5">
                    {s.icon}
                  </div>
                  <h2 className="text-lg font-semibold text-[#e8edf5]">{s.title}</h2>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-[#8b9cb3]">{s.body}</p>
              </motion.section>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-12 flex flex-col gap-3 rounded-2xl border border-[#00e5c3]/20 bg-[#00e5c3]/5 p-6 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <Wallet className="mt-0.5 size-5 text-[#00e5c3]" />
              <div>
                <p className="text-sm font-semibold text-[#e8edf5]">Ready to try devnet?</p>
                <p className="text-xs text-[#8b9cb3]">
                  Connect a wallet, pick a vault, and deposit test USDC.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/vaults"
                className="inline-flex items-center gap-2 rounded-xl bg-[#00e5c3] px-5 py-2.5 text-sm font-bold text-[#080c14] hover:bg-[#33ebd3]"
              >
                View vaults
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/portfolio"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-[#e8edf5] hover:bg-white/10"
              >
                Portfolio
                <ArrowRight className="size-3.5 opacity-70" />
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="border-t border-white/5 bg-[#080c14]">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-6 text-xs text-[#8b9cb3] md:flex-row md:items-center md:justify-between md:px-6">
          <Link href="/" className="hover:text-[#00e5c3]">
            ← Home
          </Link>
          <div className="flex gap-4">
            <Link href="/vaults" className="hover:text-[#00e5c3]">
              Vaults
            </Link>
            <Link href="/portfolio" className="hover:text-[#00e5c3]">
              Portfolio
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
