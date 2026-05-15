"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  BookOpen,
  HelpCircle,
  Layers,
  Lock,
  Sparkles,
  Wallet,
} from "lucide-react";

import { Topbar } from "@/components/layout/Topbar";
import { SiteAuroraBackdrop } from "@/components/layout/SiteAuroraBackdrop";

/* ─────────────────────────────────────────────────────────
 * ABOUT PAGE STORYBOARD
 *   0ms   blank
 *  70ms   label + h1 + sub-copy                              stage 1
 * 200ms   "Start here" aside card slides in from right       stage 2
 * 380ms   bento highlight cards stagger (0.1s each)          stage 3
 * 600ms   steps strip + risk note + CTA row                  stage 4
 * ───────────────────────────────────────────────────────── */
const TIMING = { hero: 70, aside: 200, cards: 380, bottom: 600 };
const SPRING = {
  stiff:  { type: "spring" as const, stiffness: 350, damping: 28 },
  smooth: { type: "spring" as const, stiffness: 300, damping: 30 },
  bouncy: { type: "spring" as const, stiffness: 280, damping: 26 },
};

const HIGHLIGHTS = [
  {
    accent: "#00e5c3",
    icon: Sparkles,
    title: "What you’re actually doing",
    body:
      "You put USDC into a vault that follows a strategy—more cautious, balanced, or aggressive. In return you get vault tokens in your wallet. They’re your receipt. Later, you trade those tokens back for USDC based on how the vault has done. No need to click around a trading app all day.",
  },
  {
    accent: "#6366f1",
    icon: Lock,
    title: "You approve every move",
    body:
      "Axiom doesn’t take custody of your wallet. When you add or remove USDC, you sign with your own Solana wallet. On-chain programs (automatic rules written into code) track balances so everyone sees the same numbers.",
  },
  {
    accent: "#a855f7",
    icon: Layers,
    title: "What runs in the background",
    body:
      "Each vault has automation that watches opportunity sets—things like prediction-style markets—and adjusts positions to fit that vault’s risk profile. You still get clear screens: total value, price per share, and recent activity, without placing trades by hand.",
  },
  {
    accent: "#0ea5e9",
    icon: BookOpen,
    title: "If you’re new, do this",
    body:
      "Skim the vault list, pick one that matches how much bumpiness you’re okay with, connect a wallet, and deposit a small amount to learn. Use the vault page for detail and the portfolio page to see everything in one place. Withdraw when it suits you.",
  },
];

const STEPS = [
  { n: 1, text: "Open Vaults and read the short blurbs—each one says who it’s for." },
  { n: 2, text: "Connect your wallet and deposit USDC into the vault you chose." },
  { n: 3, text: "Check back on the vault page and on Portfolio to see value and activity." },
  { n: 4, text: "Withdraw USDC whenever you want, subject to how the vault is priced that day." },
];

