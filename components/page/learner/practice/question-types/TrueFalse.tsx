"use client";

// components/page/learner/practice/question-types/TrueFalse.tsx
// Type 1. The options map carries booleans (or their string spellings) for the
// true/false pair; anything else falls back to showing "key: value".

import { normalizeAnswer } from "@/lib/practice/practiceEngine";
import type { GroupUIState } from "@/hooks/usePracticeEngine";
import type { PracticeQuestion } from "@/lib/types/practice";
import type { TFn } from "./types";

export function TrueFalse({
  q,
  blockId,
  state,
  onSelect,
  t,
}: {
  q: PracticeQuestion;
  blockId: string;
  state: GroupUIState;
  onSelect: (blockId: string, key: string) => void;
  t: TFn;
}) {
  const chosen = normalizeAnswer(state.userAnswers[blockId]);
  const correct = normalizeAnswer(q.answer);
  return (
    <div className="tf-buttons">
      {Object.entries(q.options || {}).map(([key, val]) => {
        const label =
          val === true || val === "True"
            ? t("practice.true_label")
            : val === false || val === "False"
              ? t("practice.false_label")
              : `${key}: ${val}`;
        const selected = state.userAnswers[blockId] === key;
        const cls = ["tf-btn"];
        if (selected) cls.push("selected");
        if (state.checked) {
          if (normalizeAnswer(key) === correct) cls.push("correct-ans");
          else if (normalizeAnswer(key) === chosen) cls.push("wrong-ans");
        }
        return (
          <button
            key={key}
            type="button"
            className={cls.join(" ")}
            disabled={state.checked}
            onClick={() => onSelect(blockId, key)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
