"use client";

// hooks/lesson/useLessonMilestone.ts
// The six-step milestone's state for one lesson part (docs/plans/dashboard-tabs.md
// §10): which steps are done, which step the learner is on, and how to advance.
//
// The step the learner is *viewing* is deliberately separate from the milestone's
// own `current_step`. Gating is soft (§10.1): any completed step can be replayed,
// so viewing step 2 again must not rewind progress. `current_step` only seeds the
// initial view and is where "resume" returns to.
//
// Advancing a passive step (1, 2, 4, 5) POSTs and takes the server's recomputed
// milestone as the answer. Graded steps (3, 6) are never posted — their trainers
// record them — so finishing one is a `refresh()`, and the step only counts if
// the server agrees it was passed.

import { useCallback, useEffect, useState } from "react";
import {
  getMilestone,
  markMilestoneStep,
  MILESTONE_TOTAL_STEPS,
  type Milestone,
} from "@/lib/api/learner/milestone";

export const PASSIVE_STEPS = [1, 2, 4, 5] as const;
export const VOCAB_TRAINER_STEP = 3;
export const LESSON_TRAINER_STEP = 6;

export function isPassiveStep(step: number): boolean {
  return (PASSIVE_STEPS as readonly number[]).includes(step);
}

export interface UseLessonMilestone {
  loading: boolean;
  error: string | null;
  milestone: Milestone | null;
  totalSteps: number;
  // The step on screen.
  step: number;
  goToStep: (step: number) => void;
  isCompleted: (step: number) => boolean;
  // Continue from a passive step: record it, then move on.
  completeAndAdvance: () => Promise<void>;
  // A graded step's trainer finished: re-read, and advance only if it counted.
  refreshAfterRun: () => Promise<void>;
  saving: boolean;
}

export function useLessonMilestone(
  passageId: string,
  initialStep?: number
): UseLessonMilestone {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [step, setStep] = useState(initialStep ?? 1);
  const [saving, setSaving] = useState(false);
  // Only the first load may seed the view; later refreshes must not move it.
  const [seeded, setSeeded] = useState(initialStep != null);

  useEffect(() => {
    // No part to load: the caller renders its own empty state, and setting state
    // here would only add a synchronous setState to an effect (react-hooks lint).
    if (!passageId) return;

    // `loading` already defaults to true and the fetch resolves it; setting it
    // synchronously here would only add a cascading render
    // (react-hooks/set-state-in-effect), the same reason useVocabReview skips it.
    let cancelled = false;

    getMilestone(passageId)
      .then((data) => {
        if (cancelled) return;
        setMilestone(data);
        if (!seeded) {
          // Resume where the learner left off, clamped for a finished part.
          setStep(Math.min(data.current_step, data.total_steps));
          setSeeded(true);
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load the milestone.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passageId]);

  const totalSteps = milestone?.total_steps ?? MILESTONE_TOTAL_STEPS;

  const isCompleted = useCallback(
    (n: number) => !!milestone?.steps.find((s) => s.step === n)?.completed,
    [milestone]
  );

  const goToStep = useCallback(
    (n: number) => {
      if (n >= 1 && n <= totalSteps) setStep(n);
    },
    [totalSteps]
  );

  const completeAndAdvance = useCallback(async () => {
    if (saving) return;
    const current = step;
    setSaving(true);
    try {
      // Soft-fail on the write: a lost row is re-derived or re-posted next time,
      // and blocking the learner on it would be worse than a missing timestamp.
      const next = await markMilestoneStep(passageId, current).catch(() => null);
      if (next) setMilestone(next);
    } finally {
      setSaving(false);
    }
    setStep((s) => (s === current && s < totalSteps ? s + 1 : s));
  }, [passageId, step, totalSteps, saving]);

  const refreshAfterRun = useCallback(async () => {
    const current = step;
    const next = await getMilestone(passageId).catch(() => null);
    if (!next) return;
    setMilestone(next);
    // Advance only if the server counted the run — a trainer quit below the pass
    // threshold leaves the learner on the step to try again.
    const passed = next.steps.find((s) => s.step === current)?.completed;
    if (passed && current < next.total_steps) setStep(current + 1);
  }, [passageId, step]);

  return {
    // With no part there is nothing in flight, so don't report a permanent load.
    loading: passageId ? loading : false,
    error,
    milestone,
    totalSteps,
    step,
    goToStep,
    isCompleted,
    completeAndAdvance,
    refreshAfterRun,
    saving,
  };
}
