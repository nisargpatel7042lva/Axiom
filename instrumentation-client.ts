import posthog from "posthog-js";

const key =
  process.env.NEXT_PUBLIC_POSTHOG_KEY ||
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host =
  process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";
const proxyPath = process.env.NEXT_PUBLIC_POSTHOG_PROXY_PATH?.trim();
const enabledRaw = process.env.NEXT_PUBLIC_POSTHOG_ENABLED?.trim();
const posthogEnabled =
  enabledRaw != null
    ? enabledRaw === "1" || enabledRaw.toLowerCase() === "true"
    : process.env.NODE_ENV === "production";

if (typeof window !== "undefined" && key && posthogEnabled) {
  posthog.init(key, {
    // Use direct PostHog host by default. Opt into same-origin proxy only when explicitly configured.
    api_host: proxyPath || host,
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: false,
    enable_heatmaps: false,
    capture_dead_clicks: false,
    capture_performance: false,
    disable_session_recording: true,
    disable_surveys: true,
    disable_external_dependency_loading: true,
    advanced_disable_feature_flags: true,
  });
}

