"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Mail, MessageCircle } from "lucide-react";

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

export default function FaqPage() {
  return (
    <div className="relative min-h-screen bg-[#080c14]">
      <SiteAuroraBackdrop />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Topbar />
        <main className="flex-1 pt-[6rem]">
          <div className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-14">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#00e5c3]">FAQ</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#e8edf5] md:text-4xl">
                Frequently Asked Questions
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#8b9cb3]">
                Short, clear answers to help you understand what to do on Axiom.
              </p>
            </motion.div>

            <div className="mt-8 space-y-3">
            {FAQS.map((item, idx) => (
              <motion.details
                key={item.question}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="rounded-xl border border-[#1a2235] bg-[#0d1420] p-4"
              >
                <summary className="cursor-pointer list-none text-sm font-semibold text-[#e8edf5]">
                  {item.question}
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-[#8b9cb3]">{item.answer}</p>
              </motion.details>
            ))}
            </div>

            <div className="mt-10 rounded-2xl border border-[#00e5c3]/20 bg-[#00e5c3]/5 p-5">
            <h2 className="text-lg font-semibold text-[#e8edf5]">Need a direct answer?</h2>
            <p className="mt-1 text-sm text-[#8b9cb3]">Reach out and we will help you quickly.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href="mailto:axiomvaults1@gmail.com"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-[#e8edf5] hover:bg-white/10"
              >
                <Mail className="size-4" />
                axiomvaults1@gmail.com
              </a>
              <a
                href="https://x.com/axiom_vaults"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-[#e8edf5] hover:bg-white/10"
              >
                <MessageCircle className="size-4" />
                @axiom_vaults
              </a>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/vaults"
                className="inline-flex items-center gap-2 rounded-xl bg-[#00e5c3] px-4 py-2 text-sm font-bold text-[#080c14] hover:bg-[#33ebd3]"
              >
                Open Vaults
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-[#e8edf5] hover:bg-white/10"
              >
                Read About
              </Link>
            </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
