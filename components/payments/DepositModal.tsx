"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Check, Copy, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useKira } from "@/components/integrations/useKira";
import { formatUsd } from "@/components/format";

import type { ChainId } from "@/types/index";
import Decimal from "decimal.js";

const CHAINS: { id: ChainId; label: string }[] = [
  { id: "ethereum", label: "Ethereum" },
  { id: "solana", label: "Solana" },
  { id: "polygon", label: "Polygon" },
  { id: "arbitrum", label: "Arbitrum" },
  { id: "bsc", label: "BSC" },
];

const TOKENS = ["USDC", "USDT", "ETH", "SOL"] as const;

type Step = 1 | 2 | 3;

const LIVE_PHASES = [
  { text: "Waiting", tone: "text-[#8b9cb3]" },
  { text: "Detected", tone: "text-amber-300" },
  { text: "Processing", tone: "text-sky-300" },
  { text: "Completed", tone: "text-[#00e5c3]" },
] as const;

export function DepositModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { quote, depositStatus, getDepositQuote, isLoadingQuote } = useKira();
  const [step, setStep] = useState<Step>(1);
  const [chain, setChain] = useState<ChainId>("ethereum");
  const [token, setToken] = useState<string>("USDC");
  const [amountStr, setAmountStr] = useState("1000");
  const [copied, setCopied] = useState(false);
  const [livePhase, setLivePhase] = useState(0);

  const depositAddress =
    "FlowrDep1osit1111111111111111111111111111111";

  useEffect(() => {
    if (!open) {
      setStep(1);
      setCopied(false);
      setLivePhase(0);
    }
  }, [open]);

  useEffect(() => {
    if (step !== 3 || !open) return;
    setLivePhase(0);
    const id = window.setInterval(() => {
      setLivePhase((p) => Math.min(LIVE_PHASES.length - 1, p + 1));
    }, 2800);
    return () => window.clearInterval(id);
  }, [step, open]);

  const amount = (() => {
    try {
      return new Decimal(amountStr || "0");
    } catch {
      return new Decimal(0);
    }
  })();

  async function onGetQuote() {
    if (amount.lte(0)) return;
    await getDepositQuote({ chain, token, amount });
    setStep(2);
  }

  function proceedToAddress() {
    setStep(3);
  }

  async function copyAddress() {
    await navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  const badge = LIVE_PHASES[livePhase];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(100vw-2rem,500px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-white/10 bg-[#0d1420] p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-[#e8edf5]">
                Deposit via KIRAPAY
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-[#8b9cb3]">
                Bridge assets into Solana USDC.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-lg p-1 text-[#8b9cb3] hover:bg-white/5"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="mt-4 flex gap-2">
            {([1, 2, 3] as const).map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full ${step >= s ? "bg-[#00e5c3]" : "bg-[#1a2332]"}`}
              />
            ))}
          </div>

          {step === 1 && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-xs uppercase text-[#8b9cb3]">Chain</label>
                <select
                  value={chain}
                  onChange={(e) => setChain(e.target.value as ChainId)}
                  className="mt-2 w-full rounded-lg border border-white/10 bg-[#080c14] px-3 py-2.5 text-sm text-[#e8edf5]"
                >
                  {CHAINS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase text-[#8b9cb3]">Token</label>
                <select
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-white/10 bg-[#080c14] px-3 py-2.5 text-sm text-[#e8edf5]"
                >
                  {TOKENS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase text-[#8b9cb3]">Amount</label>
                <input
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-white/10 bg-[#080c14] px-3 py-2.5 font-[family-name:var(--font-space-mono)] text-[#e8edf5]"
                />
              </div>
              <button
                type="button"
                onClick={onGetQuote}
                disabled={amount.lte(0) || isLoadingQuote}
                className="w-full rounded-xl bg-[#00e5c3] py-3 text-sm font-bold text-[#080c14] disabled:opacity-40"
              >
                {isLoadingQuote ? "Getting quote…" : "Get quote"}
              </button>
            </div>
          )}

          {step === 2 && quote && (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-white/5 bg-[#080c14] p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#8b9cb3]">You send</span>
                  <span className="font-[family-name:var(--font-space-mono)] text-[#e8edf5]">
                    {quote.amountIn.toFixed(4)} {quote.sourceAsset}
                  </span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="text-[#8b9cb3]">You receive</span>
                  <span className="font-[family-name:var(--font-space-mono)] text-[#00e5c3]">
                    {quote.amountOutUsdc.toFixed(2)} USDC
                  </span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="text-[#8b9cb3]">Fee</span>
                  <span className="font-[family-name:var(--font-space-mono)]">
                    {formatUsd(quote.feeUsd)}
                  </span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="text-[#8b9cb3]">ETA</span>
                  <span className="font-[family-name:var(--font-space-mono)]">
                    {Math.ceil(quote.etaSeconds / 60)} min
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={proceedToAddress}
                className="w-full rounded-xl bg-[#00e5c3] py-3 text-sm font-bold text-[#080c14]"
              >
                Continue
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="mt-6 space-y-4">
              <div
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.tone} bg-white/5`}
              >
                Status: {badge.text}
                {depositStatus?.status === "failed" && (
                  <span className="ml-2 text-[#ef4444]">(provider error)</span>
                )}
              </div>
              <p className="text-xs text-[#8b9cb3]">
                Send funds from {chain} to the address below. Status updates
                automatically.
              </p>
              <div className="flex items-stretch gap-2">
                <div className="font-[family-name:var(--font-space-mono)] flex-1 break-all rounded-lg border border-white/10 bg-[#080c14] px-3 py-3 text-xs leading-relaxed text-[#e8edf5]">
                  {depositAddress}
                </div>
                <button
                  type="button"
                  onClick={copyAddress}
                  className="rounded-lg border border-white/10 px-3 text-[#00e5c3] hover:bg-white/5"
                  title="Copy"
                >
                  {copied ? <Check className="size-5" /> : <Copy className="size-5" />}
                </button>
              </div>
              <p className="font-[family-name:var(--font-space-mono)] text-[10px] text-[#8b9cb3]">
                Quote ID: {quote?.quoteId ?? "—"}
              </p>
            </div>
          )}

          <div className="mt-6 border-t border-white/5 pt-4">
            <p className="text-[10px] uppercase tracking-wider text-[#8b9cb3]">
              KIRAPAY
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
