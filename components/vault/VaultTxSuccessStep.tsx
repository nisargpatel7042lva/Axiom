"use client";

import { Check, ExternalLink } from "lucide-react";

export function VaultTxSuccessStep({
  title,
  description,
  txSig,
  explorerClusterParam,
  onDone,
}: {
  title: string;
  description: string;
  txSig: string | null;
  explorerClusterParam: string;
  onDone: () => void;
}) {
  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-2xl border-2 border-[#00e5c3]/35 bg-gradient-to-b from-[#00e5c3]/10 to-transparent p-5 shadow-[inset_0_1px_0_rgba(0,229,195,0.12)]">
        <div className="flex justify-center">
          <div
            className="flex size-[4.25rem] items-center justify-center rounded-2xl border-2 border-[#00e5c3]/45 bg-[#080c14] shadow-[0_0_28px_rgba(0,229,195,0.18)]"
            aria-hidden
          >
            <Check className="size-9 text-[#00e5c3]" strokeWidth={2.75} />
          </div>
        </div>
        <p className="mt-4 text-center text-lg font-semibold text-[#e8edf5]">{title}</p>
        <p className="mt-1.5 text-center text-sm text-[#8b9cb3]">{description}</p>

        {txSig ? (
          <div className="mt-5 rounded-xl border border-[#1a2235] bg-[#080c14] p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#8b9cb3]">
              Transaction signature
            </p>
            <p className="mt-2 max-h-24 overflow-y-auto font-[family-name:var(--font-space-mono)] text-[11px] leading-relaxed text-[#e8edf5] break-all">
              {txSig}
            </p>
            <a
              href={`https://solscan.io/tx/${txSig}${explorerClusterParam}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#00e5c3] px-4 py-3 text-sm font-bold text-[#080c14] transition-colors hover:bg-[#33ebd3]"
            >
              Open in Solscan
              <ExternalLink className="size-4 shrink-0 opacity-90" aria-hidden />
            </a>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onDone}
        className="w-full rounded-xl border border-[#1a2235] bg-[#0d1420] py-3 text-sm font-semibold text-[#e8edf5] transition-colors hover:bg-white/[0.04]"
      >
        Done
      </button>
    </div>
  );
}
