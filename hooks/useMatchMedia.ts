"use client";

import { useSyncExternalStore } from "react";

/**
 * Subscribes to `window.matchMedia(query)`. SSR / first paint uses `serverFallback`.
 */
export function useMatchMedia(query: string, serverFallback = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === "undefined") return () => {};
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverFallback,
  );
}
