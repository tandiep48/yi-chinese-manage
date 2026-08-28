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
