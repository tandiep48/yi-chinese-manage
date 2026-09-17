"use client";

// components/page/learner/practice/question-types/MCOptions.tsx
// The lettered multiple-choice list. After a check it marks the correct option
// and, if the learner picked a different one, their wrong pick.

import { hanNodes } from "@/lib/han/hanText";
import { normalizeAnswer } from "@/lib/practice/practiceEngine";
import type { GroupUIState } from "@/hooks/usePracticeEngine";
import type { PracticeQuestion } from "@/lib/types/practice";

export function MCOptions({
  q,
  blockId,
  state,
  onSelect,
  level,
}: {
  q: PracticeQuestion;
  blockId: string;
  state: GroupUIState;
  onSelect: (blockId: string, key: string) => void;
  level: number | string;
}) {
  const chosen = normalizeAnswer(state.userAnswers[blockId]);
  const correct = normalizeAnswer(q.answer);
  return (
    <div className="mc-options">
      {Object.entries(q.options || {}).map(([key, text]) => {
        const selected = state.userAnswers[blockId] === key;
        const cls = ["mc-option"];
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
            <span className="opt-key">{key}</span>
            <span>{hanNodes(String(text), level)}</span>
          </button>
        );
      })}
    </div>
  );
}
