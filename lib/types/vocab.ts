// lib/types/vocab.ts
// Vocabulary: admin CRUD rows, the learner selection table, and word lookups.
// Mirrors the JSON shapes served by the Flask app in ../../../Learning.

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

// One vocabulary lookup entry for a clicked Lesson Summary word — mirrors the
// GET /api/vocab/lookup-batch value shape in Learning's vocab_routes.py.
export interface VocabLookup {
  pinyin: string;
  meaning_vn: string;
  meaning_en: string;
  audio_key: string | null;
}

// word -> lookup; words absent from the lesson vocabulary are simply omitted
// (the popup shows a "not found" state for those).
export type VocabLookupMap = Record<string, VocabLookup>;

export interface LessonVocabRow {
  cn: string;
  pinyin: string;
  meaning_vn: string;
  meaning_en: string;
  audio_key: string;
  hsk_level: string;
}

// ── Learner vocab selection table (the training-selection page) — mirrors the
// normalized rows returned by Learning/web_app/routes/vocab/vocab_routes.py
// (/api/vocab/table, /api/vocab/search) and user_routes.py
// (/api/user/learned-vocab). `word` and `cn` are the same value; `meaning_en`
// is the fallback shown when `meaning_vn` is empty.
export interface VocabRow {
  word: string;
  cn: string;
  pinyin: string;
  meaning_vn: string;
  meaning_en: string;
  audio_key: string;
  level: string;
}

// The table modes offered by the selection page. `recent` is served by a separate
// endpoint (/api/user/learned-vocab); `book` shows the user's saved words for one
// book (mode=book&book_code); the rest share /api/vocab/table.
export type VocabMode = "free" | "standard" | "book" | "unsure" | "unlearn" | "recent";

// A book the user has saved words in — populates the "Book" mode picker
// (GET /api/vocab/saved-books).
export interface SavedBook {
  book_code: string;
  name: string;
}

export interface VocabTableResponse {
  rows: VocabRow[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  // Present only for standard mode with a single selected part; null otherwise.
  passage_id?: string | null;
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
