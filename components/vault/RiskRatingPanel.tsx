import type { VaultRiskDimension, VaultRiskSheet } from "@/types";

const STRESS_STYLE: Record<
  VaultRiskDimension["stress"],
  { label: string; className: string }
> = {
  low: { label: "Low", className: "bg-[#00e5c3]/15 text-[#00e5c3]" },
  moderate: { label: "Moderate", className: "bg-[#8b5cf6]/15 text-[#a78bfa]" },
  elevated: { label: "Elevated", className: "bg-amber-500/15 text-amber-400" },
};

const GRADE_RING: Record<VaultRiskSheet["grade"], string> = {
  A: "ring-[#00e5c3]/40 text-[#00e5c3]",
  B: "ring-[#8b5cf6]/40 text-[#a78bfa]",
  C: "ring-amber-500/40 text-amber-400",
};

export function RiskRatingPanel({
  name,
  riskSheet,
}: {
  name: string;
  riskSheet: VaultRiskSheet;
}) {
  const ring = GRADE_RING[riskSheet.grade];

  return (
    <div className="rounded-2xl border border-[#1a2235] bg-[#0d1420] p-4 min-[391px]:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[#e8edf5]">Axiom risk sheet</h3>
          <p className="mt-1 text-xs leading-relaxed text-[#8b9cb3]">
            A trad-fi-style <span className="text-[#e8edf5]">disclosure rubric</span> for{" "}
            <span className="text-[#e8edf5]">{name}</span> — qualitative, methodology-first,{" "}
            <span className="text-[#e8edf5]">not</span> a regulated rating or investment advice.
          </p>
        </div>
        <div
          className={`flex size-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#080c14] font-[family-name:var(--font-space-mono)] text-2xl font-bold ring-2 ring-offset-2 ring-offset-[#0d1420] ${ring}`}
          title={riskSheet.headline}
        >
          {riskSheet.grade}
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-[#8b9cb3] border-t border-white/5 pt-4">
        {riskSheet.headline}
      </p>
      <ul className="mt-4 space-y-3">
        {riskSheet.dimensions.map((d) => {
          const s = STRESS_STYLE[d.stress];
          return (
            <li
              key={d.id}
              className="rounded-xl border border-white/5 bg-[#080c14]/60 px-3 py-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-[#e8edf5]">{d.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.className}`}>
                  {s.label}
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-[#8b9cb3]">{d.rationale}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
