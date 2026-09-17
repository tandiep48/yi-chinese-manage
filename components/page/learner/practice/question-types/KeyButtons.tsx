"use client";

// components/page/learner/practice/question-types/KeyButtons.tsx
// The per-row option picker used by the t5 grouped layouts. Every row draws
// from one shared option pool, so a key already spent on another row is
// disabled rather than hidden.

import { normalizeAnswer } from "@/lib/practice/practiceEngine";
import type { GroupUIState } from "@/hooks/usePracticeEngine";
import type { PracticeQuestion } from "@/lib/types/types";

export function KeyButtons({
  q,
  blockId,
  optKeys,
  state,
  onSelectKey,
}: {
  q: PracticeQuestion;
  blockId: string;
  optKeys: string[];
  state: GroupUIState;
  onSelectKey: (blockId: string, key: string) => void;
}) {
  const usedKeys = new Set(Object.values(state.userAnswers));
  const chosen = normalizeAnswer(state.userAnswers[blockId]);
  const correct = normalizeAnswer(q.answer);
  return (
    <div className="t5l-opt-part">
      {optKeys.map((key) => {
        const isSelected = state.userAnswers[blockId] === key;
        const usedElsewhere = usedKeys.has(key) && !isSelected;
        const cls = ["t5l-key-btn"];
        if (isSelected) cls.push("selected");
        if (usedElsewhere) cls.push("used-elsewhere");
        if (state.checked) {
          if (normalizeAnswer(key) === correct) cls.push("correct-ans");
          else if (isSelected && chosen !== correct) cls.push("wrong-ans");
        }
        return (
          <button
            key={key}
            type="button"
            className={cls.join(" ")}
            disabled={state.checked || usedElsewhere}
            onClick={() => onSelectKey(blockId, key)}
          >
            {key}
          </button>
        );
      })}
    </div>
  );
}
