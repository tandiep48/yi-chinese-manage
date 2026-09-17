"use client";

// components/page/learner/practice/question-types/ImageOptions.tsx
// Types 3 and 5: a grid of picture choices. The listening variant gets an extra
// class because the legacy CSS sizes those tiles differently.

import { practiceImageUrl } from "@/lib/gcs";
import { normalizeAnswer } from "@/lib/practice/practiceEngine";
import type { GroupUIState } from "@/hooks/usePracticeEngine";
import type { PracticeCategory, PracticeQuestion } from "@/lib/types/types";

export function ImageOptions({
  q,
  blockId,
  state,
  onSelect,
  category,
  listening,
}: {
  q: PracticeQuestion;
  blockId: string;
  state: GroupUIState;
  onSelect: (blockId: string, key: string) => void;
  category: PracticeCategory;
  listening: boolean;
}) {
  const chosen = normalizeAnswer(state.userAnswers[blockId]);
  const correct = normalizeAnswer(q.answer);
  return (
    <div className={`img-options-grid${listening ? " listening-img-options-grid" : ""}`}>
      {Object.entries(q.options || {}).map(([key, filename]) => {
        const selected = state.userAnswers[blockId] === key;
        const cls = ["img-option"];
        if (selected) cls.push("selected");
        if (state.checked) {
          cls.push("disabled");
          if (normalizeAnswer(key) === correct) cls.push("correct-ans");
          else if (normalizeAnswer(key) === chosen) cls.push("wrong-ans");
        }
        return (
          <div
            key={key}
            className={cls.join(" ")}
            onClick={() => !state.checked && onSelect(blockId, key)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={practiceImageUrl(q.level, String(filename), category)} alt={key} />
            <div className="img-label">{key}</div>
          </div>
        );
      })}
    </div>
  );
}
