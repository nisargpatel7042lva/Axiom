"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useMemo, useState } from "react";

import { useDodo } from "@/components/integrations/useDodo";
import { formatUsd } from "@/components/format";

import type { TreasuryState } from "@/types/index";
import Decimal from "decimal.js";

const CURRENCIES = ["INR", "USD", "EUR", "GBP"] as const;

export function WithdrawYieldModal({
  open,
  onOpenChange,
  treasury,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  treasury: TreasuryState | null;
}) {
  const { requestPayout, isProcessing } = useDodo();
  const maxUsd = treasury?.pendingPayoutUsdc ?? new Decimal(0);
  const [amountStr, setAmountStr] = useState("50");
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>("INR");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const amountUsd = useMemo(() => {
    try {
      return new Decimal(amountStr || "0");
    } catch {
      return new Decimal(0);
    }
  }, [amountStr]);

  const amountCents = amountUsd.mul(100).toDecimalPlaces(0).toNumber();
  const minUsd = new Decimal(10);
  const valid =
    amountUsd.gte(minUsd) &&
    amountUsd.lte(maxUsd) &&
    name.trim().length > 0 &&
    email.includes("@");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    await requestPayout({
      amountCents,
      recipientName: name.trim(),
      recipientEmail: email.trim(),
      currency,
    });
    onOpenChange(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(100vw-2rem,480px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-white/10 bg-[#0d1420] p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-[#e8edf5]">
                Withdraw yield
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-[#8b9cb3]">
                Off-ramp accrued USDC to your bank via Dodo Payments.
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

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-[#8b9cb3]">
                Amount (min {formatUsd(minUsd)})
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-[#080c14] px-3 py-2.5 font-[family-name:var(--font-space-mono)] text-[#e8edf5] outline-none focus:border-[#00e5c3]/40"
              />
              <p className="mt-1 font-[family-name:var(--font-space-mono)] text-xs text-[#8b9cb3]">
                Available: {formatUsd(maxUsd)}
              </p>
              {amountUsd.gt(0) && amountUsd.lt(minUsd) && (
                <p className="mt-1 text-xs text-[#ef4444]">
                  Minimum withdrawal is {formatUsd(minUsd)}.
                </p>
              )}
              {amountUsd.gt(maxUsd) && (
                <p className="mt-1 text-xs text-[#ef4444]">
                  Exceeds available yield.
                </p>
              )}
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-[#8b9cb3]">
                Destination currency
              </label>
              <select
                value={currency}
                onChange={(e) =>
                  setCurrency(e.target.value as (typeof CURRENCIES)[number])
                }
                className="mt-2 w-full rounded-lg border border-white/10 bg-[#080c14] px-3 py-2.5 text-sm text-[#e8edf5] outline-none focus:border-[#00e5c3]/40"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-[#8b9cb3]">
                Recipient name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-[#080c14] px-3 py-2.5 text-[#e8edf5] outline-none focus:border-[#00e5c3]/40"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-[#8b9cb3]">
                Recipient email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-[#080c14] px-3 py-2.5 text-[#e8edf5] outline-none focus:border-[#00e5c3]/40"
              />
            </div>

            <div className="rounded-xl border border-white/5 bg-[#080c14] p-4 text-sm text-[#8b9cb3]">
              <p>
                USDC on Solana → bank transfer in{" "}
                <span className="font-semibold text-[#e8edf5]">{currency}</span>
                , 2–3 business days.
              </p>
            </div>

            <div className="flex items-center gap-2 border-t border-white/5 pt-4">
              <span className="rounded bg-white/5 px-2 py-1 font-[family-name:var(--font-space-mono)] text-[10px] font-bold uppercase tracking-wider text-[#8b9cb3]">
                Dodo
              </span>
              <p className="text-xs text-[#8b9cb3]">
                Payouts powered by Dodo Payments.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-[#e8edf5]"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={!valid || isProcessing}
                className="rounded-xl bg-[#00e5c3] px-5 py-2.5 text-sm font-bold text-[#080c14] disabled:opacity-40"
              >
                {isProcessing ? "Submitting…" : "Request payout"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
