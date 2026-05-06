"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useId, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Menu, X } from "lucide-react";

import GlassSurface from "@/components/ui/GlassSurface";
import { getNetwork } from "@/lib/spectra/constants";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false },
);

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/vaults", label: "Vaults" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/transparency", label: "Metrics" },
] as const;

function navActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function clusterLabel(): string {
  switch (getNetwork()) {
    case "mainnet-beta":
      return "Mainnet";
    case "testnet":
      return "Testnet";
    case "devnet":
    default:
      return "Devnet";
  }
}

export function Topbar() {
  const pathname = usePathname();
  const { connected } = useWallet();
  const cluster = clusterLabel();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuId = useId();

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobile();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, closeMobile]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="fixed left-0 right-0 top-0 z-50 flex justify-center px-3 pt-3 md:px-8">
      <div className="relative w-full max-w-5xl">
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
          contentOverflow="visible"
          className="shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
        >
          <div className="relative flex min-h-[3.5rem] w-full items-center justify-between gap-2 px-3 py-2.5 sm:min-h-[4rem] sm:px-5 sm:py-3.5">
            <Link
              href="/"
              className="flex shrink-0 items-center"
              onClick={closeMobile}
            >
              <div className="relative flex size-9 items-center justify-center sm:size-10">
                <Image
                  src="/axiom-logo.png"
                  alt="Axiom"
                  width={40}
                  height={40}
                  className="size-9 object-contain sm:size-10"
                  priority
                />
              </div>
            </Link>

            {/* Desktop / tablet: centered nav */}
            <nav
              className="absolute left-1/2 hidden w-auto -translate-x-1/2 items-center justify-center gap-0.5 md:flex md:gap-1"
              aria-label="Main"
            >
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

            <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2.5 md:ml-auto">
              {connected && (
                <div className="hidden items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 backdrop-blur-sm sm:flex">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00e5c3] opacity-50" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-[#00e5c3]" />
                  </span>
                  <span className="text-[11px] font-medium text-white/60">
                    {cluster}
                  </span>
                </div>
              )}
              <div className="min-w-0 max-w-[min(52vw,11rem)] sm:max-w-none [&_.wallet-adapter-button]:!max-w-full [&_.wallet-adapter-button]:!truncate">
                <WalletMultiButton
                  className="wallet-adapter-button-trigger"
                  style={{
                    height: "40px",
                    maxWidth: "100%",
                    padding: "0 12px",
                    borderRadius: "12px",
                    fontSize: "13px",
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

              <button
                type="button"
                className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.08] text-white/90 transition-colors hover:bg-white/[0.12] md:hidden"
                aria-expanded={mobileOpen}
                aria-controls={menuId}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                onClick={() => setMobileOpen((o) => !o)}
              >
                {mobileOpen ? (
                  <X className="size-5" strokeWidth={2} />
                ) : (
                  <Menu className="size-5" strokeWidth={2} />
                )}
              </button>
            </div>
          </div>
        </GlassSurface>

        {/* Mobile menu: sheet below bar */}
        {mobileOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 top-[4.5rem] z-40 bg-black/50 backdrop-blur-sm md:hidden"
              aria-label="Close menu"
              onClick={closeMobile}
            />
            <div
              id={menuId}
              className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-white/10 bg-[#0a0f18]/95 p-3 shadow-2xl backdrop-blur-xl md:hidden"
              role="navigation"
              aria-label="Mobile menu"
            >
              {connected && (
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00e5c3] opacity-50" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-[#00e5c3]" />
                  </span>
                  <span className="text-xs font-medium text-white/70">
                    Network: {cluster}
                  </span>
                </div>
              )}
              <ul className="flex flex-col gap-1">
                {NAV_ITEMS.map(({ href, label }) => {
                  const active = navActive(pathname, href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={closeMobile}
                        className={`block rounded-xl px-4 py-3 text-[15px] font-medium transition-colors ${
                          active
                            ? "bg-white/[0.14] text-white"
                            : "text-white/70 hover:bg-white/[0.08] hover:text-white"
                        }`}
                      >
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
