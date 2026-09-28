"use client";

// components/page/learner/practice/question-types/SingleGroup.tsx
// The default layout: each question in the group renders standalone, with the
// widget chosen per question by classifyQuestion.

import { useT } from "@/components/i18n/I18nProvider";
import { AudioControl } from "../PracticeAudio";
import { hanNodes } from "@/lib/han/hanText";
import { practiceImageUrl } from "@/lib/gcs";
import {
  classifyQuestion,
  isImageFilename,
  normalizeAnswer,
  answersMatch,
} from "@/lib/practice/practiceEngine";
import { BlankedContent } from "./BlankedContent";
import { Feedback, QNum } from "./Feedback";
import { ImageOptions } from "./ImageOptions";
import { MCOptions } from "./MCOptions";
import { Reorder } from "./Reorder";
import { TrueFalse } from "./TrueFalse";
import type { GroupProps } from "./types";

export function SingleGroup({ group, state, category, onSelectMC, onToggleChip }: GroupProps) {
  const { t } = useT();
  const level = group.questions[0]?.level ?? "";
  const multi = group.questions.length > 1;
  return (
    <>
      {multi && <div className="p-group-header">{t("practice.questions_group", { progress: group.progress })}</div>}
      {group.questions.map((q, idx) => {
        const blockId = `q-${idx}`;
        const kind = classifyQuestion(q);
        const skill = q.skill || "listening";
        const blockCls = ["p-question-block"];
        if (state.checked) {
          blockCls.push(answersMatch(state.userAnswers[blockId], q.answer) ? "correct" : "wrong");
        }
        const chosen = normalizeAnswer(state.userAnswers[blockId]);
        return (
          <div key={blockId} className={blockCls.join(" ")} id={blockId}>
            {multi && <QNum n={idx + 1} t={t} />}
            {/* audio for listening single questions */}
            {skill === "listening" && q.audio_key?.length ? (
              <AudioControl audioKey={q.audio_key[0]} level={q.level} category={category} />
            ) : null}

            {kind === "tf" && (
              <>
                {(() => {
                  const imgFile = q.image || (isImageFilename(q.question) ? q.question : null);
                  const hasAudio = Array.isArray(q.audio_key) && q.audio_key.length > 0;
                  const showText = skill === "reading" || !hasAudio;
                  return (
                    <>
                      {imgFile ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="p-image" src={practiceImageUrl(q.level, String(imgFile), category)} alt="" />
                      ) : null}
                      {showText && q.content && !isImageFilename(q.content) ? (
                        <div className="p-paragraph">{hanNodes(q.content, level)}</div>
                      ) : null}
                      {showText && q.question && !isImageFilename(q.question) ? (
                        <div className="p-question-text p-centered">{hanNodes(q.question, level)}</div>
                      ) : null}
                    </>
                  );
                })()}
                <TrueFalse q={q} blockId={blockId} state={state} onSelect={onSelectMC} t={t} />
              </>
            )}

            {kind === "images" && (
              <>
                {skill === "reading" && q.content ? (
                  <div className="p-paragraph p-centered">{hanNodes(q.content, level)}</div>
                ) : null}
                <ImageOptions q={q} blockId={blockId} state={state} onSelect={onSelectMC} category={category} listening={skill === "listening"} />
              </>
            )}

            {kind === "mc-reading" && (
              <>
                {q.content ? <div className="p-paragraph">{hanNodes(q.content, level)}</div> : null}
                {q.question ? <div className="p-question-text p-centered">{hanNodes(q.question, level)}</div> : null}
                <MCOptions q={q} blockId={blockId} state={state} onSelect={onSelectMC} level={level} />
              </>
            )}

            {kind === "reorder" && (
              <Reorder q={q} blockId={blockId} state={state} onToggle={onToggleChip} level={level} t={t} />
            )}

            {kind === "blank-mc" && (
              <>
                <div className="p-paragraph p-centered">
                  <BlankedContent
                    content={q.content}
                    level={level}
                    fills={[chosen ? String((q.options as Record<string, string>)[state.userAnswers[blockId]] ?? "") : null]}
                  />
                </div>
                <MCOptions q={q} blockId={blockId} state={state} onSelect={onSelectMC} level={level} />
              </>
            )}

            {kind === "match" && (
              <>
                {q.content ? <div className="p-paragraph p-centered">{hanNodes(q.content, level)}</div> : null}
                <MCOptions q={q} blockId={blockId} state={state} onSelect={onSelectMC} level={level} />
              </>
            )}

            {kind === "type6-single" && (
              <>
                {q.content ? <div className="p-paragraph">{hanNodes(q.content, level)}</div> : null}
                <MCOptions q={q} blockId={blockId} state={state} onSelect={onSelectMC} level={level} />
              </>
            )}

            <Feedback q={q} chosen={state.userAnswers[blockId] || ""} checked={state.checked} reorder={kind === "reorder"} t={t} />
          </div>
        );
      })}
    </>
  );
}
