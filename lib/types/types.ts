// lib/types/types.ts
// Shared TypeScript interfaces mirroring Flask API response shapes
import { TYPE_CONSTANTS } from "./constants";

export interface Vocab {
  id: number;
  cn: string;
  pinyin: string | null;
  meaning_en: string | null;
  meaning_vn: string | null;
  audio_key: string | null;
  hsk_level: string | null;
  source: string | null;
}

export interface LessonLine {
  id: number;
  passage_id: string;
  line_id: number | null;
  speaker: string | null;
  content: string | null;
  pinyin: string | null;
  audio_key: string | null;
  translation_en: string | null;
  translation_vi: string | null;
  tokens: unknown[];
}

export interface LessonPassage {
  passage_id: string;
  hsk_level: string | null;
  lines?: LessonLine[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  level: number | null;
}

// The logged-in learner's session user — returned by /api/auth/*.
// Superset of the admin User shape above (profile/preference fields the
// admin CRUD table doesn't need).
export interface AuthUser {
  id: number;
  username: string;
  email: string;
  level: number | null;
  avatar_path: string | null;
  avatar_url: string | null;
  hanzi_font: string | null;
  hanzi_script: string | null;
  ui_language: string | null;
}

export interface Question {
  id: number;
  level: number;
  category: string;
  lesson: number;
  no: number;
  skill: string | null;
  type: number;
  content: string | null;
  question: string | null;
  answer: string | null;
  audio_key: string | null;
  image: string | null;
  options: Record<string, unknown> | null;
  progress: string;
  unit_id: string;
}

export interface GrammarRule {
  id: number;
  grammar_id: string;
  type: number | null;
  passage_number: number | null;
  vietnamese_content: string | null;
  english_content: string | null;
}

export interface GrammarContext {
  id: number;
  grammar_id: string;
  content_json: Record<string, unknown> | unknown[] | null;
}

export interface Book {
  book_code: string;
  name_en: string | null;
  name_vn: string | null;
}

// ── Learner dashboard — mirrors the raw (non-enveloped) JSON shapes from
// Learning/web_app/routes/user/user_routes.py and routes/practice/practice_routes.py.
export interface DashboardLesson {
  passage_id: string;
  hsk_level: string;
  level: number;
  lesson: number;
  part: number;
  passage_ids: string[];
  updated_at: string | null;
}

export interface DashboardCurrentLesson {
  has_recent: boolean;
  lesson?: DashboardLesson;
}

export interface GlobalStatsBucket {
  questions: number;
  time_ms: number;
  time_label: string;
}

export interface GlobalStats {
  total_time_ms: number;
  total_time_label: string;
  total_words: number;
  buckets: {
    exercise: GlobalStatsBucket;
    exam: GlobalStatsBucket;
    lesson_trainer: GlobalStatsBucket;
    vocab_trainer: GlobalStatsBucket;
  };
}

export interface LearnedWordsDay {
  date: string;
  count: number;
}

export interface TimeLearnedDay {
  date: string;
  ms: number;
  minutes: number;
}

export type RecommendStatus = "Not start" | "Finish and success" | "Finish and fail";

export interface RecommendedPractice {
  level: number;
  lesson: number;
  progress: string;
  skill: string | null;
  type: number;
  category: string;
  unit_ids: string[];
  total_words: number;
  known_words: number;
  coverage_pct: number;
  matched_words: string[];
  recent_matched_words: string[];
  newest_learned_at: string | null;
  recent_score: number;
  status: RecommendStatus;
  question_count: number;
}

// ── Lesson picker (HSK level → lesson → part) — mirrors the raw JSON shapes
// from Learning/web_app/routes/lesson/lesson_routes.py.
export interface PickerPassage {
  passage_id: string;
  hsk_level: string;
  line_count?: number;
  title?: string | null;
}

export interface PickerProgressEntry {
  total_words: number;
  learned_words: number;
  lesson_learned: number;
  lesson_total: number;
  progress_pct: number;
}

export interface PickerProgressSummary {
  lessons: Record<string, PickerProgressEntry>;
  parts: Record<string, PickerProgressEntry>;
}

// ── Learner Books browsing (Books tab of the learning page) — mirrors the raw
// JSON shapes from Learning/web_app/routes/lesson/lesson_routes.py's
// GET /api/lesson/books and GET /api/lesson/book/<code>.
export interface LearnerBookSummary {
  book_code: string;
  name?: string | null;
  cover_url: string;
  lesson_count: number;
  part_count: number;
  done_count: number;
}

export interface LearnerBookPart {
  part: string | number;
  passage_id: string;
  completed?: boolean;
}

export interface LearnerBookLesson {
  lesson: string | number;
  title?: string | null;
  part_count: number;
  done_count: number;
  parts: LearnerBookPart[];
}

export interface LearnerBookDetail {
  book_code: string;
  book_name?: string | null;
  lessons: LearnerBookLesson[];
}

// ── Recent learning (the "Continue where you left off" panel) — mirrors
// GET/POST /api/user/recent-learning.
export interface RecentLearning {
  passage_id: string;
}

// ── Lesson overview (passage content + linked vocab for one part) — mirrors
// the raw JSON shapes from Learning/web_app/routes/lesson/lesson_routes.py's
// GET /passage/<id> and GET /vocab/<id>. Distinct from LessonLine/LessonPassage
// above, which mirror the admin CRUD passage-editor shape instead.
export interface LessonPassageLine {
  line_id: number;
  speaker: string | null;
  content: string | null;
  pinyin: string | null;
  audio_key: string | null;
  translations: { en: string | null; vi: string | null };
  tokens: unknown[];
  flag: number;
}

export interface LessonPassageDetail {
  passage_id: string;
  hsk_level: string | null;
  book_code?: string | null;
  lines: LessonPassageLine[];
  title?: string;
}

export interface LessonVocabRow {
  cn: string;
  pinyin: string;
  meaning_vn: string;
  meaning_en: string;
  audio_key: string;
  hsk_level: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface ApiError {
  error: string;
}

// Form data shapes (partial — all fields optional except required ones)
export type VocabFormData = {
  cn: string;
  pinyin?: string;
  meaning_en?: string;
  meaning_vn?: string;
  audio_key?: string;
  hsk_level?: string;
  source?: string;
};

export type BookFormData = {
  book_code: string;
  name_en?: string;
  name_vn?: string;
};

export type LineFormData = {
  line_id?: number;
  speaker?: string;
  content?: string;
  pinyin?: string;
  audio_key?: string;
  translation_en?: string;
  translation_vi?: string;
  tokens?: unknown[];
};

export type PassageFormData = {
  passage_id: string;
  hsk_level?: string;
  lines?: LineFormData[];
};

export type UserFormData = {
  username: string;
  email: string;
  password?: string;
  level?: number;
};

export type QuestionFormData = {
  category: string;
  level: number;
  lesson: number;
  no: number;
  type: number;
  progress: string;
  skill?: string | null;
  content?: string | null;
  question?: string | null;
  answer?: string | null;
  audio_key?: string | null;
  image?: string | null;
  options?: Record<string, unknown> | null;
  unit_id?: string;
};

export type GrammarRuleFormData = {
  grammar_id: string;
  type?: number | null;
  passage_number?: number | null;
  vietnamese_content?: string | null;
  english_content?: string | null;
};

export type GrammarContextFormData = {
  grammar_id: string;
  content_json?: Record<string, unknown> | unknown[] | null;
};

export const HSK_LEVELS = TYPE_CONSTANTS.HSK_LEVELS;
export type HskLevel = (typeof HSK_LEVELS)[number];

export const QUESTION_CATEGORIES = TYPE_CONSTANTS.QUESTION_CATEGORIES;
export const QUESTION_SKILLS = TYPE_CONSTANTS.QUESTION_SKILLS;

export const GRAMMAR_TYPES = TYPE_CONSTANTS.GRAMMAR_TYPES;
export type GrammarType = (typeof GRAMMAR_TYPES)[number];
