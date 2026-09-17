"use client";

// components/page/learner/practice/question-types/T5ReadingMatchGroup.tsx
// Type 5, reading. Two variants share this layout and differ only in what the
// shared pool shows: pictures (imageMode) or lettered sentences. The rows are
// sentences rather than audio clips; in text mode they may carry a blank.

import { useT } from "@/components/i18n/I18nProvider";
import { hanNodes } from "@/lib/han/hanText";
import { practiceImageUrl } from "@/lib/gcs";
import { answersMatch } from "@/lib/practice/practiceEngine";
import { BlankedContent } from "./BlankedContent";
import { GroupFeedback } from "./Feedback";
import { KeyButtons } from "./KeyButtons";
import type { GroupProps } from "./types";

export function T5ReadingMatchGroup({
  group,
  state,
  category,
  onSelectKey,
  imageMode,
}: GroupProps & { imageMode: boolean }) {
  const { t } = useT();
  const q0 = group.questions[0];
  const opts = q0.options || {};
  const optKeys = Object.keys(opts);
  const level = q0.level;
  const correctCount = group.questions.filter((q, i) => answersMatch(state.userAnswers[`q-${i}`], q.answer)).length;
  return (
    <>
      {imageMode ? (
        <>
          <div className="t5l-images-row t5ri-images-row">
            {Object.entries(opts).map(([key, filename]) => (
              <div key={key} className="t5l-img-col t5ri-img-col">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="t5l-img t5ri-img" src={practiceImageUrl(q0.level, String(filename), category)} alt={key} />
                <div className="t5l-img-label t5ri-img-label">{key}</div>
              </div>
            ))}
          </div>
          <p className="t5l-instruction">{t("practice.choose_image_per_sentence")}</p>
        </>
      ) : (
        <>
          <div className="t5r-options-box">
            {Object.entries(opts).map(([key, text]) => (
              <div key={key} className="t5r-opt-row">
                <span className="t5r-opt-key">{key}.</span>
                <span className="t5r-opt-text">{hanNodes(String(text), level)}</span>
              </div>
            ))}
          </div>
          <p className="t5l-instruction">{t("practice.choose_answer_per_sentence")}</p>
        </>
      )}
      <div className="t5l-rows">
        {group.questions.map((q, idx) => {
          const blockId = `q-${idx}`;
          return (
            <div key={blockId} className={`t5l-audio-row${imageMode ? " t5ri-sentence-row" : ""}`} id={`row-${blockId}`}>
              <div className="t5r-sentence-part">
                <span className="t5l-row-number">{idx + 1}</span>
                <span className="t5r-sentence">
                  {imageMode ? hanNodes(q.content || "", level) : <BlankedContent content={q.content} level={level} />}
                </span>
              </div>
              <KeyButtons q={q} blockId={blockId} optKeys={optKeys} state={state} onSelectKey={onSelectKey} />
            </div>
          );
        })}
      </div>
      <GroupFeedback correctCount={correctCount} total={group.questions.length} checked={state.checked} t={t} />
    </>
  );
}
