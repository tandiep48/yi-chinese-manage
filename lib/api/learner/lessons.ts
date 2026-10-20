import type { LessonGrammarRule, LessonPassageDetail, LessonSessionResponse, PickerPassage, PickerProgressSummary } from "@/lib/types/lesson";
import type { LessonVocabRow } from "@/lib/types/vocab";
import {
  hskLevelFromPassageId,
  isBookPassageId,
  nextLessonFirstPassageId,
} from "@/lib/lessons/lessons";
import { legacyApiFetch } from "../client";

export function getPassages(hskLevel: string): Promise<PickerPassage[]> {
  return legacyApiFetch<{ passages: PickerPassage[] }>(
    `/api/lesson/passages?hsk_level=${encodeURIComponent(hskLevel)}`
  ).then((r) => r.passages);
}

// The first part of the next lesson for the lesson flow's "roll on to the next
// lesson" step. Resolved client-side from the level's passage list (no next-lesson
// endpoint exists yet); soft-fails to null so the flow just ends on a fetch error
// or at the last lesson of the level.
export function resolveNextLessonFirstPart(currentPassageId: string): Promise<string | null> {
  if (!currentPassageId || isBookPassageId(currentPassageId)) return Promise.resolve(null);
  return getPassages(hskLevelFromPassageId(currentPassageId))
    .then((passages) => nextLessonFirstPassageId(currentPassageId, passages))
    .catch(() => null);
}

// Requires a session — resolves null (rather than throwing) when signed out
// or on any failure, same as the legacy picker's soft-fail: progress bars are
// an enhancement, not a blocker for browsing lessons.
export function getPickerProgress(hskLevel: string): Promise<PickerProgressSummary | null> {
  return legacyApiFetch<PickerProgressSummary>(
    `/api/lesson/picker-progress?hsk_level=${encodeURIComponent(hskLevel)}`
  ).catch(() => null);
}

export function getLessonPassageDetail(passageId: string): Promise<LessonPassageDetail> {
  return legacyApiFetch<{ passage: LessonPassageDetail }>(
    `/api/lesson/passage/${encodeURIComponent(passageId)}`
  ).then((r) => r.passage);
}

export function getLessonPassageVocab(passageId: string): Promise<LessonVocabRow[]> {
  return legacyApiFetch<{ passage_id: string; vocab: LessonVocabRow[] }>(
    `/api/lesson/vocab/${encodeURIComponent(passageId)}`
  ).then((r) => r.vocab);
}

// Lesson-wide grammar rules for the passage's lesson (all parts), id-ordered.
export function getPassageGrammar(passageId: string): Promise<LessonGrammarRule[]> {
  return legacyApiFetch<{ grammar: LessonGrammarRule[] }>(
    `/api/lesson/grammar/${encodeURIComponent(passageId)}`
  ).then((r) => r.grammar ?? []);
}

// ── Lesson trainer ──────────────────────────────────────────────────────────
// Mirrors POST /api/lesson/{start,submit,part-complete}. Login-required, raw JSON.

// Build a graded session: a single passage (part mode) or several (master mode).
// Throws on failure (e.g. 404 no tasks) — the caller shows the error / redirects.
export function startLessonSession(
  passageIds: string[],
  mode: "part" | "master"
): Promise<LessonSessionResponse> {
  return legacyApiFetch<LessonSessionResponse>(`/api/lesson/start`, {
    method: "POST",
    body: JSON.stringify(
      mode === "master" ? { passage_ids: passageIds, mode } : { passage_id: passageIds[0], mode }
    ),
  });
}

export interface LessonAnswerPayload {
  session_id: number;
  passage_id: string;
  line_id: number;
  type: string;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  response_time_ms: number;
  game_info: Record<string, unknown>;
}

// Log one answer. Fire-and-forget (best-effort, like the legacy trainer) — never throws.
export function submitLessonAnswer(payload: LessonAnswerPayload): Promise<void> {
  return legacyApiFetch<unknown>(`/api/lesson/submit`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
    .then(() => undefined)
    .catch(() => undefined);
}

// Save the round's score. The server only stores it at/above the pass threshold (part)
// or as a % (master), and grants word mastery only on a perfect round. Best-effort.
export function completeLessonPart(
  passageId: string,
  total: number,
  correct: number,
  mode: "part" | "master"
): Promise<void> {
  return legacyApiFetch<unknown>(`/api/lesson/part-complete`, {
    method: "POST",
    body: JSON.stringify({ passage_id: passageId, total, correct, mode }),
  })
    .then(() => undefined)
    .catch(() => undefined);
}
