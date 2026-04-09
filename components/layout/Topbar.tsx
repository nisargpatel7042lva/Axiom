"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false },
);

const NAV_ITEMS = [
  { href: "/", label: "Vaults" },
  { href: "/portfolio", label: "Portfolio" },
] as const;

export function Topbar() {
  const pathname = usePathname();
  const { connected } = useWallet();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-3 md:px-8">
      <header
        className="relative w-full max-w-4xl rounded-2xl"
        style={{
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: [
            "0 8px 32px rgba(0, 0, 0, 0.25)",
            "inset 0 1px 0 rgba(255, 255, 255, 0.08)",
          ].join(", "),
        }}
      >
        <div className="flex h-12 items-center justify-between px-3 md:px-4">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="size-7 rounded-lg bg-gradient-to-br from-[#00e5c3] via-[#6366f1] to-[#a855f7] flex items-center justify-center">
              <span className="text-xs font-bold text-white">S</span>
            </div>
            <span className="font-[family-name:var(--font-space-mono)] text-sm font-bold tracking-wide spectra-gradient-text">
              SPECTRA
            </span>
          </Link>

          {/* Center: Nav links */}
          <nav className="hidden md:flex items-center gap-0.5 absolute left-1/2 -translate-x-1/2">
            {NAV_ITEMS.map(({ href, label }) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-white/[0.1] text-white"
                      : "text-white/50 hover:text-white/80 hover:bg-white/[0.06]"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right: Status + Wallet */}
          <div className="flex items-center gap-2.5">
            {connected && (
              <div className="hidden sm:flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-2.5 py-1.5">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00e5c3] opacity-50" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-[#00e5c3]" />
                </span>
                <span className="text-[11px] font-medium text-white/50">Devnet</span>
              </div>
            )}
            <WalletMultiButton
              style={{
                height: "32px",
                padding: "0 14px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 500,
                lineHeight: 1,
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "rgba(255, 255, 255, 0.85)",
                transition: "all 150ms ease",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            />
          </div>
        </div>
      </header>
    </div>
  );
}
