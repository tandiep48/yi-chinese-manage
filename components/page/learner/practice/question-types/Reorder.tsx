"use client";

// components/page/learner/practice/question-types/Reorder.tsx
// Type 4. Chips move between a pool and the answer row by clicking. The shuffle
// order is computed once when the session loads (never during render) so the
// component stays pure.

import { hanNodes } from "@/lib/han/hanText";
import { answersMatch } from "@/lib/practice/practiceEngine";
import type { GroupUIState } from "@/lib/practice/groupState";
import type { PracticeQuestion } from "@/lib/types/practice";
import type { TFn } from "./types";

export function Reorder({
  q,
  blockId,
  state,
  onToggle,
  level,
  t,
}: {
  q: PracticeQuestion;
  blockId: string;
  state: GroupUIState;
  onToggle: (blockId: string, key: string) => void;
  level: number | string;
  t: TFn;
}) {
  const order = state.chipOrder[blockId] || [];
  const shuffle = state.chipShuffle[blockId] || Object.keys(q.options || {});
  const inAnswer = new Set(order);
  const isCorrect = answersMatch(state.userAnswers[blockId], q.answer);
  const chipClass = (base: string) =>
    state.checked ? `${base} ${isCorrect ? "correct-chip" : "wrong-chip"}` : base;
  const opts = q.options as Record<string, string>;

  return (
    <div className="reorder-area">
      <div className="reorder-label">{t("practice.your_order")}</div>
      <div className="chip-answer">
        {order.map((key) => (
          <div
            key={key}
            className={chipClass("chip in-answer")}
            onClick={() => !state.checked && onToggle(blockId, key)}
          >
            <span className="chip-key">{key}</span> {hanNodes(opts[key], level)}
          </div>
        ))}
      </div>
      <div className="reorder-label">{t("practice.sentences_click_add")}</div>
      <div className="chip-pool">
        {shuffle
          .filter((key) => !inAnswer.has(key))
          .map((key) => (
            <div
              key={key}
              className={chipClass("chip")}
              onClick={() => !state.checked && onToggle(blockId, key)}
            >
              <span className="chip-key">{key}</span> {hanNodes(opts[key], level)}
            </div>
          ))}
      </div>
    </div>
  );
}
