// lib/review/reviewLogic.ts
// Pure helpers for the profile page's review panel, ported from the DOM logic in
// Learning/web_app/static/review/review.js. Kept framework-free and unit-tested;
// the React components render from these.

import type { ReviewQuestion, ReviewSessionSummary } from "@/lib/types/types";

// Split a stored answer / user_answer into comparable tokens (comma, Chinese
// enumeration comma, or whitespace separated). Mirrors answerTokens().
export function answerTokens(raw: string | null | undefined): Set<string> {
  if (raw === null || raw === undefined) return new Set();
  return new Set(
    String(raw)
      .split(/[,、\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

// True when a value looks like an image reference — a real image extension, or
// the "12.3" / "12.3a" numeric-id form the question bank uses. Mirrors
// isImageFilename().
export function isImageFilename(val: unknown): boolean {
  if (typeof val !== "string") return false;
  const v = val.trim();
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(v) || /^\d+\.\d+[a-zA-Z]*$/.test(v);
}

// The CSS state of one answer option, from the correct-answer set and the
// user's answer set (mirrors optionRow()'s class logic).
export interface OptionState {
  isCorrect: boolean;
  isUser: boolean;
  className: string;
}

export function optionState(
  key: string,
  correctSet: Set<string>,
  userSet: Set<string>
): OptionState {
  const isCorrect = correctSet.has(key);
  const isUser = userSet.has(key);
  let className = "q-option";
  if (isCorrect) className += " opt-correct";
  if (isUser && !isCorrect) className += " opt-user-wrong";
  if (isUser && isCorrect) className += " opt-user-correct";
  return { isCorrect, isUser, className };
}

export type ResultFilter = "all" | "correct" | "incorrect";
export type SkillFilter = "all" | "reading" | "listening";

// Filter the detail question list while preserving each question's original
// 1-based number (the legacy list keeps numbering stable across filters).
export function filterReviewQuestions(
  questions: ReviewQuestion[],
  result: ResultFilter,
  skill: SkillFilter
): { question: ReviewQuestion; number: number }[] {
  return questions
    .map((question, i) => ({ question, number: i + 1 }))
    .filter(({ question: q }) => {
      if (result === "correct" && !q.is_correct) return false;
      if (result === "incorrect" && q.is_correct) return false;
      if (skill !== "all" && (q.skill || "listening") !== skill) return false;
      return true;
    });
}

// The session-card title: the HSK levels it touched, plus its lessons. Returns
// the pieces so the component can localise the "Lesson" prefix.
export function sessionCardLevels(s: ReviewSessionSummary): string {
  return (s.levels || []).map((l) => `HSK ${l}`).join(", ");
}

export function sessionCardLessons(s: ReviewSessionSummary): string {
  return (s.lessons || []).join(", ");
}

// The image file to show for a question: an explicit image column, or the
// question field when it is itself an image reference (mirrors questionCard()).
export function questionImageFile(q: ReviewQuestion): string | null {
  if (q.image) return q.image;
  if (isImageFilename(q.question)) return q.question as string;
  return null;
}
