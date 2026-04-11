"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Layers } from "lucide-react";

import { Topbar } from "@/components/layout/Topbar";
import { VaultCard } from "@/components/vault/VaultCard";
import { ProtocolStats } from "@/components/vault/ProtocolStats";
import { VAULT_CONFIGS } from "@/constants";
import { useDevnetVaults } from "@/hooks/useDevnetVaults";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: "easeOut" as const },
  }),
};

export default function VaultsPage() {
  const { entries, totalTvl, onlineCount, avgPps, loading, error, refetch, isFetching } =
    useDevnetVaults();

  return (
    <div className="flex min-h-screen flex-col bg-[#080c14]">
      <Topbar />

      <main className="flex-1 pt-[6rem]">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-[#8b9cb3] hover:text-[#e8edf5] transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
          >
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#00e5c3]/25 bg-[#00e5c3]/10 px-3 py-1 text-xs font-medium text-[#00e5c3]">
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
            <h2 className="text-lg font-semibold text-[#e8edf5]">All vaults</h2>
            <p className="mt-1 text-sm text-[#8b9cb3]">
              Select a card to open metrics, charts, and deposit / withdraw.
            </p>
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
          <span className="font-[family-name:var(--font-space-mono)]">
            Spectra Vaults — devnet
          </span>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/" className="hover:text-[#00e5c3]">
              Home
            </Link>
            <Link href="/about" className="hover:text-[#00e5c3]">
              About
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
