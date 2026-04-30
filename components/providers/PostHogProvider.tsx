"use client";

import { PostHogProvider as PHProvider } from "posthog-js/react";
import posthog from "posthog-js";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

function RouteActivityTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    posthog.capture("route_viewed", { pathname });
  }, [pathname]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <RouteActivityTracker />
      {children}
    </PHProvider>
  );
}

