"use client";

import posthog from "posthog-js";
import { getNetwork } from "@/lib/spectra/constants";

import type { TelemetryEvent, TelemetryEventName } from "./schema";

const SESSION_KEY = "axiom.telemetry.sessionId";

function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  window.sessionStorage.setItem(SESSION_KEY, id);
  return id;
}

export function newAttemptId(): string {
  if (typeof window === "undefined") return crypto.randomUUID();
  return crypto.randomUUID();
}

type EventInput = Omit<TelemetryEvent, "timestamp" | "sessionId" | "source"> & {
  name: TelemetryEventName;
};

export function trackEvent(input: EventInput): void {
  const payload = {
    ...input,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    network: input.network ?? getNetwork(),
    source: "frontend",
  };

  posthog.capture(payload.name, payload);
}

export function identifyWallet(walletAddress: string): void {
  posthog.identify(walletAddress, { wallet: walletAddress });
}

export function resetIdentity(): void {
  posthog.reset();
}

