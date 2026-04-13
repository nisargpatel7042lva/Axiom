"use client";

import { useMemo } from "react";
import { ExternalLink, Link2, ShieldCheck } from "lucide-react";

import { SPECTRA_PROGRAM_ADDRESS } from "@/constants";
import { type SolanaCluster, getNetwork } from "@/lib/spectra/constants";
import {
  deriveAssetVaultPda,
  deriveVaultPda,
} from "@/lib/spectra/vault-client";

function solscanAccount(address: string, cluster: SolanaCluster) {
  if (cluster === "mainnet-beta") {
    return `https://solscan.io/account/${address}`;
  }
  const q = cluster === "testnet" ? "testnet" : "devnet";
  return `https://solscan.io/account/${address}?cluster=${q}`;
}

export function VaultTransparencyPanel({
  chainVaultId,
}: {
  chainVaultId: number;
}) {
  const cluster = getNetwork();
  const [vaultPda] = useMemo(() => deriveVaultPda(chainVaultId), [chainVaultId]);
  const [assetVaultAta] = useMemo(() => deriveAssetVaultPda(vaultPda), [vaultPda]);

  const links = [
    {
      label: "Spectra program",
      href: solscanAccount(SPECTRA_PROGRAM_ADDRESS, cluster),
      hint: "Upgrade authority & bytecode",
    },
    {
      label: "Vault state PDA",
      href: solscanAccount(vaultPda.toBase58(), cluster),
      hint: "NAV, shares, pause, fee params",
    },
    {
      label: "USDC vault ATA",
      href: solscanAccount(assetVaultAta.toBase58(), cluster),
      hint: "On-chain custody balance",
    },
  ];

  return (
    <div className="rounded-2xl border border-[#1a2235] bg-[#0d1420] p-6">
      <div className="flex items-center gap-2 mb-3">
        <Link2 className="size-4 text-[#8b9cb3]" />
        <h3 className="text-sm font-semibold text-[#e8edf5]">Verify on-chain</h3>
      </div>
      <p className="text-xs leading-relaxed text-[#8b9cb3]">
        Self-custody here means you sign deposits and withdrawals with your wallet, while USDC sits
        in program-derived accounts you can audit. Share tokens (Token-2022) are the accounting
        claim on vault NAV — inspect balances alongside the vault state account.
      </p>
      <ul className="mt-4 space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start justify-between gap-2 rounded-lg border border-white/5 bg-[#080c14]/60 px-3 py-2 transition-colors hover:border-[#00e5c3]/25"
            >
              <div>
                <div className="text-sm font-medium text-[#e8edf5]">{l.label}</div>
                <div className="text-[10px] text-[#8b9cb3]">{l.hint}</div>
              </div>
              <ExternalLink className="mt-0.5 size-4 shrink-0 text-[#8b9cb3] group-hover:text-[#00e5c3]" />
            </a>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-start gap-2 rounded-lg bg-white/5 px-3 py-2.5 text-[11px] leading-relaxed text-[#8b9cb3]">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#00e5c3]" />
        <span>
          Charts and Dune SIM activity are <span className="text-[#e8edf5]">off-chain UX layers</span>
          . Treat NAV, custody, and your token balances as the source of truth for economics.
        </span>
      </div>
    </div>
  );
}