export default function AboutPage() {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t: ReturnType<typeof setTimeout>[] = [];
    t.push(setTimeout(() => setStage(1), TIMING.hero));
    t.push(setTimeout(() => setStage(2), TIMING.aside));
    t.push(setTimeout(() => setStage(3), TIMING.cards));
    t.push(setTimeout(() => setStage(4), TIMING.bottom));
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#080c14]">
      <SiteAuroraBackdrop />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Topbar />

        <main className="flex-1 pt-[5.75rem] min-[391px]:pt-[6rem]">
          <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 md:px-6 md:pb-20 md:pt-10">
            {/* Hero */}
            <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-12">
              <motion.div
                initial={false}
                animate={{ opacity: stage >= 1 ? 1 : 0, y: stage >= 1 ? 0 : -12 }}
                transition={SPRING.stiff}
              >
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[#00e5c3]/25 bg-[#00e5c3]/10 px-3 py-1">
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#00e5c3]">About</span>
                </div>
                <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#e8edf5] md:text-4xl lg:text-[2.5rem] lg:leading-tight">
                  Vaults without the homework
                </h1>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-[#8b9cb3] md:text-lg">
                  Axiom is for people who want exposure to strategy vaults on{" "}
                  <span className="text-[#e8edf5]/90">Solana</span> without living in charts. You
                  pick a vault, deposit stablecoin, and follow a few simple numbers—we’ll explain
                  the jargon below only when it helps.
                </p>
              </motion.div>

              <motion.aside
                initial={false}
                animate={{ opacity: stage >= 2 ? 1 : 0, x: stage >= 2 ? 0 : 16 }}
                transition={SPRING.smooth}
                className="rounded-2xl border border-[#1a2235] bg-[#0d1420]/90 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur-sm md:p-6"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-[#8b9cb3]">
                  Start here
                </p>
                <ul className="mt-4 space-y-3 text-sm text-[#e8edf5]">
                  <li className="flex gap-3">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-[#00e5c3]/15 text-xs font-bold text-[#00e5c3]">
                      1
                    </span>
                    <span className="text-[#c5d0df]">
                      Read <Link href="/faq" className="font-medium text-[#00e5c3] hover:underline">FAQ</Link>{" "}
                      if you like questions and answers.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-[#6366f1]/15 text-xs font-bold text-[#a5b4fc]">
                      2
                    </span>
                    <span className="text-[#c5d0df]">
                      Compare strategies on the{" "}
                      <Link href="/vaults" className="font-medium text-[#00e5c3] hover:underline">
                        Vaults
                      </Link>{" "}
                      page.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-[#a855f7]/15 text-xs font-bold text-[#d8b4fe]">
                      3
                    </span>
                    <span className="text-[#c5d0df]">
                      After you deposit, use{" "}
                      <Link href="/portfolio" className="font-medium text-[#00e5c3] hover:underline">
                        Portfolio
                      </Link>{" "}
                      for a single summary.
                    </span>
                  </li>
                </ul>
              </motion.aside>
            </div>

            {/* Bento cards */}
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:mt-14">
              {HIGHLIGHTS.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.article
                    key={item.title}
                    initial={false}
                    animate={{
                      opacity: stage >= 3 ? 1 : 0,
                      y:       stage >= 3 ? 0 : 20,
                    }}
                    transition={{ ...SPRING.bouncy, delay: i * 0.10 }}
                    whileHover={{ y: -4, scale: 1.01 }}
                    className="group relative overflow-hidden rounded-2xl border border-[#1a2235] bg-[#0d1420]/95 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm cursor-default md:p-7"
                    style={{ willChange: "transform" }}
                  >
                    {/* hover glow */}
                    <div
                      className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ background: `radial-gradient(circle at 0% 50%, ${item.accent}10 0%, transparent 60%)` }}
                    />
                    <div
                      className="absolute left-0 top-0 h-full w-1 rounded-l-2xl opacity-90"
                      style={{ backgroundColor: item.accent }}
                      aria-hidden
                    />
                    <div className="pl-4">
                      <div
                        className="flex size-11 items-center justify-center rounded-xl transition-transform group-hover:scale-[1.02]"
                        style={{ backgroundColor: `${item.accent}18`, color: item.accent }}
                      >
                        <Icon className="size-5" strokeWidth={2} />
                      </div>
                      <h2 className="mt-4 text-lg font-semibold text-[#e8edf5]">{item.title}</h2>
                      <p className="mt-3 text-sm leading-relaxed text-[#8b9cb3]">{item.body}</p>
                    </div>
                  </motion.article>
                );
              })}
            </div>

            {/* Steps strip */}
            <motion.div
              initial={false}
              animate={{ opacity: stage >= 4 ? 1 : 0, y: stage >= 4 ? 0 : 12 }}
              transition={SPRING.stiff}
              className="mt-10 rounded-2xl border border-[#1a2235] bg-gradient-to-b from-[#0d1420] to-[#0a1018] p-6 md:mt-12 md:p-8"
            >
              <h2 className="text-base font-semibold text-[#e8edf5] md:text-lg">
                The usual flow, in order
              </h2>
              <p className="mt-1 text-sm text-[#8b9cb3]">
                No tricks—just the path most people take on their first week.
              </p>
              <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
                {STEPS.map((step) => (
                  <li
                    key={step.n}
                    className="flex gap-3 rounded-xl border border-white/5 bg-[#080c14]/60 p-4"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 font-[family-name:var(--font-space-mono)] text-sm font-bold text-[#00e5c3]">
                      {step.n}
                    </span>
                    <p className="text-sm leading-snug text-[#c5d0df]">{step.text}</p>
                  </li>
                ))}
              </ol>
            </motion.div>

            {/* Grades - plain language */}
            <motion.div
              initial={false}
              animate={{ opacity: stage >= 4 ? 1 : 0, y: stage >= 4 ? 0 : 12 }}
              transition={{ ...SPRING.stiff, delay: 0.06 }}
              className="mt-10 md:mt-12"
            >
              <div className="rounded-2xl border border-[#f472b6]/25 bg-[#f472b6]/[0.06] p-6 md:flex md:items-start md:gap-8 md:p-8">
                <div
                  className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#f472b6]/15 text-[#f472b6]"
                >
                  <HelpCircle className="size-6" />
                </div>
                <div className="mt-4 md:mt-0">
                  <h2 className="text-lg font-semibold text-[#e8edf5]">
                    About those letter grades (A, B, C)
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-[#c5d0df]">
                    Each vault has a short write-up: a letter plus a few topics like{" "}
                    <span className="text-[#e8edf5]">how easily you could get money out</span>, how
                    much we rely on prices and data being right, what happens if a partner app has a
                    bad day, and how the automation is run. We write it so you can compare vaults
                    honestly—not because a government agency signed off on it, and{" "}
                    <span className="text-[#e8edf5]">not as a guarantee of profit</span>. Think of it
                    as a nutrition label for risk.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={false}
              animate={{ opacity: stage >= 4 ? 1 : 0, y: stage >= 4 ? 0 : 12 }}
              transition={{ ...SPRING.stiff, delay: 0.12 }}
              className="mt-10 flex flex-col gap-5 rounded-2xl border border-[#00e5c3]/30 bg-[#00e5c3]/[0.07] p-6 sm:flex-row sm:items-center sm:justify-between md:mt-12 md:p-8"
            >
              <div className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#00e5c3]/20 text-[#00e5c3]">
                  <Wallet className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-[#e8edf5]">Still unsure?</p>
                  <p className="mt-1 text-sm text-[#8b9cb3]">
                    Mail us at{" "}
                    <a
                      href="mailto:axiomvaults1@gmail.com"
                      className="text-[#00e5c3] hover:underline"
                    >
                      axiomvaults1@gmail.com
                    </a>{" "}
                    or say hi on{" "}
                    <a
                      href="https://x.com/axiom_vaults"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00e5c3] hover:underline"
                    >
                      @axiom_vaults
                    </a>
                    .
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <Link
                  href="/faq"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-[#080c14]/50 px-5 py-2.5 text-sm font-medium text-[#e8edf5] backdrop-blur-sm hover:bg-[#080c14]/80"
                >
                  FAQ
                  <ArrowRight className="size-3.5 opacity-80" />
                </Link>
                <Link
                  href="/vaults"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#00e5c3] px-5 py-2.5 text-sm font-bold text-[#080c14] hover:bg-[#33ebd3]"
                >
                  View vaults
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </main>

        <footer className="border-t border-white/5 bg-[#080c14]">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-[#8b9cb3] md:flex-row md:items-center md:justify-between md:px-6">
            <div className="flex items-center gap-2.5">
              <Image src="/axiom-logo.png" alt="Axiom" width={20} height={20} className="object-contain opacity-60" />
              <span className="font-[family-name:var(--font-space-mono)]">Axiom Vaults — devnet</span>
            </div>
            <nav className="flex flex-wrap gap-x-4 gap-y-2">
              <Link href="/" className="hover:text-[#00e5c3] transition-colors">Home</Link>
              <Link href="/vaults" className="hover:text-[#00e5c3] transition-colors">Vaults</Link>
              <Link href="/faq" className="hover:text-[#00e5c3] transition-colors">FAQ</Link>
              <Link href="/portfolio" className="hover:text-[#00e5c3] transition-colors">Portfolio</Link>
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}
