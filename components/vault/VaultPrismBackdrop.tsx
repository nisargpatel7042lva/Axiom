"use client";

import PrismaticBurst from "@/components/ui/PrismaticBurst";
import type { VaultId } from "@/types";
import { getVaultPrismaticBurstColors } from "@/constants";

const FALLBACK_BURST_COLORS = ["#334155", "#1e293b", "#94a3b8"];

/** Full-viewport WebGL burst behind vault pages; 50% black tint for readability. */
export function VaultPrismBackdrop({ vaultId }: { vaultId?: VaultId }) {
  const colors = vaultId ? getVaultPrismaticBurstColors(vaultId) : FALLBACK_BURST_COLORS;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 min-h-[100dvh]" aria-hidden>
      <div className="absolute inset-0 min-h-[100dvh] w-full">
        <PrismaticBurst
          animationType="rotate3d"
          intensity={2}
          speed={0.5}
          distort={1}
          paused={false}
          offset={{ x: 0, y: 0 }}
          hoverDampness={0.25}
          rayCount={24}
          mixBlendMode="lighten"
          colors={colors}
        />
      </div>
      <div className="absolute inset-0 min-h-[100dvh] bg-black/50" />
    </div>
  );
}
