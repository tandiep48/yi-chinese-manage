"use client";

// components/page/learner/practice/question-types/Type6Group.tsx
// Type 6: numbered blanks across several sentences drawing from one shared
// option pool at the bottom. The learner targets a blank, then picks a word;
// a word already placed anywhere in the group is disabled.

import { useT } from "@/components/i18n/I18nProvider";
import { AudioControl } from "../PracticeAudio";
import { hanNodes } from "@/lib/han/hanText";
import { answersMatch, tokenizeContent } from "@/lib/practice/practiceEngine";
import { BlankedContent } from "./BlankedContent";
import { Feedback, QNum } from "./Feedback";
import type { GroupProps } from "./types";

export function Type6Group({ group, state, category, onBlankClick, onAssignT6 }: GroupProps) {
  const { t } = useT();
  const isListening = group.questions[0]?.skill === "listening";
  const passage = group.questions.find((q) => q.content);
  const level = group.questions[0]?.level ?? "";
  const multi = group.questions.length > 1;

  // Shared options across every blank in the group.
  const sharedOpts: Record<string, string | boolean> = {};
  group.questions.forEach((q) => Object.assign(sharedOpts, q.options));
  const usedKeys = new Set<string>();
  Object.values(state.blankState).forEach((blanks) =>
    Object.values(blanks).forEach((k) => k && usedKeys.add(k))
  );

  return (
    <>
      {isListening && passage?.audio_key?.length ? (
        <AudioControl audioKey={passage.audio_key[0]} level={passage.level} category={category} label={t("practice.play_passage")} />
      ) : null}

      {group.questions.map((q, idx) => {
        const blockId = `q-${idx}`;
        const blockBlanks = state.blankState[blockId] || {};
        const fillCount = tokenizeContent(q.content).filter((s) => s.kind === "blank").length;
        const fills = Array.from({ length: fillCount }, (_, i) => blockBlanks[i] || null);
        const blockCls = ["p-question-block"];
        if (state.checked) blockCls.push(answersMatch(state.userAnswers[blockId], q.answer) ? "correct" : "wrong");
        return (
          <div key={blockId} className={blockCls.join(" ")} id={blockId}>
            {multi && <QNum n={idx + 1} t={t} />}
            {!isListening && q.content ? (
              <div className="p-paragraph">
                <BlankedContent
                  content={q.content}
                  level={level}
                  interactive
                  fills={fills}
                  blockId={blockId}
                  activeBlank={state.activeBlank}
                  onBlankClick={onBlankClick}
                />
              </div>
            ) : null}
            <Feedback q={q} chosen={state.userAnswers[blockId] || ""} checked={state.checked} t={t} />
          </div>
        );
      })}

      <div className="t6-shared-options">
        <div className="p-group-header">{t("practice.choose_from_options")}</div>
        <div className="mc-options">
          {Object.entries(sharedOpts).map(([key, text]) => {
            const used = usedKeys.has(key);
            return (
              <button
                key={key}
                type="button"
                className={`mc-option${used ? " selected" : ""}`}
                disabled={used || state.checked}
                onClick={() => onAssignT6(key)}
              >
                <span className="opt-key">{key}</span>
                <span>{hanNodes(String(text), level)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
