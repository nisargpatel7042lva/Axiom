"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Home, Shield, User, BookOpen, TrendingUp, Eye, Info, HelpCircle, Menu, X,
} from "lucide-react";
import {
  motion, AnimatePresence, useMotionValue, useSpring, useTransform,
} from "framer-motion";
import type { LucideIcon } from "lucide-react";

import GlassSurface from "@/components/ui/GlassSurface";
import { getNetwork } from "@/lib/spectra/constants";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false },
);

interface NavItem { href: string; label: string; Icon: LucideIcon }

const NAV_ITEMS: NavItem[] = [
  { href: "/",             label: "Home",         Icon: Home       },
  { href: "/vaults",       label: "Vaults",       Icon: Shield     },
  { href: "/portfolio",    label: "Portfolio",    Icon: User       },
  { href: "/docs",         label: "Docs",         Icon: BookOpen   },
  { href: "/performance",  label: "Performance",  Icon: TrendingUp },
  { href: "/transparency", label: "Transparency", Icon: Eye        },
  { href: "/about",        label: "About",        Icon: Info       },
  { href: "/faq",          label: "FAQ",          Icon: HelpCircle },
];

function navActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function clusterLabel() {
  switch (getNetwork()) {
    case "mainnet-beta": return "Mainnet";
    case "testnet":      return "Testnet";
    default:             return "Devnet";
  }
}

// ─── Dock icon ────────────────────────────────────────────────────────────────

const ICON_BASE = 36;
const ICON_MAX  = 54;

function DockIcon({
  item, mouseX, active,
}: { item: NavItem; mouseX: ReturnType<typeof useMotionValue<number>>; active: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [hovered, setHovered] = useState(false);

  const distance = useTransform(mouseX, (x) => {
    const el = ref.current;
    if (!el) return 999;
    const rect = el.getBoundingClientRect();
    return x - (rect.left + rect.width / 2);
  });

  const sizeRaw = useTransform(distance, (d) => {
    const reach = 90;
    if (Math.abs(d) >= reach) return ICON_BASE;
    return ICON_BASE + (ICON_MAX - ICON_BASE) * (1 - Math.abs(d) / reach);
  });
  const size     = useSpring(sizeRaw, { stiffness: 240, damping: 18, mass: 0.08 });
  const iconSize = useTransform(size, (s) => (s / ICON_BASE) * 17);

  return (
    <Link
      ref={ref}
      href={item.href}
      aria-label={item.label}
      className="relative flex flex-col items-center justify-end"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div
        style={{ width: size, height: size }}
        className={`flex items-center justify-center rounded-xl transition-colors duration-150 ${
          active
            ? "bg-[#00e5c3]/15 text-[#00e5c3]"
            : "text-white/40 hover:bg-white/[0.08] hover:text-white/75"
        }`}
      >
        <motion.div style={{ width: iconSize, height: iconSize }} className="flex items-center justify-center">
          <item.Icon style={{ width: "100%", height: "100%" }} strokeWidth={1.8} />
        </motion.div>
      </motion.div>

      {active && <span className="mt-0.5 size-1 rounded-full bg-[#00e5c3]" />}

      <AnimatePresence>
        {hovered && (
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            className="pointer-events-none absolute left-1/2 top-full z-50 mt-2.5 -translate-x-1/2 whitespace-nowrap rounded-lg border border-[#1a2235] bg-[#0a0f18] px-2.5 py-1.5 text-xs font-medium text-[#e8edf5] shadow-xl"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

export function Topbar() {
  const pathname = usePathname();
  const { connected } = useWallet();
  const cluster  = clusterLabel();
  const menuId   = useId();
  const mouseX   = useMotionValue(Infinity);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled,   setScrolled]   = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);
  useEffect(() => { closeMobile(); }, [pathname, closeMobile]);
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeMobile(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, closeMobile]);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed left-0 right-0 top-0 z-50 flex justify-center px-3 pt-3 md:px-8"
    >
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
          className={`z-[60] transition-shadow duration-300 ${
            scrolled
              ? "shadow-[0_12px_48px_rgba(0,0,0,0.6)]"
              : "shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
          }`}
        >
          <div className="relative flex min-h-[3.5rem] w-full items-center gap-2 px-3 py-2.5 sm:min-h-[4rem] sm:px-5 sm:py-3.5">

            {/* Logo */}
            <Link href="/" className="flex shrink-0 items-center" onClick={closeMobile}>
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

            {/* Desktop dock */}
            <nav
              onMouseMove={(e) => mouseX.set(e.clientX)}
              onMouseLeave={() => mouseX.set(Infinity)}
              className="hidden flex-1 items-end justify-center gap-1 md:flex"
              aria-label="Main"
            >
              {NAV_ITEMS.map((item) => (
                <DockIcon
                  key={item.href}
                  item={item}
                  mouseX={mouseX}
                  active={navActive(pathname, item.href)}
                />
              ))}
            </nav>

            {/* Right: network + wallet + hamburger */}
            <div className="ml-auto flex shrink-0 items-center gap-2">
              {connected && (
                <div className="hidden items-center gap-1 sm:flex">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00e5c3] opacity-50" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-[#00e5c3]" />
                  </span>
                  <span className="text-xs font-medium text-white/50">{cluster}</span>
                </div>
              )}
              <div
                className="min-w-0 max-w-[min(44vw,9rem)] sm:max-w-none [&_.wallet-adapter-button]:!max-w-full [&_.wallet-adapter-button]:!truncate"
                onClick={closeMobile}
              >
                <WalletMultiButton
                  className="wallet-adapter-button-trigger"
                  style={{
                    height: "36px",
                    maxWidth: "100%",
                    padding: "0 10px",
                    borderRadius: "12px",
                    fontSize: "12px",
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
                    whiteSpace: "nowrap",
                  }}
                />
              </div>
              <button
                type="button"
                className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.08] text-white/90 transition-colors hover:bg-white/[0.12] md:hidden"
                aria-expanded={mobileOpen}
                aria-controls={menuId}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                onClick={() => setMobileOpen((o) => !o)}
              >
                {mobileOpen
                  ? <X className="size-4" strokeWidth={2} />
                  : <Menu className="size-4" strokeWidth={2} />}
              </button>
            </div>
          </div>
        </GlassSurface>

        {/* Mobile — 4-column icon grid */}
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
              className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-white/10 bg-[#0a0f18]/96 p-3 shadow-2xl backdrop-blur-xl md:hidden"
              role="navigation"
              aria-label="Mobile menu"
            >
              {connected && (
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00e5c3] opacity-50" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-[#00e5c3]" />
                  </span>
                  <span className="text-xs font-medium text-white/70">Network: {cluster}</span>
                </div>
              )}
              <div className="grid grid-cols-4 gap-2">
                {NAV_ITEMS.map(({ href, label, Icon }) => {
                  const active = navActive(pathname, href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={closeMobile}
                      className={`flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors ${
                        active ? "bg-[#00e5c3]/10" : "hover:bg-white/[0.06]"
                      }`}
                    >
                      <Icon className={`size-5 ${active ? "text-[#00e5c3]" : "text-white/45"}`} />
                      <span className={`text-center text-[10px] font-medium leading-tight ${active ? "text-[#00e5c3]" : "text-white/55"}`}>
                        {label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
