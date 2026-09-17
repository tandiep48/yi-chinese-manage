// lib/api/recent.ts
// Recent-learning endpoint backing the "Continue where you left off" panel on
// the learning page. Raw (non-enveloped) JSON, shared with the Jinja page
// (Learning/web_app/static/learning/learning.js). Reads soft-fail to null so a
// signed-out visitor still sees the picker.

import type { RecentLearning } from "@/lib/types/lesson";
import { legacyApiFetch } from "./client";

export function getRecentLearning(): Promise<RecentLearning | null> {
  return legacyApiFetch<{ recent: RecentLearning | null }>(
    "/api/user/recent-learning"
  )
    .then((r) => (r.recent?.passage_id ? r.recent : null))
    .catch(() => null);
}

export function saveRecentLearning(passageId: string): Promise<void> {
  return legacyApiFetch("/api/user/recent-learning", {
    method: "POST",
    body: JSON.stringify({ passage_id: passageId }),
  })
    .then(() => undefined)
    // Saving recent progress is best-effort — never block navigation on it.
    .catch(() => undefined);
}
