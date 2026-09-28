// lib/types/practice.ts
// Practice / Exam: the session the learner is served, the answers posted
// back, and the read-only review history built from them.
// Mirrors the JSON shapes served by the Flask app in ../../../Learning.

// ── Practice / Exam (learner) ────────────────────────────────────────────────
// Mirrors the rows returned by Learning/web_app/routes/practice/practice_routes.py
// (raw JSON, login-required). `category` is "practice" (Exercise) or "exam".
export type PracticeCategory = "practice" | "exam";

export interface PracticeQuestion {
  level: number;
  lesson: string | number;
  no: number;
  skill: string; // "listening" | "reading" (defaulted to "listening" by the API)
  type: number; // 1..6
  content: string | null;
  question: string | null;
  answer: string;
  audio_key: string[];
  image: string | null;
  // Values are strings, or booleans for True/False (type 1) questions.
  options: Record<string, string | boolean>;
  progress: string;
  category: PracticeCategory;
  unit_id?: string;
}

export interface PracticeGroup {
  progress: string;
  lesson: string | number;
  category?: PracticeCategory;
  questions: PracticeQuestion[];
}

export interface PracticeSessionData {
  number?: number | string;
  level?: number | string;
  lesson?: string | number;
  total_groups?: number;
  groups: PracticeGroup[];
}

// One row of the /api/practice/submit payload.
export interface PracticeAnswerRow {
  hsk_level: number;
  lesson: string | number;
  question_no: number;
  skill: string;
  type: number;
  category: PracticeCategory;
  user_answer: string;
  is_correct: boolean;
  response_time_ms: number;
}

// One item in the multi-select queue (recommend → /practice/multi).
export interface PracticeMultiItem {
  level: number;
  lesson: string | number;
  progress: string;
  category?: PracticeCategory;
  unit_ids?: string[];
}

// One past practice/exam session, from GET /api/practice/history.
export interface ReviewSessionSummary {
  session_id: number;
  ended_at: string | null;
  total: number;
  correct: number;
  score_pct: number;
  levels: number[];
  lessons: string[];
  categories: string[];
}

export interface ReviewHistoryResponse {
  sessions: ReviewSessionSummary[];
  page: number;
  has_more: boolean;
}

// One answered question in a session, from GET /api/practice/history/<id>.
// Same shape as a PracticeQuestion plus the user's own answer + result.
export interface ReviewQuestion extends PracticeQuestion {
  user_answer: string | null;
  is_correct: boolean;
  answered_at: string | null;
}

export interface ReviewSessionDetail {
  session_id: number;
  total: number;
  correct: number;
  score_pct: number;
  questions: ReviewQuestion[];
}

// Backend filters for the session list (all optional; "all" = no filter).
export interface ReviewHistoryFilters {
  level: string; // "all" | "1".."6"
  category: string; // "all" | "practice" | "exam"
  sort: "recent" | "oldest";
  page: number;
}
