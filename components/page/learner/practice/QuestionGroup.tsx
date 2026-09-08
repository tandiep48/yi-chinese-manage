"use client";

// components/page/learner/practice/QuestionGroup.tsx
// Declarative React port of the question-type renderers in
// Learning/web_app/static/practice/practice_engine.js (buildGroupContent /
// renderQuestion and the type-2/5/6 group layouts). The engine mutated the DOM
// imperatively; here rendering is derived from the per-group state held by
// usePracticeEngine, so a "check" simply re-renders with feedback/highlights.

import { Fragment, type ReactNode } from "react";
import { useT } from "@/components/i18n/I18nProvider";
import { AudioControl } from "./PracticeAudio";
import { hanNodes } from "@/lib/han/hanText";
import { practiceImageUrl } from "@/lib/gcs";
import {
  classifyGroupLayout,
  classifyQuestion,
  tokenizeContent,
  allOptionsAreImages,
  isImageFilename,
  normalizeAnswer,
  answersMatch,
} from "@/lib/practice/practiceEngine";
import type { GroupUIState } from "@/hooks/usePracticeEngine";
import type { PracticeCategory, PracticeGroup, PracticeQuestion } from "@/lib/types/types";

type TFn = (key: string, vars?: Record<string, string | number>) => string;

interface Props {
  group: PracticeGroup;
  state: GroupUIState;
  category: PracticeCategory;
  onSelectMC: (blockId: string, key: string) => void;
  onSelectKey: (blockId: string, key: string) => void;
  onToggleChip: (blockId: string, key: string) => void;
  onBlankClick: (blockId: string, index: number) => void;
  onAssignT6: (key: string) => void;
}

export function QuestionGroup(props: Props) {
  const { group } = props;
  const layout = classifyGroupLayout(group);
  switch (layout) {
    case "type2":
      return <Type2Group {...props} />;
    case "t5-listening":
      return <T5ListeningGroup {...props} />;
    case "t5-reading-match":
      return <T5ReadingMatchGroup {...props} imageMode={false} />;
    case "t5-reading-image":
      return <T5ReadingMatchGroup {...props} imageMode />;
    case "type6-group":
      return <Type6Group {...props} />;
    default:
      return <SingleGroup {...props} />;
  }
}

// ── Shared bits ───────────────────────────────────────────────────────────────

function QNum({ n, t }: { n: number; t: TFn }) {
  return <span className="p-qnum">{t("practice.question_number", { n })}</span>;
}

function Feedback({
  q,
  chosen,
  checked,
  reorder,
  t,
}: {
  q: PracticeQuestion;
  chosen: string;
  checked: boolean;
  reorder?: boolean;
  t: TFn;
}) {
  if (!checked) return null;
  const correct = normalizeAnswer(q.answer);
  const isCorrect = normalizeAnswer(chosen) === correct;
  if (isCorrect) {
    return <div className="p-feedback correct">{t("practice.correct_exclaim")}</div>;
  }
  if (reorder) {
    return <div className="p-feedback wrong">{t("practice.correct_order", { order: correct })}</div>;
  }
  return (
    <div className="p-feedback wrong">{t("practice.correct_answer_colon", { answer: correct })}</div>
  );
}

function GroupFeedback({
  correctCount,
  total,
  checked,
  t,
}: {
  correctCount: number;
  total: number;
  checked: boolean;
  t: TFn;
}) {
  if (!checked) return null;
  const cls = correctCount === total ? "p-feedback correct" : "p-feedback wrong";
  return <div className={cls}>{t("practice.score_correct", { correct: correctCount, total })}</div>;
}

function MCOptions({
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

// Renders content, replacing blanks with either interactive spans (type 6) or
// display spans (fill-in preview / t5 sentences).
function BlankedContent({
  content,
  level,
  interactive,
  fills,
  blockId,
  activeBlank,
  onBlankClick,
}: {
  content: string | null;
  level: number | string;
  interactive?: boolean;
  fills?: (string | null)[]; // value shown per blank index
  blockId?: string;
  activeBlank?: GroupUIState["activeBlank"];
  onBlankClick?: (blockId: string, index: number) => void;
}): ReactNode {
  const segs = tokenizeContent(content);
  return (
    <>
      {segs.map((s, i) => {
        if (s.kind === "text") return <Fragment key={i}>{hanNodes(s.text, level)}</Fragment>;
        const val = fills ? fills[s.index] : null;
        if (interactive) {
          const active =
            activeBlank && activeBlank.blockId === blockId && activeBlank.index === s.index;
          const cls = ["blank-gap", val ? "blank-filled" : "blank-empty"];
          if (active) cls.push("blank-active");
          return (
            <span
              key={i}
              className={cls.join(" ")}
              onClick={() => blockId && onBlankClick?.(blockId, s.index)}
            >
              {val || "　　"}
            </span>
          );
        }
        return (
          <span key={i} className={val ? "blank-gap filled" : "blank-gap"}>
            {val ? hanNodes(val, level) : "　　"}
          </span>
        );
      })}
    </>
  );
}

// ── Type 1 (True/False) ───────────────────────────────────────────────────────
function TrueFalse({
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

// ── Image options (type 3 / 5) ────────────────────────────────────────────────
function ImageOptions({
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

// ── Reorder chips (type 4) ────────────────────────────────────────────────────
function Reorder({
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

// ── Key-picker rows (t5 grouped layouts) ──────────────────────────────────────
function KeyButtons({
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

// ── SINGLE group ──────────────────────────────────────────────────────────────
function SingleGroup({ group, state, category, onSelectMC, onToggleChip }: Props) {
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

// ── TYPE 2 group ──────────────────────────────────────────────────────────────
function Type2Group({ group, state, category, onSelectMC }: Props) {
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

// ── TYPE 5 LISTENING group ────────────────────────────────────────────────────
function T5ListeningGroup({ group, state, category, onSelectKey }: Props) {
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

// ── TYPE 5 READING match / image group ────────────────────────────────────────
function T5ReadingMatchGroup({ group, state, category, onSelectKey, imageMode }: Props & { imageMode: boolean }) {
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

// ── TYPE 6 group (numbered blanks + shared option pool) ────────────────────────
function Type6Group({ group, state, category, onBlankClick, onAssignT6 }: Props) {
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
