"use client";

import { useCallback, useState } from "react";
import {
  IDLE_PROCESS,
  type GhProcessState,
  type GhProcessStep,
  type GhProcessTone,
} from "@/components/ui/gh-process-modal";
import { ghToast } from "@/components/ui/gh-toast";
import { friendlyIcError } from "@/lib/ic/local-identity";

export type RunProcessOptions = {
  title: string;
  description?: string;
  contextLine?: string;
  steps: GhProcessStep[];
  tone?: GhProcessTone;
  successTitle: string;
  successDetail?: string;
  /** Called with setStep(i) to advance the step list while work runs */
  action: (setStep: (i: number) => void) => Promise<void>;
  /** Skip error toast (caller handles) */
  silentErrorToast?: boolean;
};

/**
 * Shared process-modal state + run helper for any form / chain submission.
 */
export function useProcessModal() {
  const [processState, setProcessState] =
    useState<GhProcessState>(IDLE_PROCESS);

  const closeProcess = useCallback(() => {
    setProcessState(IDLE_PROCESS);
  }, []);

  const runProcess = useCallback(async (opts: RunProcessOptions) => {
    const setStep = (i: number) =>
      setProcessState((s) => ({ ...s, stepIndex: i, phase: "running" }));

    setProcessState({
      open: true,
      title: opts.title,
      description: opts.description,
      contextLine: opts.contextLine,
      steps: opts.steps,
      stepIndex: 0,
      phase: "running",
      error: null,
      tone: opts.tone ?? "brand",
    });

    try {
      await opts.action(setStep);
      setProcessState((s) => ({
        ...s,
        phase: "success",
        stepIndex: Math.max(0, opts.steps.length - 1),
        successTitle: opts.successTitle,
        successDetail: opts.successDetail,
      }));
      return { ok: true as const };
    } catch (e) {
      const msg = friendlyIcError(e);
      setProcessState((s) => ({
        ...s,
        phase: "error",
        error: msg,
      }));
      if (!opts.silentErrorToast) {
        ghToast({
          title: `${opts.title} failed`,
          description: msg,
          type: "error",
        });
      }
      return { ok: false as const, error: msg };
    }
  }, []);

  return { processState, setProcessState, closeProcess, runProcess };
}
