"use client";

import { motion } from "framer-motion";

const SPIN_MS = 0.78;
const CIRCLE_START = 0.82;
const CHECK_START = 1.26;

/** Animated check (success) or cross (error) for vault transaction modals. */
export function VaultTxResultIcon({
  variant,
  accentColor = "#00e5c3",
  className = "",
}: {
  variant: "success" | "error";
  accentColor?: string;
  className?: string;
}) {
  if (variant === "success") {
    return (
      <motion.div
        className={`relative flex size-[4.5rem] shrink-0 items-center justify-center ${className}`}
        style={{ color: accentColor }}
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 26 }}
      >
        <svg viewBox="0 0 100 100" className="size-full" aria-hidden>
          {/* Phase 1: spinning arc */}
          <motion.g
            style={{ transformOrigin: "50px 50px" }}
            animate={{
              rotate: [0, 720],
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: SPIN_MS + 0.12,
              times: [0, SPIN_MS / (SPIN_MS + 0.12), 1],
              ease: "linear",
            }}
          >
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="58 182"
              opacity={0.95}
            />
          </motion.g>

          {/* Phase 2: full circle draws */}
          <motion.circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              pathLength: {
                delay: CIRCLE_START,
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1],
              },
              opacity: { delay: CIRCLE_START, duration: 0.12 },
            }}
          />

          {/* Phase 3: check draws inside */}
          <motion.path
            d="M32 52 L46 66 72 36"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              pathLength: {
                delay: CHECK_START,
                duration: 0.38,
                ease: [0.22, 1, 0.36, 1],
              },
              opacity: { delay: CHECK_START, duration: 0.08 },
            }}
          />
        </svg>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`relative flex size-[4.25rem] shrink-0 items-center justify-center rounded-2xl border-2 border-rose-500/45 bg-rose-500/[0.12] text-rose-400 shadow-[0_0_28px_-6px_rgba(244,63,94,0.45)] ${className}`}
      initial={{ scale: 0.72, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        rotate: [0, -4, 4, -3, 0],
      }}
      transition={{
        scale: { type: "spring", stiffness: 340, damping: 22 },
        opacity: { duration: 0.25 },
        rotate: { delay: 0.15, duration: 0.45, ease: "easeOut" },
      }}
    >
      <motion.svg
        viewBox="0 0 24 24"
        fill="none"
        className="size-[1.85rem]"
        aria-hidden
      >
        <motion.path
          d="M8 8l8 8"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: { delay: 0.08, duration: 0.22, ease: [0.22, 1, 0.36, 1] },
            opacity: { delay: 0.08, duration: 0.12 },
          }}
        />
        <motion.path
          d="M16 8l-8 8"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: { delay: 0.22, duration: 0.22, ease: [0.22, 1, 0.36, 1] },
            opacity: { delay: 0.22, duration: 0.12 },
          }}
        />
      </motion.svg>
    </motion.div>
  );
}
