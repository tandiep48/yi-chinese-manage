// lib/api/practice.ts
// Learner-facing practice/exam endpoints, mirroring
// Learning/web_app/routes/practice/practice_routes.py (/api/practice/*). These
// predate the { success, data } envelope and return raw JSON, login-required —
// use legacyApiFetch. Distinct from the admin question CRUD in lib/api/question.ts.

import type {
  PracticeCategory,
  PracticeGroup,
  PracticeMultiItem,
  PracticeSessionData,
  PracticeAnswerRow,
  RecommendedPractice,
  ReviewHistoryFilters,
  ReviewHistoryResponse,
  ReviewSessionDetail,
} from "@/lib/types/types";
import { legacyApiFetch } from "./client";

// GET /api/practice/recommend — ranked progress groups the user is ready for
// (vocab coverage ≥ 0.80). Login-required raw JSON; the card only needs the
// lightweight metadata (question_count), the runner loads questions on demand.
export function getRecommendations(): Promise<RecommendedPractice[]> {
  return legacyApiFetch<{ recommendations: RecommendedPractice[] }>(
    `/api/practice/recommend`
  ).then((r) => r.recommendations ?? []);
}

// GET /api/practice/<number>?category= — unique available lessons for a level.
export function getPracticeLessons(
  number: number | string,
  category: PracticeCategory
): Promise<{ number: number; category: PracticeCategory; lessons: string[] }> {
  return legacyApiFetch(
    `/api/practice/${number}?category=${encodeURIComponent(category)}`
  );
}

// GET /api/practice/<number>/<lesson>?category= — all questions for one lesson,
// grouped by progress.
export function getPracticeLesson(
  number: number | string,
  lessonId: string,
  category: PracticeCategory
): Promise<PracticeSessionData> {
  return legacyApiFetch(
    `/api/practice/${number}/${encodeURIComponent(lessonId)}?category=${encodeURIComponent(category)}`
  );
}

// GET /api/practice/<level>/<lesson>/<progress>?category= — one progress group
// (deep-link). Returns { level, lesson, progress, questions }.
export function getPracticeProgressGroup(
  level: number | string,
  lessonId: string,
  progress: string,
  category: PracticeCategory
): Promise<{ level: number; lesson: string; progress: string; questions: PracticeGroup["questions"] }> {
  const catParam = category ? `?category=${encodeURIComponent(category)}` : "";
  return legacyApiFetch(
    `/api/practice/${level}/${encodeURIComponent(lessonId)}/${encodeURIComponent(progress)}${catParam}`
  );
}

// POST /api/practice/multi — combined questions for multiple selected groups.
export function getPracticeMulti(
  items: PracticeMultiItem[]
): Promise<PracticeSessionData> {
  return legacyApiFetch(`/api/practice/multi`, {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}

// POST /api/practice/submit — persist the answered questions for a session.
export interface SubmitPracticePayload {
  session_id: number;
  hsk_level: number | string | null;
  lesson: string | number | null;
  answers: PracticeAnswerRow[];
}

export function submitPractice(
  payload: SubmitPracticePayload
): Promise<{ status: string }> {
  return legacyApiFetch(`/api/practice/submit`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// GET /api/practice/history — the profile page's review panel: the current
// user's past sessions, with backend level/category/date filters + paging.
export function getPracticeHistory(
  filters: ReviewHistoryFilters
): Promise<ReviewHistoryResponse> {
  const qs = new URLSearchParams({
    level: filters.level,
    category: filters.category,
    sort: filters.sort,
    page: String(filters.page),
  });
  if (filters.date) qs.set("date", filters.date);
  return legacyApiFetch(`/api/practice/history?${qs.toString()}`);
}

// GET /api/practice/history/<id> — every answered question in one session,
// with the user's own answer vs the correct one (read-only review).
export function getPracticeHistoryDetail(
  sessionId: number
): Promise<ReviewSessionDetail> {
  return legacyApiFetch(`/api/practice/history/${sessionId}`);
}
