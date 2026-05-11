"use client";

import * as Dialog from "@radix-ui/react-dialog";
import dynamic from "next/dynamic";
import { FileSignature, Loader2, ShieldCheck } from "lucide-react";

import {
  SAFE_PLAY_AGREEMENT_VERSION,
  SAFE_PLAY_SUMMARY_POINTS,
  buildAgreementMessage,
} from "@/lib/safe-play/agreement";
import { useSafePlayAcknowledgment } from "@/hooks/useSafePlayAcknowledgment";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false },
);

export function SafePlayAgreementGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status, error, signAgreement, requiresBlockingOverlay } =
    useSafePlayAcknowledgment();

  const open = requiresBlockingOverlay;
  const isChecking = status === "checking";
  const isUnsupported = status === "unsupported_wallet";

  return (
    <>
      {children}
      <Dialog.Root open={open} modal>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md" />
          <Dialog.Content
            aria-describedby={undefined}
            onEscapeKeyDown={(e) => e.preventDefault()}
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
            className="fixed left-1/2 top-1/2 z-[10001] max-h-[min(85dvh,720px)] w-[min(100vw-1.5rem,520px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-[#1a2235] bg-[#0d1420] shadow-2xl"
          >
            {isChecking ? (
              <div className="flex flex-col items-center gap-4 px-8 py-16">
                <Dialog.Title className="sr-only">Checking Safe Play acknowledgment</Dialog.Title>
                <Loader2 className="size-10 animate-spin text-[#00e5c3]" aria-hidden />
                <p className="text-center text-sm text-[#8b9cb3]">
                  Checking Safe Play acknowledgment…
                </p>
              </div>
            ) : isUnsupported ? (
              <div className="space-y-4 px-6 py-8">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="size-9 shrink-0 text-amber-400/90" />
                  <Dialog.Title className="text-lg font-semibold text-[#e8edf5]">
                    Message signing not available
                  </Dialog.Title>
                </div>
                <p className="text-sm leading-relaxed text-[#8b9cb3]">
                  Axiom needs your wallet to sign a short &quot;Safe Play&quot; acknowledgment
                  (off-chain text only — it does not spend SOL or USDC). This wallet adapter does
                  not expose message signing. Try Phantom or Solflare, then connect again.
                </p>
                <p className="text-xs text-[#8b9cb3]/70">
                  Disconnect or switch wallet using the control below.
                </p>
                <div className="flex justify-center pt-2">
                  <WalletMultiButton className="!rounded-xl !bg-white/10 !px-6 !py-3 !text-sm !font-semibold !text-[#e8edf5]" />
                </div>
              </div>
            ) : (
              <div className="flex max-h-[min(90vh,720px)] flex-col">
                <div className="shrink-0 border-b border-[#1a2235] px-6 py-5">
                  <div className="flex items-start gap-3">
                    <FileSignature className="mt-0.5 size-8 shrink-0 text-[#00e5c3]" />
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-[#e8edf5]">
                        Safe Play acknowledgment
                      </Dialog.Title>
                      <p className="mt-1 text-xs text-[#8b9cb3]">
                        Version {SAFE_PLAY_AGREEMENT_VERSION} · Sign once per wallet to continue
                      </p>
                    </div>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                  <p className="text-sm leading-relaxed text-[#c5d0e0]">
                    Before you use vaults or portfolio tools, confirm you understand how Axiom
                    works and the risks involved. The list below is a summary; your wallet will
                    sign the full text so your consent is cryptographically tied to this address.
                  </p>
                  <ul className="mt-4 space-y-3 text-sm text-[#8b9cb3]">
                    {SAFE_PLAY_SUMMARY_POINTS.map((line) => (
                      <li key={line} className="flex gap-2">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#00e5c3]/80" />
                        <span className="leading-relaxed">{line}</span>
                      </li>
                    ))}
                  </ul>
                  <details className="mt-5 rounded-xl border border-[#1a2235] bg-[#080c14]/80 p-3">
                    <summary className="cursor-pointer text-xs font-medium text-[#00e5c3]">
                      View exact message you will sign
                    </summary>
                    <pre className="mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-[#8b9cb3]">
                      {buildAgreementMessage("YOUR_WALLET_ADDRESS")}
                    </pre>
                    <p className="mt-2 text-[10px] text-[#8b9cb3]/70">
                      Preview uses a placeholder; your real address is inserted when you sign.
                    </p>
                  </details>
                </div>

                {error && (
                  <div className="shrink-0 border-t border-red-500/20 bg-red-500/10 px-6 py-3">
                    <p className="text-xs text-red-200/90">{error}</p>
                  </div>
                )}

                <div className="shrink-0 border-t border-[#1a2235] bg-[#080c14]/50 px-6 py-4">
                  <button
                    type="button"
                    disabled={status === "signing"}
                    onClick={() => void signAgreement()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00e5c3] px-4 py-3.5 text-sm font-bold text-[#080c14] transition hover:bg-[#33ebd1] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {status === "signing" ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Waiting for wallet…
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="size-4" />
                        Sign acknowledgment in wallet
                      </>
                    )}
                  </button>
                  <p className="mt-3 text-center text-[10px] text-[#8b9cb3]/70">
                    This signs a plain message only. It does not send a transaction or transfer
                    tokens.
                  </p>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
