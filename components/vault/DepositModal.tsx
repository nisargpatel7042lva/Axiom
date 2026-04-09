"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X, Wallet, ArrowRight, Check, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

import { formatUsd } from "@/components/format";
import { useWalletBalances } from "@/hooks/useWalletBalances";
import type { VaultConfig } from "@/types";

type Step = "input" | "confirm" | "processing" | "success";

export function DepositModal({
  vaultConfig,
  open,
  onOpenChange,
}: {
  vaultConfig: VaultConfig;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { connected } = useWallet();
  const { usdcBalance, isLoading: balanceLoading } = useWalletBalances();
  const [step, setStep] = useState<Step>("input");
  const [amountStr, setAmountStr] = useState("");
  const walletBalance = usdcBalance > 0 ? usdcBalance : 12_500;

  useEffect(() => {
    if (!open) {
      setStep("input");
      setAmountStr("");
    }
  }, [open]);

  const amount = Number(amountStr) || 0;
  const estimatedShares = amount > 0 ? amount / 1.05 : 0;
  const isValid = amount >= vaultConfig.minDeposit && amount <= walletBalance;

  function handleConfirm() {
    setStep("processing");
    setTimeout(() => setStep("success"), 2500);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(100vw-2rem,480px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[#1a2235] bg-[#0d1420] p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-[#e8edf5]">
                Deposit to {vaultConfig.name}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-[#8b9cb3]">
                Deposit USDC and receive {vaultConfig.ticker} vault tokens.
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

          {!connected ? (
            <div className="mt-6 flex flex-col items-center gap-4 py-8">
              <Wallet className="size-10 text-[#8b9cb3]" />
              <p className="text-sm text-[#8b9cb3]">
                Connect your wallet to deposit
              </p>
              <WalletMultiButton className="!rounded-xl !bg-[#00e5c3] !px-6 !py-3 !text-sm !font-bold !text-[#080c14]" />
            </div>
          ) : step === "input" ? (
            <div className="mt-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs uppercase tracking-wider text-[#8b9cb3]">
                    Amount (USDC)
                  </label>
                  <button
                    onClick={() => setAmountStr(String(walletBalance))}
                    className="text-xs text-[#00e5c3] hover:underline"
                  >
                    {balanceLoading ? "Loading..." : `Max: ${formatUsd(walletBalance)}`}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    placeholder="0.00"
                    min={0}
                    className="w-full rounded-xl border border-[#1a2235] bg-[#080c14] px-4 py-3 pr-16 font-[family-name:var(--font-space-mono)] text-lg text-[#e8edf5] placeholder-[#8b9cb3]/50 focus:border-[#00e5c3]/50 focus:outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#8b9cb3]">
                    USDC
                  </span>
                </div>
                {amount > 0 && amount < vaultConfig.minDeposit && (
                  <p className="mt-1 text-xs text-[#ef4444]">
                    Minimum deposit: {formatUsd(vaultConfig.minDeposit)}
                  </p>
                )}
              </div>

              {amount > 0 && (
                <div className="rounded-xl border border-white/5 bg-[#080c14] p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#8b9cb3]">You deposit</span>
                    <span className="font-[family-name:var(--font-space-mono)] text-[#e8edf5]">
                      {formatUsd(amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8b9cb3]">You receive (est.)</span>
                    <span className="font-[family-name:var(--font-space-mono)] text-[#00e5c3]">
                      ~{estimatedShares.toFixed(2)} {vaultConfig.ticker}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8b9cb3]">Current PPS</span>
                    <span className="font-[family-name:var(--font-space-mono)]">
                      $1.050
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep("confirm")}
                disabled={!isValid}
                className="w-full rounded-xl bg-[#00e5c3] py-3.5 text-sm font-bold text-[#080c14] transition-colors hover:bg-[#33ebd3] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Review Deposit
              </button>
            </div>
          ) : step === "confirm" ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-[#00e5c3]/20 bg-[#00e5c3]/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-[#8b9cb3]">Depositing</div>
                    <div className="font-[family-name:var(--font-space-mono)] text-xl font-bold text-[#e8edf5]">
                      {formatUsd(amount)}
                    </div>
                  </div>
                  <ArrowRight className="size-5 text-[#8b9cb3]" />
                  <div className="text-right">
                    <div className="text-xs text-[#8b9cb3]">Receiving</div>
                    <div className="font-[family-name:var(--font-space-mono)] text-xl font-bold text-[#00e5c3]">
                      ~{estimatedShares.toFixed(2)}
                    </div>
                    <div className="text-xs text-[#8b9cb3]">{vaultConfig.ticker}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#080c14] p-4 space-y-2 text-xs text-[#8b9cb3]">
                <p>
                  By confirming, you authorize the vault program to transfer
                  USDC from your wallet and mint {vaultConfig.ticker} tokens to
                  your account.
                </p>
                <p>
                  Vault tokens can be redeemed anytime for your proportional
                  share of NAV.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("input")}
                  className="flex-1 rounded-xl border border-[#1a2235] py-3 text-sm font-medium text-[#e8edf5] hover:bg-white/5"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 rounded-xl bg-[#00e5c3] py-3 text-sm font-bold text-[#080c14] hover:bg-[#33ebd3]"
                >
                  Confirm Deposit
                </button>
              </div>
            </div>
          ) : step === "processing" ? (
            <div className="mt-6 flex flex-col items-center gap-4 py-12">
              <Loader2 className="size-10 animate-spin text-[#00e5c3]" />
              <p className="text-sm text-[#8b9cb3]">
                Processing your deposit...
              </p>
              <p className="text-xs text-[#8b9cb3]">
                Sending transaction to Solana
              </p>
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center gap-4 py-8">
              <div className="flex size-14 items-center justify-center rounded-full bg-[#00e5c3]/20">
                <Check className="size-7 text-[#00e5c3]" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-[#e8edf5]">
                  Deposit Successful
                </p>
                <p className="mt-1 text-sm text-[#8b9cb3]">
                  You received ~{estimatedShares.toFixed(2)} {vaultConfig.ticker}
                </p>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="mt-2 rounded-xl bg-[#00e5c3] px-8 py-3 text-sm font-bold text-[#080c14] hover:bg-[#33ebd3]"
              >
                Done
              </button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
