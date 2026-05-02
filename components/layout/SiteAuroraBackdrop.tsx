"use client";

import dynamic from "next/dynamic";

import { SITE_PRIMARY_GRADIENT_COLORS } from "@/constants";

const ColorBends = dynamic(() => import("@/components/ui/ColorBends"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[100dvh] w-full bg-[#080c14]" aria-hidden />
  ),
});

/**
 * Soft full-viewport aurora (ColorBends) using site primaries.
 * Use behind page content: `relative min-h-screen` root, backdrop `z-0`, content `z-10`.
 */
export function SiteAuroraBackdrop() {
  const colors = [...SITE_PRIMARY_GRADIENT_COLORS];

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 h-[100dvh] min-h-[100dvh] w-full overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 h-full min-h-[100dvh] w-full">
        <ColorBends
          className="!min-h-[100dvh]"
          colors={colors}
          rotation={32}
          speed={0.16}
          scale={1.12}
          frequency={0.62}
          warpStrength={0.58}
          mouseInfluence={0.28}
          parallax={0.22}
          noise={0.045}
          transparent={false}
          autoRotate={1.35}
        />
      </div>
      <div
        className="absolute inset-0 min-h-[100dvh] bg-[#080c14]/40"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(8,12,20,0.52) 0%, rgba(8,12,20,0.38) 42%, rgba(8,12,20,0.48) 100%)",
        }}
      />
      <div
        className="absolute inset-0 min-h-[100dvh] mix-blend-screen opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 110% 70% at 50% -5%, rgba(0, 229, 195, 0.14) 0%, transparent 55%), radial-gradient(ellipse 75% 55% at 100% 35%, rgba(99, 102, 241, 0.12) 0%, transparent 52%), radial-gradient(ellipse 70% 60% at 0% 90%, rgba(168, 85, 247, 0.1) 0%, transparent 48%), radial-gradient(ellipse 85% 45% at 35% 100%, rgba(14, 165, 233, 0.09) 0%, transparent 50%)",
        }}
      />
    </div>
  );
}
