// lib/api/learner/milestone.ts
// The six-step lesson milestone (docs/plans/dashboard-tabs.md §10), mirroring
// Learning/web_app/routes/lesson/lesson_routes.py (GET + POST /api/lesson/milestone).
// Login-required, raw (non-enveloped) JSON, so legacyApiFetch.

import { legacyApiFetch } from "../client";

export const MILESTONE_TOTAL_STEPS = 6;

export interface MilestoneStep {
  step: number;
  completed: boolean;
  completed_at: string | null;
}

export interface Milestone {
  passage_id: string;
  total_steps: number;
  // The lowest incomplete step, or total_steps + 1 when the part is finished.
  current_step: number;
  steps: MilestoneStep[];
}

export function getMilestone(passageId: string): Promise<Milestone> {
  return legacyApiFetch<Milestone>(
    `/api/lesson/milestone?passage_id=${encodeURIComponent(passageId)}`
  );
}

// Records one passive step (1, 2, 4, 5) and returns the recomputed milestone.
// The graded steps are refused by the server on purpose — step 3 is recorded by
// the vocab trainer's batch submit and step 6 by /api/lesson/part-complete, so
// posting them here would let the milestone claim a step that wasn't passed.
export function markMilestoneStep(passageId: string, step: number): Promise<Milestone> {
  return legacyApiFetch<Milestone>(`/api/lesson/milestone`, {
    method: "POST",
    body: JSON.stringify({ passage_id: passageId, step }),
  });
}
