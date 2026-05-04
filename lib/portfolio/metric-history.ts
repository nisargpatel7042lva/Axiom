import { getSupabaseClient } from "@/lib/supabase/client";

export type MetricPoint = { date: string; value: number; t: number };

const METRIC_TABLE = "portfolio_metric_history";

export async function fetchMetricHistory(
  wallet: string,
  cutoffMs: number,
): Promise<MetricPoint[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from(METRIC_TABLE)
    .select("t,value,date")
    .eq("wallet", wallet)
    .gte("t", cutoffMs)
    .order("t", { ascending: true });

  if (error || !data) return [];

  return data
    .map((row) => ({
      t: Number(row.t),
      value: Number(row.value),
      date: String(row.date),
    }))
    .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.value));
}

export async function upsertMetricHistory(
  wallet: string,
  point: MetricPoint,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  await client
    .from(METRIC_TABLE)
    .upsert(
      {
        wallet,
        t: point.t,
        value: point.value,
        date: point.date,
      },
      { onConflict: "wallet,t" },
    );
}
