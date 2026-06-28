// lib/types.ts
// Shared TypeScript interfaces mirroring Flask API response shapes

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

export const HSK_LEVELS = ["HSK1", "HSK2", "HSK3", "HSK4", "HSK5", "HSK6"] as const;
export type HskLevel = (typeof HSK_LEVELS)[number];
