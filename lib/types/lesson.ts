// lib/types/lesson.ts
// Lessons: admin passage editing, the learner picker, passage content,
// the graded trainer tasks, lesson grammar and translation rows.
// Mirrors the JSON shapes served by the Flask app in ../../../Learning.

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
  // Word segmentation for the clickable Lesson Summary tokens; [] when the line
  // wasn't tokenised (renderTokens then falls back to the raw content).
  tokens: string[];
  flag: number;
}

export interface LessonPassageDetail {
  passage_id: string;
  hsk_level: string | null;
  book_code?: string | null;
  lines: LessonPassageLine[];
  title?: string;
}

// ── Lesson trainer task — one graded activity built by the server, mirroring
// build_lesson_tasks() in Learning/web_app/service/lesson_task_service.py and
// returned by POST /api/lesson/start. `type` selects the activity: listening /
// meaning are multiple-choice, typing types the sentence, reorder arranges chips.
export type LessonTaskType = "listening" | "meaning" | "typing" | "reorder";

export interface LessonTask {
  type: LessonTaskType;
  passage_id: string;
  line_id: number;
  content: string; // the Chinese sentence (shown, typed, or revealed)
  correct_answer: string;
  options?: string[]; // listening / meaning
  tokens?: string[]; // reorder: correct order
  shuffled_tokens?: string[]; // reorder: presented order
  pinyin?: string; // typing: revealed after answering
  audio_key?: string | null;
  hsk_level?: string | null;
  book_code?: string | null;
}

export interface LessonSessionResponse {
  session_id: number;
  tasks: LessonTask[];
}

// ── Lesson grammar (lesson-wide grammar rules) — mirrors the raw JSON from
// Learning/web_app/routes/lesson/lesson_routes.py GET /grammar/<passage_id>
// (entity/grammar_rule/service.py get_grammar_for_lesson). The flat list is
// id-ordered; the UI splits it into sections at each type=1 (section-title) row.
// type: 1 title · 2 description · 3 example (cn~vn) · 4 table/ref · 5 dialogue (cn~vn).
// Distinct from the admin CRUD `GrammarRule` above (different endpoint/shape).
export interface LessonGrammarRule {
  grammar_id: string;
  type: number;
  vietnamese_content?: string | null;
  english_content?: string | null;
  vn_context?: Array<Record<string, string>> | null;
  en_context?: Array<Record<string, string>> | null;
}

// ── Lesson translation (lesson-wide sentence list) — mirrors the raw JSON from
// Learning/web_app/routes/translation/translation_routes.py GET /lesson.
export interface TranslationRow {
  translation_id: string;
  cn: string;
  vn?: string | null;
  en?: string | null;
}

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
