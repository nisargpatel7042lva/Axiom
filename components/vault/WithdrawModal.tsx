"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X, ArrowRight, Loader2, Wallet } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import BN from "bn.js";

import { formatUsd, formatShares } from "@/components/format";
import { useWithdraw } from "@/lib/spectra/hooks/use-withdraw";
import { previewWithdraw } from "@/lib/spectra/vault-client";
import { recordPortfolioActivity } from "@/lib/portfolio/activity-log";
import { getNetwork } from "@/lib/spectra/constants";
import { newAttemptId, trackEvent } from "@/lib/analytics/client";
import type { VaultState as OnChainVault } from "@/lib/spectra/types";
import type { VaultConfig, VaultState } from "@/types";
import { VaultTxErrorCallout } from "@/components/vault/VaultTxErrorCallout";
import { VaultPaymentModalShell } from "@/components/vault/VaultPaymentModalShell";
import { VaultTxSuccessStep } from "@/components/vault/VaultTxSuccessStep";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false },
);

type Step = "input" | "confirm" | "processing" | "success";

function toUserFacingWithdrawError(err: unknown): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "object" && err !== null && "message" in err
        ? String((err as { message: unknown }).message)
        : String(err);

  const lower = raw.toLowerCase();
  if (lower.includes("user rejected") || lower.includes("walletsigntransactionerror") || lower.includes("rejected the request") || lower.includes("declined")) {
    return "Transaction rejected in wallet. No funds were moved.";
  }
  if (lower.includes("already been processed")) {
    return (
      "This withdrawal may have already landed (duplicate submit or RPC retry). " +
      "Check your wallet / Solscan for a recent withdraw; refresh the page before trying again."
    );
  }

  return raw || "Withdrawal failed. Please try again.";
}

