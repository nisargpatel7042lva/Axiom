"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import { useRef, useState, useEffect } from "react";
import {
  ArrowRight,
  Zap,
  Lock,
  BarChart3,
  RefreshCw,
  Shield,
  Target,
  Gem,
  Mail,
  User,
  ChevronDown,
} from "lucide-react";

import { Topbar } from "@/components/layout/Topbar";
import { MorphingText } from "@/components/ui/morphing-text";
import BorderGlow from "@/components/ui/BorderGlow";
import { SITE_PRIMARY_GRADIENT_COLORS, VAULT_BORDER_GLOW, VAULT_CONFIGS } from "@/constants";

const ColorBends = dynamic(() => import("@/components/ui/ColorBends"), {
  ssr: false,
});

const HERO_PHRASES = [
  "prediction markets",
  "DeFi yield",
  "smart portfolios",
  "automated alpha",
];

const FEATURES = [
  {
    icon: <Zap className="size-5" />,
    title: "Auto-Managed",
    description:
      "Strategy engine scans markets, sizes positions, and harvests profits — all automated.",
    color: "#00e5c3",
  },
  {
    icon: <Lock className="size-5" />,
    title: "Non-Custodial",
    description:
      "Your USDC stays in on-chain vaults. SPL vault tokens represent your share at all times.",
    color: "#6366f1",
  },
  {
    icon: <BarChart3 className="size-5" />,
    title: "Yield on Idle",
    description:
      "Undeployed USDC earns lending yield via Jupiter Lend. No capital sits idle.",
    color: "#0ea5e9",
  },
  {
    icon: <RefreshCw className="size-5" />,
    title: "Zero Management Fee",
    description:
      "No entry fee, no management fee. Performance fee only above high-water mark.",
    color: "#a855f7",
  },
  {
    icon: <User className="size-5" />,
    title: "Solana Identity",
    description:
      "Anchor vault access to .sol identity and agent reputation. Build trust through on-chain reputation.",
    color: "#f59e0b",
  },
];

const STEPS = [
  { step: "01", title: "Deposit USDC", desc: "Connect wallet and deposit USDC into any vault. Receive SPL vault share tokens.", color: "#00e5c3" },
  { step: "02", title: "Engine Deploys", desc: "Strategy engine scans prediction markets via Jupiter API and sizes positions.", color: "#0ea5e9" },
  { step: "03", title: "Yield Accrues", desc: "Idle USDC routes to Jupiter Lend. Resolved predictions auto-reinvest.", color: "#6366f1" },
  { step: "04", title: "Withdraw Anytime", desc: "Redeem vault tokens for your proportional NAV share. No lock-up period.", color: "#a855f7" },
];

const STATS = [
  { label: "Target APY Range", value: "8–35%", suffix: "" },
  { label: "On-chain Vaults", value: "3", suffix: "" },
  { label: "Solana Network", value: "Devnet", suffix: "" },
  { label: "Management Fee", value: "0%", suffix: "" },
];

const VAULT_TEASER_ICONS: Record<string, React.ReactNode> = {
  "safe-consensus": <Shield className="size-5" />,
  "macro-contrarian": <Target className="size-5" />,
  "yield-maximizer": <Gem className="size-5" />,
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut" as const },
  },
};

const fadeUpFast = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

