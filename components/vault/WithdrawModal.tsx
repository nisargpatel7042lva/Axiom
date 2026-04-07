"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X, ArrowRight, Check, Loader2, Wallet } from "lucide-react";
import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

import { formatUsd } from "@/components/format";
import type { VaultConfig, VaultState } from "@/types";

type Step = "input" | "confirm" | "processing" | "success";

export function WithdrawModal({
  vaultConfig,
  vaultState,
  open,
  onOpenChange,
}: {
  vaultConfig: VaultConfig;
  vaultState: VaultState;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { connected } = useWallet();
  const [step, setStep] = useState<Step>("input");
  const [sharesStr, setSharesStr] = useState("");

  const mockUserShares = 4_523.12;
  const userValue = mockUserShares * vaultState.pricePerShare;

  useEffect(() => {
    if (!open) {
      setStep("input");
      setSharesStr("");
    }
  }, [open]);

  const shares = Number(sharesStr) || 0;
  const usdcOut = shares * vaultState.pricePerShare;
  const isValid = shares > 0 && shares <= mockUserShares;

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
                Withdraw from {vaultConfig.name}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-[#8b9cb3]">
                Redeem {vaultConfig.ticker} tokens for USDC.
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
                Connect your wallet to withdraw
              </p>
              <WalletMultiButton className="!rounded-xl !bg-[#00e5c3] !px-6 !py-3 !text-sm !font-bold !text-[#080c14]" />
            </div>
          ) : step === "input" ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-white/5 bg-[#080c14] p-4 flex justify-between items-center">
                <div>
                  <div className="text-xs text-[#8b9cb3]">Your Balance</div>
                  <div className="font-[family-name:var(--font-space-mono)] text-lg font-bold text-[#e8edf5]">
                    {mockUserShares.toLocaleString()} {vaultConfig.ticker}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#8b9cb3]">Value</div>
                  <div className="font-[family-name:var(--font-space-mono)] text-sm text-[#00e5c3]">
                    {formatUsd(userValue)}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs uppercase tracking-wider text-[#8b9cb3]">
                    Shares to redeem
                  </label>
                  <button
                    onClick={() => setSharesStr(String(mockUserShares))}
                    className="text-xs text-[#00e5c3] hover:underline"
                  >
                    Max
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={sharesStr}
                    onChange={(e) => setSharesStr(e.target.value)}
                    placeholder="0.00"
                    min={0}
                    className="w-full rounded-xl border border-[#1a2235] bg-[#080c14] px-4 py-3 pr-20 font-[family-name:var(--font-space-mono)] text-lg text-[#e8edf5] placeholder-[#8b9cb3]/50 focus:border-[#00e5c3]/50 focus:outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-[#8b9cb3]">
                    {vaultConfig.ticker}
                  </span>
                </div>
              </div>

              {shares > 0 && (
                <div className="rounded-xl border border-white/5 bg-[#080c14] p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#8b9cb3]">You redeem</span>
                    <span className="font-[family-name:var(--font-space-mono)] text-[#e8edf5]">
                      {shares.toLocaleString()} {vaultConfig.ticker}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8b9cb3]">You receive (est.)</span>
                    <span className="font-[family-name:var(--font-space-mono)] text-[#00e5c3]">
                      ~{formatUsd(usdcOut)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8b9cb3]">Current PPS</span>
                    <span className="font-[family-name:var(--font-space-mono)]">
                      ${vaultState.pricePerShare.toFixed(3)}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep("confirm")}
                disabled={!isValid}
                className="w-full rounded-xl bg-[#00e5c3] py-3.5 text-sm font-bold text-[#080c14] transition-colors hover:bg-[#33ebd3] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Review Withdrawal
              </button>
            </div>
          ) : step === "confirm" ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-[#00e5c3]/20 bg-[#00e5c3]/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-[#8b9cb3]">Redeeming</div>
                    <div className="font-[family-name:var(--font-space-mono)] text-xl font-bold text-[#e8edf5]">
                      {shares.toLocaleString()}
                    </div>
                    <div className="text-xs text-[#8b9cb3]">{vaultConfig.ticker}</div>
                  </div>
                  <ArrowRight className="size-5 text-[#8b9cb3]" />
                  <div className="text-right">
                    <div className="text-xs text-[#8b9cb3]">Receiving</div>
                    <div className="font-[family-name:var(--font-space-mono)] text-xl font-bold text-[#00e5c3]">
                      ~{formatUsd(usdcOut)}
                    </div>
                    <div className="text-xs text-[#8b9cb3]">USDC</div>
                  </div>
                </div>
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
                  Confirm Withdrawal
                </button>
              </div>
            </div>
          ) : step === "processing" ? (
            <div className="mt-6 flex flex-col items-center gap-4 py-12">
              <Loader2 className="size-10 animate-spin text-[#00e5c3]" />
              <p className="text-sm text-[#8b9cb3]">
                Processing your withdrawal...
              </p>
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center gap-4 py-8">
              <div className="flex size-14 items-center justify-center rounded-full bg-[#00e5c3]/20">
                <Check className="size-7 text-[#00e5c3]" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-[#e8edf5]">
                  Withdrawal Successful
                </p>
                <p className="mt-1 text-sm text-[#8b9cb3]">
                  ~{formatUsd(usdcOut)} USDC sent to your wallet
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
