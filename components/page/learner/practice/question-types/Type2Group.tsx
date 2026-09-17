"use client";

// components/page/learner/practice/question-types/Type2Group.tsx
// One shared passage (read or heard) followed by several multiple-choice
// questions about it.

import { useT } from "@/components/i18n/I18nProvider";
import { AudioControl } from "../PracticeAudio";
import { hanNodes } from "@/lib/han/hanText";
import { answersMatch } from "@/lib/practice/practiceEngine";
import { Feedback, QNum } from "./Feedback";
import { MCOptions } from "./MCOptions";
import type { GroupProps } from "./types";

export function Type2Group({ group, state, category, onSelectMC }: GroupProps) {
  const { t } = useT();
  const level = group.questions[0]?.level ?? "";
  const isListening = group.questions[0]?.skill === "listening";
  const passage = group.questions.find((q) => q.content);
  const multi = group.questions.length > 1;
  return (
    <>
      {isListening
        ? passage?.audio_key?.length
          ? <AudioControl audioKey={passage.audio_key[0]} level={passage.level} category={category} label={t("practice.play_passage")} />
          : null
        : passage?.content
          ? <div className="p-paragraph">{hanNodes(passage.content, level)}</div>
          : null}
      {group.questions.map((q, idx) => {
        const blockId = `q-${idx}`;
        const blockCls = ["p-question-block"];
        if (state.checked) blockCls.push(answersMatch(state.userAnswers[blockId], q.answer) ? "correct" : "wrong");
        const keyIdx = idx === 0 && q.audio_key?.length === 2 ? 1 : 0;
        return (
          <div key={blockId} className={blockCls.join(" ")} id={blockId}>
            {multi && <QNum n={idx + 1} t={t} />}
            {isListening
              ? q.audio_key?.length
                ? <AudioControl audioKey={q.audio_key[keyIdx]} level={q.level} category={category} label={t("recommend.question_single", { n: idx + 1 })} />
                : null
              : q.question
                ? <div className="p-question-text">{hanNodes(q.question, level)}</div>
                : null}
            <MCOptions q={q} blockId={blockId} state={state} onSelect={onSelectMC} level={level} />
            <Feedback q={q} chosen={state.userAnswers[blockId] || ""} checked={state.checked} t={t} />
          </div>
        );
      })}
    </>
  );
}
