"use client";

import { useQuery } from "@tanstack/react-query";
import { useConnection } from "@solana/wallet-adapter-react";
import { useMemo } from "react";

import { VAULT_CONFIGS } from "@/constants";
import {
  fetchVaultSnapshot,
  mapOnChainToUiVaultState,
} from "@/lib/devnet-vault-data";
import type { VaultId, VaultState } from "@/types";

const REFETCH_MS = 25_000;

export type VaultDashboardEntry = {
  config: (typeof VAULT_CONFIGS)[number];
  chainVaultId: number;
  snapshot: Awaited<ReturnType<typeof fetchVaultSnapshot>>;
  ui: VaultState | null;
};

export function useDevnetVaults() {
  const { connection } = useConnection();

  const query = useQuery({
    queryKey: ["devnet-vault-dashboard", connection.rpcEndpoint],
    queryFn: async (): Promise<VaultDashboardEntry[]> => {
      const results = await Promise.all(
        VAULT_CONFIGS.map(async (config) => {
          const snapshot = await fetchVaultSnapshot(
            connection,
            config.chainVaultId
          );
          const ui =
            snapshot != null
              ? mapOnChainToUiVaultState(
                  config.id,
                  snapshot.onChain,
                  snapshot.custodyLamports
                )
              : null;
          return {
            config,
            chainVaultId: config.chainVaultId,
            snapshot,
            ui,
          } satisfies VaultDashboardEntry;
        })
      );
      return results;
    },
    refetchInterval: REFETCH_MS,
    staleTime: 10_000,
    retry: 1,
  });

  const byVaultId = useMemo(() => {
    const m: Partial<Record<VaultId, VaultDashboardEntry>> = {};
    for (const row of query.data ?? []) {
      m[row.config.id] = row;
    }
    return m;
  }, [query.data]);

  const onlineCount = useMemo(
    () => (query.data ?? []).filter((r) => r.snapshot != null).length,
    [query.data]
  );

  const totalTvl = useMemo(
    () =>
      (query.data ?? []).reduce((s, r) => s + (r.ui?.nav ?? 0), 0),
    [query.data]
  );

  const avgPps = useMemo(() => {
    const rows = (query.data ?? []).filter((r) => r.ui && r.ui.totalShares > 0);
    if (rows.length === 0) return 0;
    const sum = rows.reduce((s, r) => s + (r.ui?.pricePerShare ?? 0), 0);
    return sum / rows.length;
  }, [query.data]);

  return {
    entries: query.data ?? [],
    byVaultId,
    totalTvl,
    onlineCount,
    avgPps,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}
