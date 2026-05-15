"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ArrowRight, Mail, MessageCircle, ChevronDown } from "lucide-react";

import { Topbar } from "@/components/layout/Topbar";
import { SiteAuroraBackdrop } from "@/components/layout/SiteAuroraBackdrop";

const FAQS = [
  {
    question: "What is Axiom Vaults in simple terms?",
    answer:
      "Axiom is a vault app on Solana where you deposit USDC into a strategy vault. The engine manages opportunities, and your position is represented by vault share tokens.",
  },
  {
    question: "What should I do after opening the website?",
    answer:
      "Go to Vaults, pick a strategy, connect your wallet, deposit USDC, then track your position from Vaults and Portfolio.",
  },
  {
    question: "Do I need to trade prediction markets manually?",
    answer:
      "No. The engine handles scanning and execution based on vault strategy rules. You do not need to place every trade manually.",
  },
  {
    question: "Can I withdraw whenever I want?",
    answer:
      "Yes. You can withdraw based on your share balance and current vault NAV. There is no fixed lock period in normal operation.",
  },
  {
    question: "Where can I track performance?",
    answer:
      "Each vault page shows NAV, price-per-share chart, recent activity, and strategy context. Portfolio summarizes your wallet's vault positions.",
  },
  {
    question: "How do I contact the team?",
    answer:
      "Email axiomvaults1@gmail.com or message us on X at @axiom_vaults.",
  },
];

/* ─────────────────────────────────────────────────────────
 * FAQ PAGE STORYBOARD
 *   0ms   blank
 *  70ms   label + h1 + subtitle                               stage 1
 * 200ms   FAQ items stagger (0.07s each)                      stage 2
 * 700ms   contact card slides up                              stage 3
 * ───────────────────────────────────────────────────────── */
const TIMING = { header: 70, items: 200, contact: 700 };
const SPRING = {
  stiff:  { type: "spring" as const, stiffness: 350, damping: 28 },
  smooth: { type: "spring" as const, stiffness: 300, damping: 30 },
  chevron: { type: "spring" as const, stiffness: 400, damping: 25 },
};

function FaqItem({ item, index, open, onToggle, visible }: {
  item: typeof FAQS[0];
  index: number;
  open: boolean;
  onToggle: () => void;
  visible: boolean;
}) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 12 }}
      transition={{ ...SPRING.smooth, delay: index * 0.07 }}
      className={`group rounded-2xl border bg-[#0d1420] transition-colors transition-shadow duration-300 ${
        open ? "border-[#00e5c3]/30 shadow-[0_0_0_1px_rgba(0,229,195,0.08),0_8px_32px_rgba(0,0,0,0.3)]" : "border-[#1a2235] hover:border-[#243050]"
      }`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer"
        aria-expanded={open}
      >
        <span className={`text-sm font-semibold transition-colors duration-200 ${open ? "text-[#00e5c3]" : "text-[#e8edf5] group-hover:text-white"}`}>
          {item.question}
        </span>
        {/* Spring chevron: slight overshoot = physical, satisfying */}
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={SPRING.chevron}
          className="shrink-0"
        >
          <ChevronDown className={`size-4 transition-colors duration-200 ${open ? "text-[#00e5c3]" : "text-[#8b9cb3]"}`} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              <div className="h-px w-full bg-white/5 mb-4" />
              <p className="text-sm leading-relaxed text-[#8b9cb3]">{item.answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t: ReturnType<typeof setTimeout>[] = [];
    t.push(setTimeout(() => setStage(1), TIMING.header));
    t.push(setTimeout(() => setStage(2), TIMING.items));
    t.push(setTimeout(() => setStage(3), TIMING.contact));
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#080c14]">
      <SiteAuroraBackdrop />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Topbar />
        <main className="flex-1 pt-[6rem]">
          <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
            <motion.div
              initial={false}
              animate={{ opacity: stage >= 1 ? 1 : 0, y: stage >= 1 ? 0 : -12 }}
              transition={SPRING.stiff}
            >
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#00e5c3]/25 bg-[#00e5c3]/10 px-3 py-1">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#00e5c3]">FAQ</span>
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#e8edf5] md:text-4xl">
                Frequently Asked Questions
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#8b9cb3]">
                Short, clear answers to help you understand what to do on Axiom.
              </p>
            </motion.div>

            <div className="mt-8 space-y-3">
              {FAQS.map((item, idx) => (
                <FaqItem
                  key={item.question}
                  item={item}
                  index={idx}
                  open={openIndex === idx}
                  onToggle={() => setOpenIndex(openIndex === idx ? null : idx)}
                  visible={stage >= 2}
                />
              ))}
            </div>

            <motion.div
              initial={false}
              animate={{ opacity: stage >= 3 ? 1 : 0, y: stage >= 3 ? 0 : 12 }}
              transition={SPRING.smooth}
              className="mt-10 overflow-hidden rounded-2xl border border-[#00e5c3]/20 bg-[#0d1420]"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
            >
              <div className="p-6 md:p-7">
                <div className="pointer-events-none absolute inset-0 rounded-2xl" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,229,195,0.05) 0%, transparent 60%)" }} />
                <h2 className="text-lg font-semibold text-[#e8edf5]">Need a direct answer?</h2>
                <p className="mt-1 text-sm text-[#8b9cb3]">Reach out and we will help you quickly.</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href="mailto:axiomvaults1@gmail.com"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-[#e8edf5] transition-colors duration-150 hover:border-[#00e5c3]/30 hover:bg-white/10 hover:scale-[1.02]"
                  >
                    <Mail className="size-4 text-[#00e5c3]" />
                    axiomvaults1@gmail.com
                  </a>
                  <a
                    href="https://x.com/axiom_vaults"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-[#e8edf5] transition-colors duration-150 hover:border-[#00e5c3]/30 hover:bg-white/10 hover:scale-[1.02]"
                  >
                    <MessageCircle className="size-4 text-[#00e5c3]" />
                    @axiom_vaults
                  </a>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Link href="/vaults" className="inline-flex items-center gap-2 rounded-xl bg-[#00e5c3] px-4 py-2 text-sm font-bold text-[#080c14] hover:bg-[#33ebd3]">
                      Open Vaults
                      <ArrowRight className="size-4" />
                    </Link>
                  </motion.div>
                  <Link href="/about" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-[#e8edf5] transition-all hover:bg-white/10">
                    Read About
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </main>

        <footer className="border-t border-white/5 bg-[#080c14]">
          <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-6 text-xs text-[#8b9cb3] md:flex-row md:items-center md:justify-between md:px-6">
            <div className="flex items-center gap-2.5">
              <Image src="/axiom-logo.png" alt="Axiom" width={20} height={20} className="object-contain opacity-60" />
              <span className="font-[family-name:var(--font-space-mono)]">Axiom Vaults — devnet</span>
            </div>
            <nav className="flex flex-wrap gap-x-4 gap-y-2">
              <Link href="/" className="hover:text-[#00e5c3] transition-colors">Home</Link>
              <Link href="/vaults" className="hover:text-[#00e5c3] transition-colors">Vaults</Link>
              <Link href="/about" className="hover:text-[#00e5c3] transition-colors">About</Link>
              <Link href="/portfolio" className="hover:text-[#00e5c3] transition-colors">Portfolio</Link>
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}
