// lib/practice/practiceEngine.ts
// Pure logic for the practice/exam engine, extracted from
// Learning/web_app/static/practice/practice_engine.js so it can be unit-tested
// and shared by the sidebar and bottom-nav shells. No DOM, no React — the hook
// (hooks/usePracticeEngine.ts) and components own state and rendering.

import type { PracticeAnswerRow, PracticeGroup, PracticeQuestion } from "@/lib/types/practice";

// ── Answer normalisation / comparison ────────────────────────────────────────
// The engine compares chosen vs. correct case-insensitively, trimmed.
export function normalizeAnswer(value: unknown): string {
  return String(value ?? "").trim().toUpperCase();
}

export function answersMatch(chosen: unknown, correct: unknown): boolean {
  return normalizeAnswer(chosen) === normalizeAnswer(correct);
}

// ── Option-value inspection ──────────────────────────────────────────────────
// isImageFilename: a filename ("a.jpg") or a numeric asset id ("3.12b").
export function isImageFilename(val: unknown): boolean {
  if (typeof val !== "string") return false;
  const v = val.trim();
  if (/\.(jpg|jpeg|png|gif|webp)$/i.test(v)) return true;
  if (/^\d+\.\d+[a-zA-Z]*$/.test(v)) return true;
  return false;
}

export function allOptionsAreImages(
  options: Record<string, string | boolean> | null | undefined
): boolean {
  const vals = Object.values(options || {});
  if (vals.length === 0) return false;
  return vals.every((v) => isImageFilename(String(v)));
}

// ── Blank detection / tokenisation ───────────────────────────────────────────
// Detect any kind of blank: （ ）,（）, ( ), () — and numbered "（24）____" blanks.
const BLANK_TEST_RE = /[（(][\s\d]*[）)][\s_]*_*|[（(]\s*[）)]/;
// The global variant used to split content into segments (matches "____" runs).
const BLANK_SPLIT_RE = /[（(][\s\d]*[）)][\s_]*_+|[（(]\s*[）)]/g;

export function hasBlank(content: string | null | undefined): boolean {
  if (!content) return false;
  return BLANK_TEST_RE.test(content);
}

export type ContentSegment =
  | { kind: "text"; text: string }
  | { kind: "blank"; index: number };

// Split content into ordered text/blank segments so blanks can be rendered as
// interactive React nodes (the DOM engine used replaceAllBlanks + innerHTML).
export function tokenizeContent(content: string | null | undefined): ContentSegment[] {
  const segments: ContentSegment[] = [];
  if (!content) return segments;
  let lastIndex = 0;
  let blankIndex = 0;
  // Reset lastIndex — module-level global regex is stateful.
  BLANK_SPLIT_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = BLANK_SPLIT_RE.exec(content)) !== null) {
    if (m.index > lastIndex) {
      segments.push({ kind: "text", text: content.slice(lastIndex, m.index) });
    }
    segments.push({ kind: "blank", index: blankIndex++ });
    lastIndex = m.index + m[0].length;
    // Guard against zero-length matches (shouldn't happen, but keep it safe).
    if (m[0].length === 0) BLANK_SPLIT_RE.lastIndex++;
  }
  if (lastIndex < content.length) {
    segments.push({ kind: "text", text: content.slice(lastIndex) });
  }
  return segments;
}

// Count blanks in a piece of content (for type-6 fill validation).
export function countBlanks(content: string | null | undefined): number {
  return tokenizeContent(content).filter((s) => s.kind === "blank").length;
}

// ── Group / question layout classification ───────────────────────────────────
// Mirrors buildGroupContent()'s branching exactly.
export type GroupLayout =
  | "type2"
  | "t5-listening"
  | "t5-reading-match"
  | "t5-reading-image"
  | "type6-group"
  | "single";

export function classifyGroupLayout(group: PracticeGroup): GroupLayout {
  const q0 = group.questions[0];
  const skill = q0?.skill || "listening";
  const type = q0?.type;
  const isListening = skill === "listening";
  const multi = group.questions.length > 1;

  if (type === 2) return "type2";
  if (type === 5 && isListening && multi) return "t5-listening";
  if (type === 5 && !isListening && multi) {
    return allOptionsAreImages(q0?.options) ? "t5-reading-image" : "t5-reading-match";
  }
  if (type === 6) return "type6-group";
  return "single";
}

// The single-question renderer dispatch (renderQuestion()).
export type QuestionKind =
  | "tf" // type 1
  | "images" // type 3 or 5 with image options
  | "mc-reading" // type 3 non-image
  | "reorder" // type 4
  | "blank-mc" // type 5 fill-in-blank
  | "match" // type 5 text-match
  | "type6-single";

export function classifyQuestion(q: PracticeQuestion): QuestionKind {
  const type = q.type;
  const allImg = allOptionsAreImages(q.options);
  if (type === 1) return "tf";
  if (type === 3) return allImg ? "images" : "mc-reading";
  if (type === 4) return "reorder";
  if (type === 5) {
    if (allImg) return "images";
    if (hasBlank(q.content)) return "blank-mc";
    return "match";
  }
  // type 6 (single); other types fall through to a plain MC via type6-single path.
  return "type6-single";
}

// ── Scoring ──────────────────────────────────────────────────────────────────
export interface GroupScore {
  correct: number;
  total: number;
  perQuestion: boolean[]; // is-correct per sub-question, in order
}

// userAnswers is keyed by blockId "q-<idx>".
export function scoreGroup(
  group: PracticeGroup,
  userAnswers: Record<string, string>
): GroupScore {
  let correct = 0;
  const perQuestion = group.questions.map((q, idx) => {
    const ok = answersMatch(userAnswers[`q-${idx}`], q.answer);
    if (ok) correct++;
    return ok;
  });
  return { correct, total: group.questions.length, perQuestion };
}

// Build the /api/practice/submit rows for one checked group.
export function buildAnswerRows(
  group: PracticeGroup,
  userAnswers: Record<string, string>,
  perQuestionTimeMs: number,
  defaultCategory: "practice" | "exam"
): PracticeAnswerRow[] {
  return group.questions.map((q, idx) => {
    const chosen = normalizeAnswer(userAnswers[`q-${idx}`]);
    return {
      hsk_level: q.level,
      lesson: q.lesson,
      question_no: q.no,
      skill: q.skill || "listening",
      type: q.type,
      category: q.category || defaultCategory,
      user_answer: chosen,
      is_correct: answersMatch(chosen, q.answer),
      response_time_ms: perQuestionTimeMs,
    };
  });
}

// ── Navigation helpers (operate on the checked[] flags) ───────────────────────
export function firstUncheckedAfter(checked: boolean[], idx: number): number {
  for (let i = idx + 1; i < checked.length; i++) if (!checked[i]) return i;
  return -1;
}

export function allChecked(checked: boolean[]): boolean {
  return checked.length > 0 && checked.every(Boolean);
}

// ── Result screen icon tier ──────────────────────────────────────────────────
export function resultIcon(pct: number): string {
  if (pct >= 0.9) return "fa-trophy";
  if (pct >= 0.7) return "fa-circle-check";
  if (pct >= 0.5) return "fa-chart-line";
  return "fa-rotate-right";
}
