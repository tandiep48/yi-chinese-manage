// lib/lessons/lessonTrainer.ts
// Pure helpers for the lesson trainer, ported verbatim from
// Learning/web_app/static/lesson/lesson.js: answer normalization (punctuation is
// optional when typing, full/half-width unified), the token-wise reorder check, the
// per-task audio URL, and the skill filter. Split out from the React components so
// they can be unit-tested.

import { lessonAudioUrl } from "@/lib/audio";
import type { LessonTask, LessonTaskType } from "@/lib/types/types";

// Time a correct multiple-choice answer stays on screen before advancing — matches
// the 3s delay in lesson.js checkAnswer() (typing/reorder instead wait for audio).
export const MC_CORRECT_DELAY_MS = 3000;

// Reorder / typing answers can mix full-width & half-width punctuation, ideographic
// punctuation (。、《》「」), and stray whitespace between tokens. Punctuation is
// optional when typing, so both sides are normalized the same way: unify width via
// NFKC, strip all CJK and ASCII punctuation, then drop every space / zero-width char.
export function normalizeAnswer(value: string | null | undefined): string {
  if (value == null) return "";
  return String(value)
    .normalize("NFKC")
    .replace(/[、。｡，？！；：【】《》「」『』“”‘’～—–…‧·・.,?!;:'"()[\]<>~\-]/g, "")
    .replace(/[\s​‌‍﻿]/g, "");
}

export function answersMatch(a: string, b: string): boolean {
  return normalizeAnswer(a) === normalizeAnswer(b);
}

// Compare token-by-token in order (robust for long sentences / astral characters):
// same length, and each chip normalizes equal to the expected token at that position.
export function reorderMatches(userTokens: string[], correctTokens: string[]): boolean {
  if (!Array.isArray(userTokens) || !Array.isArray(correctTokens)) return false;
  if (userTokens.length !== correctTokens.length) return false;
  return correctTokens.every((token, i) => normalizeAnswer(userTokens[i]) === normalizeAnswer(token));
}

// The lesson-audio folder for a task: book code (book lessons) or the normalized HSK
// level (e.g. "H2"/"2" -> "HSK2"). Mirrors audioSrc() in lesson.js.
export function lessonTaskAudioUrl(task: Pick<LessonTask, "audio_key" | "book_code" | "hsk_level">): string | null {
  if (!task.audio_key) return null;
  if (task.book_code) return lessonAudioUrl(task.book_code, task.audio_key);
  const raw = String(task.hsk_level || "HSK1");
  const folder = /^hsk/i.test(raw) ? raw.toUpperCase() : `HSK${raw.replace(/^h/i, "")}`;
  return lessonAudioUrl(folder, task.audio_key);
}

// Restrict a session's tasks to the skills the learner picked in the train-type
// picker. Absent/empty selection means train every skill. Mirrors the filter in
// lesson.js startSession().
export function filterTasksByType(
  tasks: LessonTask[],
  selected: LessonTaskType[] | null | undefined
): LessonTask[] {
  if (!selected || !selected.length) return tasks;
  const allowed = new Set(selected);
  return tasks.filter((task) => allowed.has(task.type));
}