function FloatingOrb({ color, size, top, left, delay = 0 }: { color: string; size: number; top: string; left: string; delay?: number }) {
  return (
    <motion.div
      className="pointer-events-none absolute rounded-full blur-3xl"
      style={{
        width: size,
        height: size,
        top,
        left,
        background: color,
        opacity: 0,
      }}
      animate={{
        opacity: [0.08, 0.18, 0.08],
        scale: [1, 1.15, 1],
        x: [0, 20, 0],
        y: [0, -15, 0],
      }}
      transition={{
        duration: 8 + delay,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    />
  );
}

function ScrollCue() {
  return (
    <motion.div
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 cursor-pointer"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5, duration: 0.6 }}
      style={{ zIndex: 2 }}
    >
      <span className="text-[11px] font-medium tracking-widest uppercase text-white/30">scroll</span>
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown className="size-4 text-white/25" />
      </motion.div>
    </motion.div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="flex flex-col items-center gap-1">
      <motion.span
        className="font-[family-name:var(--font-space-mono)] text-2xl font-bold text-[#e8edf5] md:text-3xl"
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {value}
      </motion.span>
      <span className="text-xs text-[#8b9cb3] text-center">{label}</span>
    </div>
  );
}

export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <div className="flex min-h-screen flex-col bg-[#080c14]">
      <Topbar />

      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────── */}
        <section ref={heroRef} className="relative overflow-hidden isolate" style={{ minHeight: "92vh" }}>
          {/* WebGL backdrop */}
          <div className="absolute inset-0" style={{ zIndex: 0 }}>
            <div className="w-full h-full" style={{ minHeight: "92vh" }}>
              <ColorBends
                colors={[...SITE_PRIMARY_GRADIENT_COLORS]}
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

          {/* Gradient overlays */}
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1, background: "linear-gradient(to bottom, rgba(8,12,20,0.55) 0%, rgba(8,12,20,0.45) 40%, rgba(8,12,20,0.6) 70%, rgba(8,12,20,0.95) 92%, #080c14 100%)" }} />
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1, background: "linear-gradient(to right, rgba(8,12,20,0.5) 0%, rgba(8,12,20,0.2) 50%, transparent 70%)" }} />

          {/* Floating orbs for depth */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
            <FloatingOrb color="rgba(0,229,195,0.6)" size={400} top="10%" left="60%" delay={0} />
            <FloatingOrb color="rgba(99,102,241,0.5)" size={300} top="40%" left="75%" delay={2} />
            <FloatingOrb color="rgba(168,85,247,0.4)" size={250} top="60%" left="5%" delay={4} />
          </div>

          {/* Hero content */}
          <motion.div
            className="relative mx-auto max-w-7xl px-4 pb-24 pt-28 md:px-6 md:pt-40"
            style={{ zIndex: 2, minHeight: "92vh", display: "flex", alignItems: "center", y: heroY, opacity: heroOpacity }}
          >
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="max-w-3xl w-full"
            >
              {/* Logo */}
              <motion.div variants={fadeUp} className="mb-6 flex items-center gap-3">
                <motion.div
                  className="relative flex size-12 items-center justify-center"
                  whileHover={{ scale: 1.08, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Image src="/axiom-logo.png" alt="Axiom" width={48} height={48} className="object-contain" priority />
                </motion.div>
                <Image src="/axiom-text.png" alt="Axiom" width={100} height={30} className="object-contain" priority />
              </motion.div>

              {/* Live badge */}
              <motion.div variants={fadeUp}>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#00e5c3]/20 bg-[#00e5c3]/10 px-4 py-1.5 text-sm text-[#00e5c3] backdrop-blur-md">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00e5c3] opacity-50" />
                    <span className="relative inline-flex size-2 rounded-full bg-[#00e5c3]" />
                  </span>
                  First prediction market ETFs on Solana
                </div>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeUp}
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
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-6 max-w-xl text-lg leading-relaxed text-[#c0c9d8]"
                style={{ textShadow: "0 1px 10px rgba(0,0,0,0.4)" }}
              >
                Deposit USDC in a vault, let Axiom run the strategy, and track everything in one
                place. No complex setup, no constant chart watching, and you can withdraw anytime.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/vaults" className="group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00e5c3] to-[#00c9ab] px-6 py-3.5 text-sm font-bold text-[#080c14] transition-all hover:shadow-[0_0_40px_rgba(0,229,195,0.35)] hover:scale-[1.03] active:scale-[0.98]">
                  <motion.span
                    className="absolute inset-0 rounded-xl"
                    animate={{ boxShadow: ["0 0 0px rgba(0,229,195,0)", "0 0 24px rgba(0,229,195,0.3)", "0 0 0px rgba(0,229,195,0)"] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                  Explore Vaults
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/about" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-medium text-[#e8edf5] backdrop-blur-md transition-all hover:border-[#6366f1]/40 hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98]">
                  About Axiom
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>

          <ScrollCue />
        </section>

        {/* ── Stats strip ──────────────────────────────── */}
        <section className="border-y border-white/[0.06] bg-[#0a0f1a]/80 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-0 md:divide-x md:divide-white/[0.07]">
              {STATS.map((s) => (
                <div key={s.label} className="flex justify-center md:px-8">
                  <StatCard label={s.label} value={s.value} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Vault teaser ─────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 md:px-6 mt-16 relative z-10 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-[#1a2235] bg-[#0d1420]/90 p-6 shadow-xl backdrop-blur-md md:p-8"
            style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 24px 64px rgba(0,0,0,0.4)" }}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[#00e5c3]/25 bg-[#00e5c3]/10 px-3 py-1">
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#00e5c3]">Live Strategies</span>
                </div>
                <h2 className="mt-3 text-xl font-bold text-[#e8edf5] md:text-2xl">
                  Three on-chain strategies
                </h2>
                <p className="mt-2 max-w-xl text-sm text-[#8b9cb3]">
                  Live TVL, PPS, and deposit / withdraw live on the Vaults page — powered by your devnet RPC.
                </p>
              </div>
              <Link href="/vaults" className="group inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#00e5c3] px-5 py-2.5 text-sm font-bold text-[#080c14] transition-all hover:bg-[#33ebd3] hover:scale-[1.02] active:scale-[0.98]">
                Open Vaults
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3 sm:items-stretch">
              {VAULT_CONFIGS.map((config, i) => {
                const glow = VAULT_BORDER_GLOW[config.id];
                return (
                  <motion.div
                    key={config.id}
                    custom={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUpFast}
                    className="h-full"
                    whileHover={{ y: -4, scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  >
                    <Link href={`/vaults/${config.id}`} className="group block h-full">
                      <BorderGlow
                        className="h-full"
                        borderRadius={12}
                        backgroundColor="#080c14"
                        glowColor={glow.glowHsl}
                        colors={[...glow.colors]}
                        glowRadius={22}
                        glowIntensity={1}
                        coneSpread={22}
                        edgeSensitivity={26}
                        animated
                      >
                        <div className="p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex size-10 items-center justify-center rounded-lg transition-transform group-hover:scale-110"
                              style={{ backgroundColor: `${config.accentColor}22`, color: config.accentColor }}
                            >
                              {VAULT_TEASER_ICONS[config.id]}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-semibold text-[#e8edf5] group-hover:text-white transition-colors">
                                {config.name}
                              </div>
                              <div className="text-xs text-[#8b9cb3]">{config.ticker}</div>
                            </div>
                            <ArrowRight className="size-4 shrink-0 text-[#8b9cb3] opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" style={{ color: config.accentColor }} />
                          </div>
                          <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-[#8b9cb3]">
                            {config.description}
                          </p>
                        </div>
                      </BorderGlow>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </section>

        {/* ── How It Works ─────────────────────────────── */}
        <section className="border-t border-white/5 bg-[#0d1420]/50 mt-8">
          <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#6366f1]/25 bg-[#6366f1]/10 px-3 py-1">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#6366f1]">Process</span>
              </div>
              <h2 className="mt-3 text-2xl font-bold text-[#e8edf5] md:text-3xl">How It Works</h2>
              <p className="mt-2 max-w-lg text-sm text-[#8b9cb3]">
                Four steps from USDC deposit to diversified prediction market exposure with yield on idle capital.
              </p>
            </motion.div>

            <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-[#1a2235] bg-[#1a2235] md:grid-cols-4">
              {STEPS.map(({ step, title, desc, color }, i) => (
                <motion.div
                  key={step}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-40px" }}
                  variants={fadeUpFast}
                  className="group relative bg-[#0d1420] p-6 transition-colors hover:bg-[#0f1724]"
                >
                  {/* Accent top border on hover */}
                  <motion.div
                    className="absolute inset-x-0 top-0 h-[2px] rounded-t-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
                  />
                  <div className="font-[family-name:var(--font-space-mono)] text-xs font-bold" style={{ color }}>
                    {step}
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-[#e8edf5]">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#8b9cb3]">{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#a855f7]/25 bg-[#a855f7]/10 px-3 py-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#a855f7]">Advantages</span>
            </div>
            <h2 className="mt-3 text-2xl font-bold text-[#e8edf5] md:text-3xl">Built Different</h2>
          </motion.div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {FEATURES.map(({ icon, title, description, color }, i) => (
              <motion.div
                key={title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUpFast}
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className={`group relative rounded-2xl border border-[#1a2235] bg-gradient-to-b from-[#0d1420] to-[#0a1018] p-5 overflow-hidden cursor-default shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${
                  i === 4
                    ? "sm:col-span-2 md:col-span-1 lg:col-span-3"
                    : i >= 3
                      ? "lg:col-span-3"
                      : "lg:col-span-2"
                }`}
              >
                {/* Glow on hover */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${color}12 0%, transparent 70%)` }}
                />
                <div
                  className="absolute inset-x-0 top-0 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }}
                />
                <div
                  className="flex size-11 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                  style={{
                    backgroundColor: `${color}18`,
                    color,
                    boxShadow: `0 0 0 0 ${color}00`,
                  }}
                >
                  {icon}
                </div>
                <h3 className="mt-4 text-sm font-semibold text-[#e8edf5]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#8b9cb3]">{description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── CTA / Contact ────────────────────────────── */}
        <section className="border-t border-white/5 bg-[#0d1420]/40">
          <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto max-w-2xl"
            >
              <div className="relative overflow-hidden rounded-2xl border border-[#1a2235] bg-[#0d1420] p-6 text-center md:p-10"
                style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
                {/* BG glow */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,229,195,0.06) 0%, transparent 60%)" }} />
                <h2 className="relative text-xl font-bold text-[#e8edf5] md:text-2xl">Still have questions?</h2>
                <p className="relative mt-2 text-sm leading-relaxed text-[#8b9cb3]">
                  All common topics are on our FAQ page. Prefer email or X? Reach us below.
                </p>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="relative mt-6 inline-block">
                  <Link href="/faq" className="inline-flex items-center gap-2 rounded-xl bg-[#00e5c3] px-6 py-3 text-sm font-bold text-[#080c14] transition-colors hover:bg-[#33ebd3]">
                    Go to FAQ
                    <ArrowRight className="size-4" />
                  </Link>
                </motion.div>
                <div className="relative mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
                  <a href="mailto:axiomvaults1@gmail.com" className="group inline-flex items-center gap-2 rounded-xl border border-white/15 bg-[#080c14] px-4 py-2.5 text-sm text-[#e8edf5] transition-all hover:border-[#00e5c3]/40 hover:bg-white/[0.04] hover:scale-[1.02]">
                    <Mail className="size-4 shrink-0 text-[#00e5c3]" aria-hidden />
                    axiomvaults1@gmail.com
                  </a>
                  <a href="https://x.com/axiom_vaults" target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-2 rounded-xl border border-white/15 bg-[#080c14] px-4 py-2.5 text-sm text-[#e8edf5] transition-all hover:border-[#00e5c3]/40 hover:bg-white/[0.04] hover:scale-[1.02]">
                    <span className="flex size-4 items-center justify-center rounded bg-[#00e5c3]/20 text-[10px] font-bold text-[#00e5c3]">X</span>
                    @axiom_vaults
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-[#080c14]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex items-center gap-3">
            <Image src="/axiom-logo.png" alt="Axiom" width={28} height={28} className="object-contain opacity-70" />
            <div>
              <span className="font-[family-name:var(--font-space-mono)] text-xs text-[#8b9cb3]">
                Axiom Vaults — Colosseum Hackathon 2026
              </span>
              <p className="mt-0.5 text-xs text-[#8b9cb3]/60">Powered by Jupiter · RPC · Dune SIM · Solana</p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#8b9cb3]">
            {[{ href: "/vaults", label: "Vaults" }, { href: "/about", label: "About" }, { href: "/faq", label: "FAQ" }, { href: "/portfolio", label: "Portfolio" }].map(({ href, label }) => (
              <Link key={href} href={href} className="transition-colors hover:text-[#00e5c3]">{label}</Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
