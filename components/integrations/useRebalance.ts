"use client";

import { useCallback, useState } from "react";

import {
  STUB_REBALANCE_PLAN,
  STUB_REBALANCE_STATE_IDLE,
} from "@/components/integrations/stubData";

import type { RebalancePlan, RebalanceState } from "@/types/index";

/**
 * Stub until Agent 5 provides the real hook.
 */
export function useRebalance(): {
  state: RebalanceState;
  plan: RebalancePlan | null;
  simulate: () => Promise<void>;
  execute: () => Promise<void>;
  reset: () => void;
} {
  const [state, setState] = useState<RebalanceState>(STUB_REBALANCE_STATE_IDLE);
  const [plan] = useState<RebalancePlan | null>(STUB_REBALANCE_PLAN);

  const simulate = useCallback(async () => {
    setState((s) => ({ ...s, status: "simulating" }));
    await new Promise((r) => setTimeout(r, 900));
    setState((s) => ({ ...s, status: "idle", error: undefined }));
  }, []);

  const execute = useCallback(async () => {
    if (!plan) return;
    setState({
      planId: plan.id,
      currentStepIndex: 0,
      txSignatures: [],
      status: "executing",
    });
    for (let i = 0; i < 3; i++) {
      await new Promise((r) => setTimeout(r, 700));
      setState((prev) => ({
        ...prev,
        currentStepIndex: i,
        txSignatures: [
          ...prev.txSignatures,
          `stubSig${i}_${Math.random().toString(36).slice(2, 10)}`,
        ],
      }));
    }
    setState((prev) => ({
      ...prev,
      status: "success",
      currentStepIndex: 2,
    }));
  }, [plan]);

  const reset = useCallback(() => {
    setState(STUB_REBALANCE_STATE_IDLE);
  }, []);

  return { state, plan, simulate, execute, reset };
}
