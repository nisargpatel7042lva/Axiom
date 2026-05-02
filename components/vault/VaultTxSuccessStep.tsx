"use client";

import { ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

import { VaultTxResultIcon } from "@/components/vault/VaultTxResultIcon";

export function VaultTxSuccessStep({
  title,
  description,
  txSig,
  explorerClusterParam,
  onDone,
  accentColor = "#00e5c3",
}: {
  title: string;
  description: string;
  txSig: string | null;
  explorerClusterParam: string;
  onDone: () => void;
  accentColor?: string;
}) {
  return (
    <div className="mt-6 space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 28,
          mass: 0.9,
        }}
      >
        <div className="flex flex-col items-center">
          <div
            className="rounded-2xl p-3"
            style={{
              backgroundColor: `${accentColor}0d`,
              boxShadow: `inset 0 0 0 1px ${accentColor}33`,
            }}
          >
            <VaultTxResultIcon variant="success" accentColor={accentColor} />
          </div>
          <motion.p
            className="mt-5 text-center text-lg font-semibold text-[#e8edf5]"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.35, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {title}
          </motion.p>
          <motion.p
            className="mt-1.5 text-center text-sm leading-relaxed text-[#8b9cb3]"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.45, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {description}
          </motion.p>
        </div>

        {txSig ? (
          <motion.div
            className="mt-8 w-full border-t border-white/10 pt-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.55, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#8b9cb3]">
              Transaction signature
            </p>
            <p className="mt-2 max-h-24 overflow-y-auto font-[family-name:var(--font-space-mono)] text-[11px] leading-relaxed text-[#e8edf5] break-all">
              {txSig}
            </p>
            <a
              href={`https://solscan.io/tx/${txSig}${explorerClusterParam}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-[#080c14] transition-opacity hover:opacity-95"
              style={{ backgroundColor: accentColor }}
            >
              Open in Solscan
              <ExternalLink className="size-4 shrink-0 opacity-90" aria-hidden />
            </a>
          </motion.div>
        ) : null}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.35 }}
      >
        <button
          type="button"
          onClick={onDone}
          className="w-full rounded-xl border border-[#1a2235] bg-[#080c14]/80 py-3 text-sm font-semibold text-[#e8edf5] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors hover:border-[#1f2a42] hover:bg-[#080c14]"
        >
          Done
        </button>
      </motion.div>
    </div>
  );
}
