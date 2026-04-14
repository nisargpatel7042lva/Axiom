"use client";

import { useEffect, useState } from "react";

import {
  PORTFOLIO_ACTIVITY_EVENT,
  type PortfolioActivity,
  listPortfolioActivities,
} from "@/lib/portfolio/activity-log";

export function usePortfolioActivities(wallet: string | null): PortfolioActivity[] {
  const [activities, setActivities] = useState<PortfolioActivity[]>([]);

  useEffect(() => {
    if (!wallet) {
      setActivities([]);
      return;
    }

    const load = () => setActivities(listPortfolioActivities(wallet));
    load();

    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key.includes("spectra_portfolio_activity")) load();
    };
    const onInternal = () => load();

    window.addEventListener("storage", onStorage);
    window.addEventListener(PORTFOLIO_ACTIVITY_EVENT, onInternal);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(PORTFOLIO_ACTIVITY_EVENT, onInternal);
    };
  }, [wallet]);

  return activities;
}
