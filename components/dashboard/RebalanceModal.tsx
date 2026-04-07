"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useMemo } from "react";

import { formatPercent } from "@/components/format";

import type { LPPosition, RebalancePlan, RebalanceState } from "@/types/index";

const SOLSCAN = "https://solscan.io/tx";

function stepStatus(
  state: RebalanceState,
  stepIndex: number,
): "pending" | "active" | "done" | "error" {
  if (state.status === "failed") {
    return stepIndex < state.currentStepIndex ? "done" : "error";
  }
  if (state.status === "success") return "done";
  if (state.status === "executing" || state.status === "simulating") {
    if (stepIndex < state.currentStepIndex) return "done";
    if (stepIndex === state.currentStepIndex) return "active";
  }
  return "pending";
}

export function RebalanceModal({
  open,
  onOpenChange,
  plan,
  state,
  position,
  onConfirm,
  onCancel,
  priorityFeeMicrolamports,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  plan: RebalancePlan | null;
  state: RebalanceState;
  position: LPPosition | null;
  onConfirm: () => void;
  onCancel: () => void;
  priorityFeeMicrolamports: number;
}) {
  const busy =
    state.status === "simulating" || state.status === "executing";

  const currentRange = position?.range;
  const suggested = plan?.expectedFrsAfter;

  const stepLabels = ["Exit liquidity", "Swap", "Re-enter range"] as const;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(100vw-2rem,520px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-white/10 bg-[#0d1420] p-6 shadow-2xl outline-none">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-[#e8edf5]">
                Rebalance plan
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-[#8b9cb3]">
                Review range migration, costs, and execution steps.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-lg p-1 text-[#8b9cb3] hover:bg-white/5 hover:text-[#e8edf5]"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="mt-6 rounded-xl border border-white/5 bg-[#080c14] p-4">
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-[#8b9cb3]">Current range</span>
                <span className="font-[family-name:var(--font-space-mono)] text-right text-[#e8edf5]">
                  {currentRange
                    ? `${currentRange.lower.toFixed(4)} → ${currentRange.upper.toFixed(4)}`
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#8b9cb3]">Suggested range</span>
                <span className="font-[family-name:var(--font-space-mono)] text-right text-[#00e5c3]">
                  {currentRange
                    ? `${currentRange.lower.mul(0.98).toFixed(4)} → ${currentRange.upper.mul(1.02).toFixed(4)}`
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#8b9cb3]">Cost estimate</span>
                <span className="font-[family-name:var(--font-space-mono)] text-[#e8edf5]">
                  ~0.02 SOL + fees
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#8b9cb3]">Projected FRS</span>
                <span className="font-[family-name:var(--font-space-mono)] text-[#00e5c3]">
                  {suggested
                    ? `${suggested.total.toFixed(0)} (${formatPercent(suggested.rangeProximity)} range)`
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 font-[family-name:var(--font-space-mono)] text-xs text-[#8b9cb3]">
            Priority fee:{" "}
            <span className="text-[#e8edf5]">
              {priorityFeeMicrolamports.toLocaleString()} microlamports
            </span>
          </div>

          <div className="mt-6 grid gap-3">
            {stepLabels.map((label, i) => (
              <StepCard
                key={label}
                title={label}
                status={stepStatus(state, i)}
                active={state.status !== "idle" && state.status !== "success"}
              />
            ))}
          </div>

          {state.status === "failed" && state.error && (
            <p className="mt-4 text-sm text-[#ef4444]">{state.error}</p>
          )}

          {state.status === "success" && state.txSignatures.length > 0 && (
            <div className="mt-4 rounded-xl border border-[#00e5c3]/30 bg-[#00e5c3]/5 p-4">
              <p className="text-sm font-medium text-[#00e5c3]">Success</p>
              <ul className="mt-2 space-y-2">
                {state.txSignatures.map((sig) => (
                  <li key={sig}>
                    <a
                      href={`${SOLSCAN}/${sig}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-[family-name:var(--font-space-mono)] break-all text-xs text-sky-300 underline hover:text-sky-200"
                    >
                      View on Solscan →
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-[#e8edf5] hover:bg-white/5 disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (state.status === "success") {
                  onOpenChange(false);
                  return;
                }
                onConfirm();
              }}
              disabled={(busy || !plan) && state.status !== "success"}
              className="rounded-xl bg-[#00e5c3] px-5 py-2.5 text-sm font-bold text-[#080c14] hover:bg-[#33ebd3] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {state.status === "success"
                ? "Close"
                : busy
                  ? "Working…"
                  : "Confirm rebalance"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function StepCard({
  title,
  status,
  active,
}: {
  title: string;
  status: "pending" | "active" | "done" | "error";
  active: boolean;
}) {
  const dot =
    status === "done"
      ? "bg-[#00e5c3]"
      : status === "active"
        ? "bg-amber-400 animate-pulse"
        : status === "error"
          ? "bg-[#ef4444]"
          : "bg-[#8b9cb3]/40";

  const label =
    status === "done"
      ? "Complete"
      : status === "active"
        ? active
          ? "In progress"
          : "Queued"
        : status === "error"
          ? "Failed"
          : "Waiting";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#080c14] px-4 py-3">
      <span className={`size-2.5 shrink-0 rounded-full ${dot}`} />
      <div className="flex-1">
        <div className="text-sm font-medium text-[#e8edf5]">{title}</div>
        <div className="font-[family-name:var(--font-space-mono)] text-[11px] text-[#8b9cb3]">
          {label}
        </div>
      </div>
    </div>
  );
}

export function useRebalancePriorityFee(state: RebalanceState): number {
  return useMemo(() => {
    const base = 5000;
    const jitter = (state.planId.length * 37 + state.currentStepIndex * 91) % 8000;
    return base + jitter;
  }, [state.planId, state.currentStepIndex]);
}
