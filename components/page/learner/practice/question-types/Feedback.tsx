"use client";

// components/page/learner/practice/question-types/Feedback.tsx
// Post-check result lines. Rendering is derived from state rather than mutated
// in place, so "check" simply re-renders these with the answer revealed.

import { normalizeAnswer } from "@/lib/practice/practiceEngine";
import type { PracticeQuestion } from "@/lib/types/types";
import type { TFn } from "./types";

export function QNum({ n, t }: { n: number; t: TFn }) {
  return <span className="p-qnum">{t("practice.question_number", { n })}</span>;
}

export function Feedback({
  q,
  chosen,
  checked,
  reorder,
  t,
}: {
  q: PracticeQuestion;
  chosen: string;
  checked: boolean;
  reorder?: boolean;
  t: TFn;
}) {
  if (!checked) return null;
  const correct = normalizeAnswer(q.answer);
  const isCorrect = normalizeAnswer(chosen) === correct;
  if (isCorrect) {
    return <div className="p-feedback correct">{t("practice.correct_exclaim")}</div>;
  }
  if (reorder) {
    return <div className="p-feedback wrong">{t("practice.correct_order", { order: correct })}</div>;
  }
  return (
    <div className="p-feedback wrong">{t("practice.correct_answer_colon", { answer: correct })}</div>
  );
}

// Whole-group score line, used by the t5 layouts where each row is graded
// together rather than per question.
export function GroupFeedback({
  correctCount,
  total,
  checked,
  t,
}: {
  correctCount: number;
  total: number;
  checked: boolean;
  t: TFn;
}) {
  if (!checked) return null;
  const cls = correctCount === total ? "p-feedback correct" : "p-feedback wrong";
  return <div className={cls}>{t("practice.score_correct", { correct: correctCount, total })}</div>;
}
