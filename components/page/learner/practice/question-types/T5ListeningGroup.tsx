"use client";

// components/page/learner/practice/question-types/T5ListeningGroup.tsx
// Type 5, listening: one shared option pool (usually pictures) across the top
// and a row of numbered audio clips, each matched to one unused option key.

import { useT } from "@/components/i18n/I18nProvider";
import { AudioControl } from "../PracticeAudio";
import { practiceImageUrl } from "@/lib/gcs";
import { allOptionsAreImages, answersMatch } from "@/lib/practice/practiceEngine";
import { GroupFeedback } from "./Feedback";
import { KeyButtons } from "./KeyButtons";
import type { GroupProps } from "./types";

export function T5ListeningGroup({ group, state, category, onSelectKey }: GroupProps) {
  const { t } = useT();
  const q0 = group.questions[0];
  const opts = q0.options || {};
  const optKeys = Object.keys(opts);
  const allImg = allOptionsAreImages(opts);
  const correctCount = group.questions.filter((q, i) => answersMatch(state.userAnswers[`q-${i}`], q.answer)).length;
  return (
    <>
      {allImg && (
        <>
          <div className="t5l-images-row">
            {Object.entries(opts).map(([key, filename]) => (
              <div key={key} className="t5l-img-col">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="t5l-img" src={practiceImageUrl(q0.level, String(filename), category)} alt={key} />
                <div className="t5l-img-label">{key}</div>
              </div>
            ))}
          </div>
          <p className="t5l-instruction">{t("practice.choose_image_for_audio")}</p>
        </>
      )}
      <div className="t5l-rows">
        {group.questions.map((q, idx) => {
          const blockId = `q-${idx}`;
          return (
            <div key={blockId} className="t5l-audio-row" id={`row-${blockId}`}>
              <div className="t5l-audio-part">
                <span className="t5l-row-number">{idx + 1}</span>
                {q.audio_key?.length ? (
                  <AudioControl audioKey={q.audio_key[0]} level={q.level} category={category} label={t("practice.audio_numbered", { n: idx + 1 })} />
                ) : null}
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
