"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";

const NAV_ITEMS = [
  { href: "/", label: "Vaults" },
  { href: "/portfolio", label: "Portfolio" },
] as const;

export function Topbar() {
  const pathname = usePathname();
  const { connected } = useWallet();

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#080c14]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="relative size-8 rounded-lg bg-gradient-to-br from-[#00e5c3] to-[#00e5c3]/60 flex items-center justify-center">
            <span className="text-sm font-bold text-[#080c14]">S</span>
          </div>
          <span className="font-[family-name:var(--font-space-mono)] text-base font-bold tracking-wide text-[#e8edf5]">
            SPECTRA
          </span>
          <span className="rounded-full bg-[#00e5c3]/15 px-2 py-0.5 font-[family-name:var(--font-space-mono)] text-[10px] font-semibold uppercase tracking-wider text-[#00e5c3]">
            Devnet
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/10 text-[#00e5c3]"
                    : "text-[#8b9cb3] hover:text-[#e8edf5] hover:bg-white/5"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          {connected && (
            <div className="hidden sm:flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00e5c3] opacity-50" />
                <span className="relative inline-flex size-2 rounded-full bg-[#00e5c3]" />
              </span>
              <span className="text-xs text-[#8b9cb3]">Devnet</span>
            </div>
          )}
          <WalletMultiButton className="!h-9 !rounded-lg !bg-[#0d1420] !border !border-[#1a2235] !text-sm !text-[#e8edf5] hover:!bg-[#152030]" />
        </div>
      </div>
    </header>
  );
}
