"use client";

import { formatUsd } from "@/components/format";
import { Skeleton } from "@/components/ui/Skeleton";

export function ProtocolStats({
  totalTvl,
  vaultsOnline,
  totalVaults,
  avgPps,
  loading,
}: {
  totalTvl: number;
  vaultsOnline: number;
  totalVaults: number;
  avgPps: number;
  loading: boolean;
}) {
  const stats = [
    {
      label: "Total Value Locked",
      value: loading ? null : formatUsd(totalTvl),
    },
    {
      label: "Vaults (on-chain)",
      value: loading ? null : `${vaultsOnline} / ${totalVaults}`,
    },
    {
      label: "Avg. price / share",
      value:
        loading
          ? null
          : avgPps > 0
            ? `$${avgPps.toFixed(4)}`
            : "—",
    },
    { label: "Management Fee", value: loading ? null : "0%" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map(({ label, value }) => (
        <div
          key={label}
          className="rounded-xl border border-[#1a2235] bg-[#0d1420] p-4 text-center"
        >
          <div className="font-[family-name:var(--font-space-mono)] text-xl font-bold text-[#00e5c3] md:text-2xl">
            {value == null ? (
              <Skeleton className="mx-auto h-8 w-24 rounded-md bg-white/5" />
            ) : (
              value
            )}
          </div>
          <div className="mt-1 text-xs text-[#8b9cb3]">{label}</div>
        </div>
      ))}
    </div>
  );
}
