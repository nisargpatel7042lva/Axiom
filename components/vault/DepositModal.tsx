"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X, Wallet, ArrowRight, Loader2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import BN from "bn.js";
import {
  getAssociatedTokenAddressSync,
  getAccount,
  TOKEN_PROGRAM_ID as SPL_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import { formatUsd, formatShares } from "@/components/format";
import { useWalletBalances } from "@/hooks/useWalletBalances";
import { useDeposit } from "@/lib/spectra/hooks/use-deposit";
import { previewDeposit } from "@/lib/spectra/vault-client";
import { recordPortfolioActivity } from "@/lib/portfolio/activity-log";
import type { VaultState as OnChainVault } from "@/lib/spectra/types";
import { USDC_DECIMALS, getNetwork, getUsdcMint } from "@/lib/spectra/constants";
import { newAttemptId, trackEvent } from "@/lib/analytics/client";
import type { VaultConfig, VaultState } from "@/types";
import { VaultTxSuccessStep } from "@/components/vault/VaultTxSuccessStep";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false },
);

type Step = "input" | "confirm" | "processing" | "success";

function toUserFacingDepositError(err: unknown): string {
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
  if (lower.includes("already in progress")) {
    return "A deposit request is already in progress. Please wait for it to finish.";
  }
  if (
    lower.includes("insufficient funds") ||
    (lower.includes("custom program error: 0x1") &&
      lower.includes("tokenkeg"))
  ) {
    return (
      "Not enough USDC in your wallet for this deposit (SPL Token: insufficient funds). " +
      "Fund your devnet USDC token account, lower the amount, or click Max to use your on-chain balance."
    );
  }

  return raw || "Transaction failed. Please try again.";
}

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
  const { connection } = useConnection();
  const { connected, publicKey } = useWallet();
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
  const lamports = useMemo(() => {
    if (!Number.isFinite(amount) || amount <= 0) return new BN(0);
    const micros = Math.floor(amount * 10 ** USDC_DECIMALS);
    return new BN(micros);
  }, [amount]);

  const walletLamportsMax = useMemo(() => {
    if (!Number.isFinite(walletBalance) || walletBalance <= 0) return new BN(0);
    return new BN(Math.floor(walletBalance * 10 ** USDC_DECIMALS));
  }, [walletBalance]);

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
    !lamports.isZero() &&
    lamports.lte(walletLamportsMax);

  async function handleConfirm() {
    if (!onChainVault) return;
    setTxError(null);
    setStep("processing");
    const attemptId = newAttemptId();
    trackEvent({
      name: "deposit_submit_clicked",
      attemptId,
      wallet: publicKey?.toBase58(),
      vaultId: vaultConfig.id,
      chainVaultId,
      txKind: "deposit",
      amountUsdc: amount,
    });
    try {
      if (!publicKey) throw new Error("Wallet not connected");

      const mint = getUsdcMint();
      const userAta = getAssociatedTokenAddressSync(
        mint,
        publicKey,
        false,
        SPL_TOKEN_PROGRAM_ID,
      );
      const userAcc = await getAccount(
        connection,
        userAta,
        "confirmed",
        SPL_TOKEN_PROGRAM_ID,
      );
      const onChainLamports = new BN(userAcc.amount.toString());
      if (lamports.gt(onChainLamports)) {
        const have = onChainLamports.toNumber() / 10 ** USDC_DECIMALS;
        setTxError(
          `Insufficient USDC: this wallet’s token account has ${have.toFixed(6)} USDC on-chain, but the deposit is ${amount.toFixed(6)} USDC. Lower the amount or add devnet USDC to this mint’s ATA.`,
        );
        setStep("confirm");
        return;
      }

      const sig = await deposit(lamports, {
        attemptId,
        wallet: publicKey?.toBase58(),
        vaultId: vaultConfig.id,
        amountUsdc: amount,
      });
      trackEvent({
        name: "deposit_tx_submitted",
        attemptId,
        wallet: publicKey?.toBase58(),
        vaultId: vaultConfig.id,
        chainVaultId,
        txKind: "deposit",
        amountUsdc: amount,
        txSig: sig,
      });
      setLastSig(sig);

      if (publicKey) {
        recordPortfolioActivity({
          wallet: publicKey.toBase58(),
          vaultId: vaultConfig.id,
          vaultName: vaultConfig.name,
          ticker: vaultConfig.ticker,
          kind: "deposit",
          amountUsdc: amount,
          txSig: sig,
        });
      }

      setStep("success");
      onDeposited?.();
    } catch (e) {
      setTxError(toUserFacingDepositError(e));
      setStep("confirm");
    }
  }

  const disabledReason =
    onChainVault == null
      ? "Vault account not found on this RPC (initialize on devnet first)."
      : onChainVault.isPaused
        ? "Vault is paused."
        : null;

  const explorerClusterParam = getNetwork() === "mainnet-beta"
    ? ""
    : `?cluster=${getNetwork()}`;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[min(92dvh,90vh)] w-[calc(100vw-1rem)] max-w-[480px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto overflow-x-hidden rounded-2xl border border-[#1a2235] bg-[#0d1420] p-4 shadow-2xl min-[391px]:max-h-[90vh] min-[391px]:w-[min(100vw-2rem,480px)] min-[391px]:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 pr-2">
              <Dialog.Title className="text-base font-semibold text-[#e8edf5] min-[391px]:text-lg">
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
                    onClick={() => {
                      if (walletLamportsMax.isZero()) {
                        setAmountStr("0");
                        return;
                      }
                      const human = walletLamportsMax.toNumber() / 10 ** USDC_DECIMALS;
                      setAmountStr(String(human));
                    }}
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
                {amount > 0 && lamports.gt(walletLamportsMax) && (
                  <p className="mt-1 text-xs text-[#ef4444]">
                    Amount exceeds on-wallet USDC ({formatUsd(walletBalance)} available).
                  </p>
                )}
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
                  trackEvent({
                    name: "deposit_review_opened",
                    wallet: publicKey?.toBase58(),
                    vaultId: vaultConfig.id,
                    chainVaultId,
                    txKind: "deposit",
                    amountUsdc: amount,
                  });
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
                <div className="flex flex-col gap-4 min-[391px]:flex-row min-[391px]:items-center min-[391px]:justify-between">
                  <div className="min-w-0">
                    <div className="text-xs text-[#8b9cb3]">Depositing</div>
                    <div className="font-[family-name:var(--font-space-mono)] text-lg font-bold text-[#e8edf5] min-[391px]:text-xl">
                      {formatUsd(amount)}
                    </div>
                  </div>
                  <ArrowRight className="mx-auto size-5 shrink-0 rotate-90 text-[#8b9cb3] min-[391px]:mx-0 min-[391px]:rotate-0" />
                  <div className="min-w-0 text-left min-[391px]:text-right">
                    <div className="text-xs text-[#8b9cb3]">Receiving</div>
                    <div className="font-[family-name:var(--font-space-mono)] text-lg font-bold text-[#00e5c3] min-[391px]:text-xl">
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
            <VaultTxSuccessStep
              title="Deposit successful"
              description={
                preview
                  ? `${formatShares(sharesHuman)} ${vaultConfig.ticker} minted to your wallet (est.).`
                  : "Your deposit was confirmed on-chain."
              }
              txSig={lastSig}
              explorerClusterParam={explorerClusterParam}
              onDone={() => onOpenChange(false)}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