export function WithdrawModal({
  vaultConfig,
  chainVaultId,
  onChainVault,
  uiVaultState,
  userSharesLamports,
  open,
  onOpenChange,
  onWithdrawn,
}: {
  vaultConfig: VaultConfig;
  chainVaultId: number;
  onChainVault: OnChainVault | null;
  uiVaultState: VaultState | null;
  userSharesLamports: BN;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onWithdrawn?: () => void;
}) {
  const { connected, publicKey } = useWallet();
  const { withdraw, loading: txLoading } = useWithdraw(chainVaultId);

  const [step, setStep] = useState<Step>("input");
  const [sharesStr, setSharesStr] = useState("");
  const [lastSig, setLastSig] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  const sharesHumanWallet =
    Number(userSharesLamports.toString(10)) / 10 ** 9;

  useEffect(() => {
    if (!open) {
      setStep("input");
      setSharesStr("");
      setLastSig(null);
      setTxError(null);
    }
  }, [open]);

  const shares = Number(sharesStr) || 0;
  const sharesLamports = useMemo(
    () => new BN(Math.floor(shares * 10 ** 9)),
    [shares],
  );

  const preview = useMemo(() => {
    if (!onChainVault || shares <= 0) return null;
    return previewWithdraw(onChainVault, sharesLamports);
  }, [onChainVault, sharesLamports, shares]);

  const usdcOut = preview
    ? Number(preview.usdcToReceive.toString(10)) / 10 ** 6
    : 0;

  const userValue = sharesHumanWallet * (uiVaultState?.pricePerShare ?? 0);

  const isValid =
    onChainVault != null &&
    !onChainVault.isPaused &&
    shares > 0 &&
    sharesLamports.lte(userSharesLamports) &&
    !sharesLamports.isZero();

  async function handleConfirm() {
    if (!onChainVault) return;
    setTxError(null);
    setStep("processing");
    const attemptId = newAttemptId();
    trackEvent({
      name: "withdraw_submit_clicked",
      attemptId,
      wallet: publicKey?.toBase58(),
      vaultId: vaultConfig.id,
      chainVaultId,
      txKind: "withdraw",
      shares,
    });
    try {
      const sig = await withdraw(sharesLamports, {
        attemptId,
        wallet: publicKey?.toBase58(),
        vaultId: vaultConfig.id,
        shares,
      });
      trackEvent({
        name: "withdraw_tx_submitted",
        attemptId,
        wallet: publicKey?.toBase58(),
        vaultId: vaultConfig.id,
        chainVaultId,
        txKind: "withdraw",
        shares,
        txSig: sig,
      });
      setLastSig(sig);

      if (publicKey) {
        recordPortfolioActivity({
          wallet: publicKey.toBase58(),
          vaultId: vaultConfig.id,
          vaultName: vaultConfig.name,
          ticker: vaultConfig.ticker,
          kind: "withdraw",
          amountUsdc: usdcOut,
          txSig: sig,
        });
      }

      setStep("success");
      onWithdrawn?.();
    } catch (e) {
      setTxError(toUserFacingWithdrawError(e));
      setStep("confirm");
    }
  }

  const explorerClusterParam = getNetwork() === "mainnet-beta"
    ? ""
    : `?cluster=${getNetwork()}`;

  const disabledReason =
    onChainVault == null
      ? "Vault account not found on this RPC."
      : onChainVault.isPaused
        ? "Vault is paused."
        : sharesHumanWallet <= 0
          ? "No vault shares in this wallet for this vault."
          : null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-1rem)] max-w-[480px] -translate-x-1/2 -translate-y-1/2 border-0 bg-transparent p-0 shadow-none outline-none focus:outline-none min-[391px]:w-[min(100vw-2rem,480px)]">
          <VaultPaymentModalShell vaultId={vaultConfig.id}>
          <div className="relative z-10 p-4 min-[391px]:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 pr-2">
              <Dialog.Title className="text-base font-semibold text-[#e8edf5] min-[391px]:text-lg">
                Withdraw from {vaultConfig.name}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-[#8b9cb3]">
                Redeem {vaultConfig.ticker} for USDC on devnet.
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
                Connect your wallet to withdraw
              </p>
              <WalletMultiButton className="!rounded-xl !bg-[#00e5c3] !px-6 !py-3 !text-sm !font-bold !text-[#080c14]" />
            </div>
          ) : step === "input" ? (
            <div className="mt-6 space-y-4">
              <div className="flex flex-col gap-3 rounded-xl border border-white/5 bg-[#080c14] p-4 min-[391px]:flex-row min-[391px]:items-center min-[391px]:justify-between">
                <div className="min-w-0">
                  <div className="text-xs text-[#8b9cb3]">Your balance</div>
                  <div className="break-words font-[family-name:var(--font-space-mono)] text-base font-bold text-[#e8edf5] min-[391px]:text-lg">
                    {formatShares(sharesHumanWallet)} {vaultConfig.ticker}
                  </div>
                </div>
                <div className="text-left min-[391px]:text-right">
                  <div className="text-xs text-[#8b9cb3]">Value (est.)</div>
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
                    type="button"
                    onClick={() => setSharesStr(String(sharesHumanWallet))}
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
                      {formatShares(shares)} {vaultConfig.ticker}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8b9cb3]">You receive (est.)</span>
                    <span className="font-[family-name:var(--font-space-mono)] text-[#00e5c3]">
                      {formatUsd(usdcOut)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8b9cb3]">Current PPS</span>
                    <span className="font-[family-name:var(--font-space-mono)]">
                      ${(uiVaultState?.pricePerShare ?? preview?.estimatedPPS ?? 0).toFixed(4)}
                    </span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setTxError(null);
                  trackEvent({
                    name: "withdraw_review_opened",
                    wallet: publicKey?.toBase58(),
                    vaultId: vaultConfig.id,
                    chainVaultId,
                    txKind: "withdraw",
                    shares,
                  });
                  setStep("confirm");
                }}
                disabled={!isValid}
                className="w-full rounded-xl bg-[#00e5c3] py-3.5 text-sm font-bold text-[#080c14] transition-colors hover:bg-[#33ebd3] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Review Withdrawal
              </button>
            </div>
          ) : step === "confirm" ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-[#00e5c3]/20 bg-[#00e5c3]/5 p-4">
                <div className="flex flex-col gap-4 min-[391px]:flex-row min-[391px]:items-center min-[391px]:justify-between">
                  <div className="min-w-0">
                    <div className="text-xs text-[#8b9cb3]">Redeeming</div>
                    <div className="font-[family-name:var(--font-space-mono)] text-lg font-bold text-[#e8edf5] min-[391px]:text-xl">
                      {formatShares(shares)}
                    </div>
                    <div className="text-xs text-[#8b9cb3]">{vaultConfig.ticker}</div>
                  </div>
                  <ArrowRight className="mx-auto size-5 shrink-0 rotate-90 text-[#8b9cb3] min-[391px]:mx-0 min-[391px]:rotate-0" />
                  <div className="min-w-0 text-left min-[391px]:text-right">
                    <div className="text-xs text-[#8b9cb3]">Receiving</div>
                    <div className="font-[family-name:var(--font-space-mono)] text-lg font-bold text-[#00e5c3] min-[391px]:text-xl">
                      {formatUsd(usdcOut)}
                    </div>
                    <div className="text-xs text-[#8b9cb3]">USDC</div>
                  </div>
                </div>
              </div>

              {txError ? <VaultTxErrorCallout key={txError} message={txError} /> : null}

              <div className="flex flex-col gap-2 min-[391px]:flex-row min-[391px]:gap-3">
                <button
                  type="button"
                  onClick={() => setStep("input")}
                  className="w-full rounded-xl border border-[#1a2235] py-3 text-sm font-medium text-[#e8edf5] hover:bg-white/5 min-[391px]:flex-1"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={txLoading}
                  className="w-full rounded-xl bg-[#00e5c3] py-3 text-sm font-bold text-[#080c14] hover:bg-[#33ebd3] disabled:opacity-50 min-[391px]:flex-1"
                >
                  {txLoading ? "Signing…" : "Confirm Withdrawal"}
                </button>
              </div>
            </div>
          ) : step === "processing" ? (
            <div className="mt-6 flex flex-col items-center gap-4 py-12">
              <Loader2 className="size-10 animate-spin text-[#00e5c3]" />
              <p className="text-sm text-[#8b9cb3]">Confirm the transaction in your wallet…</p>
            </div>
          ) : (
            <VaultTxSuccessStep
              title="Withdrawal successful"
              description={`${formatUsd(usdcOut)} USDC sent to your wallet (est.).`}
              txSig={lastSig}
              explorerClusterParam={explorerClusterParam}
              accentColor={vaultConfig.accentColor}
              onDone={() => onOpenChange(false)}
            />
          )}
          </div>
          </VaultPaymentModalShell>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
