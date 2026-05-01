"use client";

import { motion } from "framer-motion";

import { VaultTxResultIcon } from "@/components/vault/VaultTxResultIcon";

/** Vault-style error panel with animated cross (confirm step after a failed tx). */
export function VaultTxErrorCallout({ message }: { message: string }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-[#1a2235] bg-[#0d1420] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
      role="alert"
    >
      <div
        className="absolute left-0 top-0 h-full w-1 bg-rose-500/85"
        aria-hidden
      />
      <div className="flex gap-4 p-4 pl-5">
        <VaultTxResultIcon variant="error" className="scale-95" />
        <p className="min-w-0 flex-1 pt-0.5 text-sm leading-relaxed text-rose-100/95">
          {message}
        </p>
      </div>
    </motion.div>
  );
}
