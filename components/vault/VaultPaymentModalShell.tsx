"use client";

import type { ReactNode } from "react";

import BorderGlow from "@/components/ui/BorderGlow";
import { VAULT_BORDER_GLOW } from "@/constants";
import type { VaultId } from "@/types";

/** Outer chrome for deposit/withdraw dialogs — same aurora edge treatment as {@link VaultCard}. */
export function VaultPaymentModalShell({
  vaultId,
  children,
}: {
  vaultId: VaultId;
  children: ReactNode;
}) {
  const glow = VAULT_BORDER_GLOW[vaultId];

  return (
    <BorderGlow
      className="w-full overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_28px_64px_rgba(0,0,0,0.55)]"
      borderRadius={16}
      backgroundColor="#0d1420"
      glowColor={glow.glowHsl}
      colors={[...glow.colors]}
      glowRadius={28}
      glowIntensity={1.05}
      coneSpread={22}
      edgeSensitivity={26}
      animated
    >
      <div className="min-h-0 max-h-[min(92dvh,90vh)] overflow-x-hidden overflow-y-auto overscroll-y-contain min-[391px]:max-h-[90vh]">
        {children}
      </div>
    </BorderGlow>
  );
}
