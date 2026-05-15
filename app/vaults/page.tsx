"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Layers } from "lucide-react";

import { Topbar } from "@/components/layout/Topbar";
import { SiteAuroraBackdrop } from "@/components/layout/SiteAuroraBackdrop";
import { VaultCard } from "@/components/vault/VaultCard";
import { ProtocolStats } from "@/components/vault/ProtocolStats";
import { VAULT_CONFIGS } from "@/constants";
import { useDevnetVaults } from "@/hooks/useDevnetVaults";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.55, ease: "easeOut" as const },
  }),
};

export default function VaultsPage() {
  const { entries, totalTvl, onlineCount, avgPps, loading, error, refetch, isFetching } =
    useDevnetVaults();

  return (
    <div className="relative min-h-screen bg-[#080c14]">
      <SiteAuroraBackdrop />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Topbar />

        <main className="flex-1 pt-[6rem]">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.04] px-3.5 py-2 text-sm text-[#8b9cb3] transition-all hover:border-white/15 hover:bg-white/[0.07] hover:text-[#e8edf5]"
          >
            <ArrowLeft className="size-3.5" />
            Back to home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
          >
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#00e5c3]/25 bg-[#00e5c3]/10 px-3 py-1 text-xs font-semibold text-[#00e5c3]">
                <Layers className="size-3.5" />
                Live devnet data
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#e8edf5] md:text-4xl">
                Vault strategies
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#8b9cb3]">
                Compare risk profiles and on-chain metrics. Deposit or withdraw from each vault&apos;s
                detail page — metrics refresh automatically from your RPC.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-8 space-y-3"
          >
            {error && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                <span>Could not load on-chain vaults. Check RPC and program deployment.</span>
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="rounded-lg bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/15"
                >
                  Retry
                </button>
              </div>
            )}
            <div className="flex items-center justify-end gap-2 text-[10px] text-[#8b9cb3]">
              {isFetching && !loading ? (
                <span className="animate-pulse">Refreshing devnet data…</span>
              ) : (
                <span>Data from Solana devnet</span>
              )}
            </div>
            <ProtocolStats
              totalTvl={totalTvl}
              vaultsOnline={onlineCount}
              totalVaults={VAULT_CONFIGS.length}
              avgPps={avgPps}
              loading={loading}
            />
          </motion.div>

          <div className="mt-12 border-t border-white/5 pt-12">
            <h2 className="text-xl font-bold text-[#e8edf5]">All vaults</h2>
            <p className="mt-1.5 text-sm text-[#8b9cb3]">
              Select a card to open metrics, charts, and deposit / withdraw.
            </p>
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3 md:items-stretch">
              {VAULT_CONFIGS.map((config, i) => {
                const row = entries.find((e) => e.config.id === config.id);
                return (
                  <motion.div
                    key={config.id}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                  >
                    <VaultCard
                      config={config}
                      state={row?.ui ?? null}
                      loading={loading}
                      online={row?.snapshot != null}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/5 bg-[#080c14]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-[#8b9cb3] md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex items-center gap-2.5">
            <Image src="/axiom-logo.png" alt="Axiom" width={20} height={20} className="object-contain opacity-60" />
            <span className="font-[family-name:var(--font-space-mono)]">Axiom Vaults — devnet</span>
          </div>
          <nav className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/" className="hover:text-[#00e5c3] transition-colors">Home</Link>
            <Link href="/about" className="hover:text-[#00e5c3] transition-colors">About</Link>
            <Link href="/faq" className="hover:text-[#00e5c3] transition-colors">FAQ</Link>
            <Link href="/portfolio" className="hover:text-[#00e5c3] transition-colors">Portfolio</Link>
          </nav>
        </div>
      </footer>
      </div>
    </div>
  );
}
