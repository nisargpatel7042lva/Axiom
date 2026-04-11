"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";

import GlassSurface from "@/components/ui/GlassSurface";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false },
);

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/vaults", label: "Vaults" },
  { href: "/about", label: "About" },
  { href: "/portfolio", label: "Portfolio" },
] as const;

function navActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Topbar() {
  const pathname = usePathname();
  const { connected } = useWallet();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-3 pt-3 md:px-8">
      <GlassSurface
        width="100%"
        height="auto"
        borderRadius={28}
        borderWidth={0.08}
        brightness={48}
        opacity={0.88}
        blur={10}
        displace={0.35}
        backgroundOpacity={0.1}
        saturation={1.15}
        distortionScale={-160}
        redOffset={0}
        greenOffset={8}
        blueOffset={16}
        mixBlendMode="screen"
        forceDark
        className="max-w-5xl shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
      >
        <div className="flex min-h-[3.75rem] w-full flex-wrap items-center justify-between gap-y-3 px-3 py-3 sm:min-h-[4rem] sm:flex-nowrap sm:px-5 sm:py-3.5">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#00e5c3] via-[#6366f1] to-[#a855f7] shadow-lg shadow-[#00e5c3]/15">
              <span className="text-sm font-bold text-white">S</span>
            </div>
            <span className="font-[family-name:var(--font-space-mono)] text-[15px] font-bold tracking-wide spectra-gradient-text">
              SPECTRA
            </span>
          </Link>

          <nav className="order-3 flex w-full items-center justify-center gap-1 sm:order-none sm:absolute sm:left-1/2 sm:w-auto sm:-translate-x-1/2 md:justify-center">
            {NAV_ITEMS.map(({ href, label }) => {
              const active = navActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200 sm:px-4 sm:py-2 sm:text-[14px] ${
                    active
                      ? "bg-white/[0.14] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                      : "text-white/55 hover:bg-white/[0.08] hover:text-white/90"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {connected && (
              <div className="hidden items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 backdrop-blur-sm sm:flex">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00e5c3] opacity-50" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-[#00e5c3]" />
                </span>
                <span className="text-[11px] font-medium text-white/60">Devnet</span>
              </div>
            )}
            <WalletMultiButton
              style={{
                height: "40px",
                padding: "0 18px",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: 500,
                lineHeight: 1,
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.16)",
                color: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                transition: "all 150ms ease",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            />
          </div>
        </div>
      </GlassSurface>
    </div>
  );
}
