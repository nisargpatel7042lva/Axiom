import type { VaultExposureVenue } from "@/types";

export function ExposureVenues({
  venues,
  accentColor,
  /** When true, omit the catalog card chrome (used on vault detail with its own heading). */
  embedded = false,
}: {
  venues: VaultExposureVenue[];
  accentColor: string;
  embedded?: boolean;
}) {
  return (
    <div className={embedded ? "" : "mt-4 border-t border-white/5 pt-4"}>
      {!embedded && (
        <div className="text-[10px] font-medium uppercase tracking-wider text-[#8b9cb3] mb-2">
          Where capital is expressed
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {venues.map((v) => (
          <div
            key={v.label}
            className="rounded-lg border border-white/10 bg-[#080c14]/80 px-2.5 py-1.5"
            title={v.role}
          >
            <div className="text-xs font-medium text-[#e8edf5]">{v.label}</div>
            <div className="text-[10px] text-[#8b9cb3]" style={{ color: `${accentColor}cc` }}>
              {v.role}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
