"use client";

// components/page/learner/profile/ReviewQuestionCard.tsx
// One answered question, read-only (review.js questionCard/optionRow): audio,
// image, passage, prompt, options with correct/user marks, and an answer
// summary. Rendered from React state — no innerHTML.

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faXmark, faUser } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { practiceImageUrl } from "@/lib/gcs";
import {
  answerTokens,
  optionState,
  isImageFilename,
  questionImageFile,
} from "@/lib/review/reviewLogic";
import type { ReviewQuestion } from "@/lib/types/types";
import { ReviewAudioButton } from "./ReviewAudioButton";

interface Props {
  question: ReviewQuestion;
  number: number;
  activeAudioId: string | null;
  onActivate: (id: string | null) => void;
}

export function ReviewQuestionCard({
  question: q,
  number,
  activeAudioId,
  onActivate,
}: Props) {
  const { t } = useT();
  const correct = !!q.is_correct;

  const imgFile = questionImageFile(q);
  const showPrompt = q.question && !isImageFilename(q.question);
  const options = q.options || {};
  const optEntries = Object.entries(options);
  const correctSet = answerTokens(q.answer);
  const userSet = answerTokens(q.user_answer);

  const nothingToShow =
    !optEntries.length && !q.content && !q.question && !imgFile;

  const optionBody = (val: string | boolean) => {
    if (val === true || val === "True") return t("practice.true_label") || "True";
    if (val === false || val === "False")
      return t("practice.false_label") || "False";
    if (isImageFilename(String(val))) {
      return (
        <img
          className="q-option-img"
          src={practiceImageUrl(q.level, String(val), q.category)}
          alt=""
        />
      );
    }
    return String(val);
  };

  return (
    <div className={`q-review-card ${correct ? "is-correct" : "is-incorrect"}`}>
      <div className="q-review-head">
        <span className="q-num">{t("review.question_label", { n: number })}</span>
        {correct ? (
          <span className="q-badge correct">
            <FontAwesomeIcon icon={faCheck} /> {t("review.correct_badge")}
          </span>
        ) : (
          <span className="q-badge incorrect">
            <FontAwesomeIcon icon={faXmark} /> {t("review.incorrect_badge")}
          </span>
        )}
      </div>

      {nothingToShow && <div className="q-missing">{t("review.detail_missing")}</div>}

      {q.audio_key?.map((key, i) => (
        <ReviewAudioButton
          key={`${q.no}-a${i}`}
          id={`${q.no}-a${i}`}
          audioKey={key}
          level={q.level}
          category={q.category}
          activeId={activeAudioId}
          onActivate={onActivate}
        />
      ))}

      {imgFile && (
        <img
          className="q-image"
          src={practiceImageUrl(q.level, imgFile, q.category)}
          alt=""
        />
      )}

      {q.content && <div className="q-content">{q.content}</div>}

      {showPrompt && <div className="q-prompt">{q.question}</div>}

      {optEntries.length > 0 && (
        <div className="q-options">
          {optEntries.map(([key, val]) => {
            const st = optionState(key, correctSet, userSet);
            return (
              <div key={key} className={st.className}>
                <span className="q-option-key">{key}</span>
                <span className="q-option-val">{optionBody(val)}</span>
                <span className="q-option-marks">
                  {st.isUser && (
                    <FontAwesomeIcon
                      icon={faUser}
                      className="q-mark fa-user"
                      title={t("review.your_answer")}
                    />
                  )}
                  {st.isCorrect && (
                    <FontAwesomeIcon
                      icon={faCheck}
                      className="q-mark fa-check"
                      title={t("review.correct_answer")}
                    />
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="q-answers">
        <div className={`q-answer-line ${correct ? "ok" : "bad"}`}>
          <span className="q-answer-label">{t("review.your_answer")}</span>
          <span>
            {q.user_answer === null || q.user_answer === undefined || q.user_answer === "" ? (
              <em>{t("review.no_answer")}</em>
            ) : (
              String(q.user_answer)
            )}
          </span>
        </div>
        <div className="q-answer-line ok">
          <span className="q-answer-label">{t("review.correct_answer")}</span>
          <span>{q.answer ? String(q.answer) : "—"}</span>
        </div>
      </div>
    </div>
  );
}
