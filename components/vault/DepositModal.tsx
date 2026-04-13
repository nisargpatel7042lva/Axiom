"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X, Wallet, ArrowRight, Check, Loader2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import BN from "bn.js";

import { formatUsd, formatShares } from "@/components/format";
import { useWalletBalances } from "@/hooks/useWalletBalances";
import { useDeposit } from "@/lib/spectra/hooks/use-deposit";
import { previewDeposit } from "@/lib/spectra/vault-client";
import type { VaultState as OnChainVault } from "@/lib/spectra/types";
import { USDC_DECIMALS } from "@/lib/spectra/constants";
import type { VaultConfig, VaultState } from "@/types";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false },
);

type Step = "input" | "confirm" | "processing" | "success";

export function DepositModal({
  vaultConfig,
  chainVaultId,
  onChainVault,
  uiVaultState,
  open,
  onOpenChange,
  onDeposited,
}: {
  vaultConfig: VaultConfig;
  chainVaultId: number;
  onChainVault: OnChainVault | null;
  uiVaultState: VaultState | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDeposited?: () => void;
}) {
  const { connected } = useWallet();
  const { usdcBalance, isLoading: balanceLoading } = useWalletBalances();
  const { deposit, loading: txLoading } = useDeposit(chainVaultId);

  const [step, setStep] = useState<Step>("input");
  const [amountStr, setAmountStr] = useState("");
  const [lastSig, setLastSig] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  const walletBalance = usdcBalance;

  useEffect(() => {
    if (!open) {
      setStep("input");
      setAmountStr("");
      setLastSig(null);
      setTxError(null);
    }
  }, [open]);

  const amount = Number(amountStr) || 0;
  const lamports = useMemo(
    () => new BN(Math.floor(amount * 10 ** USDC_DECIMALS)),
    [amount],
  );

  const preview = useMemo(() => {
    if (!onChainVault || amount <= 0) return null;
    return previewDeposit(onChainVault, lamports);
  }, [onChainVault, lamports, amount]);

  const sharesHuman = preview
    ? Number(preview.sharesToReceive.toString(10)) / 10 ** 9
    : 0;

  const ppsDisplay = uiVaultState?.pricePerShare ?? preview?.estimatedPPS ?? 1;

  const isValid =
    onChainVault != null &&
    !onChainVault.isPaused &&
    amount >= vaultConfig.minDeposit &&
    amount > 0 &&
    amount <= walletBalance;

  async function handleConfirm() {
    if (!onChainVault) return;
    setTxError(null);
    setStep("processing");
    try {
      const sig = await deposit(lamports);
      setLastSig(sig);
      setStep("success");
      onDeposited?.();
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : typeof e === "object" && e !== null && "message" in e
            ? String((e as { message: unknown }).message)
            : String(e);
      setTxError(msg || "Transaction failed");
      setStep("confirm");
    }
  }

  const disabledReason =
    onChainVault == null
      ? "Vault account not found on this RPC (initialize on devnet first)."
      : onChainVault.isPaused
        ? "Vault is paused."
        : null;

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
                Deposit USDC and receive {vaultConfig.ticker} vault tokens on devnet.
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

          {disabledReason && (
            <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200/90">
              {disabledReason}
            </p>
          )}

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
                    type="button"
                    onClick={() =>
                      setAmountStr(
                        walletBalance > 0 ? String(Math.floor(walletBalance * 100) / 100) : "0",
                      )
                    }
                    className="text-xs text-[#00e5c3] hover:underline"
                  >
                    {balanceLoading ? "Loading…" : `Max: ${formatUsd(walletBalance)}`}
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
                      {preview ? formatShares(sharesHuman) : "—"} {vaultConfig.ticker}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8b9cb3]">Current PPS</span>
                    <span className="font-[family-name:var(--font-space-mono)]">
                      ${ppsDisplay.toFixed(4)}
                    </span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setTxError(null);
                  setStep("confirm");
                }}
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
                      {preview ? formatShares(sharesHuman) : "—"}
                    </div>
                    <div className="text-xs text-[#8b9cb3]">{vaultConfig.ticker}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#080c14] p-4 space-y-2 text-xs text-[#8b9cb3]">
                <p>
                  By confirming, you authorize the vault program to transfer USDC from your wallet
                  and mint {vaultConfig.ticker} to your Token-2022 account.
                </p>
              </div>

              {txError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200/95">
                  {txError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("input")}
                  className="flex-1 rounded-xl border border-[#1a2235] py-3 text-sm font-medium text-[#e8edf5] hover:bg-white/5"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={txLoading}
                  className="flex-1 rounded-xl bg-[#00e5c3] py-3 text-sm font-bold text-[#080c14] hover:bg-[#33ebd3] disabled:opacity-50"
                >
                  {txLoading ? "Signing…" : "Confirm Deposit"}
                </button>
              </div>
            </div>
          ) : step === "processing" ? (
            <div className="mt-6 flex flex-col items-center gap-4 py-12">
              <Loader2 className="size-10 animate-spin text-[#00e5c3]" />
              <p className="text-sm text-[#8b9cb3]">Confirm the transaction in your wallet…</p>
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center gap-4 py-8">
              <div className="flex size-14 items-center justify-center rounded-full bg-[#00e5c3]/20">
                <Check className="size-7 text-[#00e5c3]" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-[#e8edf5]">Deposit submitted</p>
                <p className="mt-1 text-sm text-[#8b9cb3]">
                  {preview ? formatShares(sharesHuman) : "—"} {vaultConfig.ticker} (est.)
                </p>
                {lastSig && (
                  <p className="mt-2 font-[family-name:var(--font-space-mono)] text-[10px] text-[#8b9cb3] break-all">
                    {lastSig}
                  </p>
                )}
              </div>
              <button
                type="button"
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
