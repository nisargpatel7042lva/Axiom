"use client";

import { VAULT_CONFIGS, MOCK_VAULT_STATES } from "@/constants";
import { formatUsd } from "@/components/format";

export function ProtocolStats() {
  const totalTvl = Object.values(MOCK_VAULT_STATES).reduce(
    (sum, v) => sum + v.nav,
    0,
  );
  const totalDepositors = 847;
  const avgApy =
    Object.values(MOCK_VAULT_STATES).reduce(
      (sum, v) => sum + v.performanceSinceInception,
      0,
    ) / VAULT_CONFIGS.length;

  const stats = [
    { label: "Total Value Locked", value: formatUsd(totalTvl) },
    { label: "Active Depositors", value: totalDepositors.toLocaleString() },
    { label: "Avg. Performance", value: `+${avgApy.toFixed(1)}%` },
    { label: "Management Fee", value: "0%" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map(({ label, value }) => (
        <div
          key={label}
          className="rounded-xl border border-[#1a2235] bg-[#0d1420] p-4 text-center"
        >
          <div className="font-[family-name:var(--font-space-mono)] text-xl font-bold text-[#00e5c3] md:text-2xl">
            {value}
          </div>
          <div className="mt-1 text-xs text-[#8b9cb3]">{label}</div>
        </div>
      ))}
    </div>
  );
}
