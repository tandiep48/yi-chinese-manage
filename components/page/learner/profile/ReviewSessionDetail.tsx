"use client";

// components/page/learner/profile/ReviewSessionDetail.tsx
// Read-only detail for one past session (review.js renderDetail): result/skill
// filters over the session's questions, with stable original numbering.

import { useState } from "react";
import { useT } from "@/components/i18n/I18nProvider";
import { filterReviewQuestions } from "@/lib/review/reviewLogic";
import type {
  ResultFilter,
  SkillFilter,
} from "@/lib/review/reviewLogic";
import type { ReviewSessionDetail as Detail } from "@/lib/types/practice";
import { ReviewQuestionCard } from "./ReviewQuestionCard";

interface Props {
  detail: Detail | null;
  loading: boolean;
  error: string | null;
  resultFilter: ResultFilter;
  skillFilter: SkillFilter;
  onResultFilter: (r: ResultFilter) => void;
  onSkillFilter: (s: SkillFilter) => void;
  onBack: () => void;
}

export function ReviewSessionDetail({
  detail,
  loading,
  error,
  resultFilter,
  skillFilter,
  onResultFilter,
  onSkillFilter,
  onBack,
}: Props) {
  const { t } = useT();
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);

  const rows = detail
    ? filterReviewQuestions(detail.questions, resultFilter, skillFilter)
    : [];

  return (
    <div>
      <button type="button" className="review-back-btn" onClick={onBack}>
        {t("review.back_to_list")}
      </button>

      {loading && (
        <div className="state-box">
          <div className="state-title">{t("review.loading")}</div>
        </div>
      )}

      {!loading && error && (
        <div className="state-box">
          <div className="state-title">{error}</div>
        </div>
      )}

      {!loading && !error && detail && (
        <>
          <div className="review-filters">
            <div className="filter-group">
              <label className="filter-label" htmlFor="detail-filter-result">
                {t("review.filter_result")}
              </label>
              <select
                id="detail-filter-result"
                className="filter-select"
                value={resultFilter}
                onChange={(e) => onResultFilter(e.target.value as ResultFilter)}
              >
                <option value="all">{t("review.result_all")}</option>
                <option value="correct">{t("review.correct_badge")}</option>
                <option value="incorrect">{t("review.incorrect_badge")}</option>
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label" htmlFor="detail-filter-skill">
                {t("recommend.skill")}
              </label>
              <select
                id="detail-filter-skill"
                className="filter-select"
                value={skillFilter}
                onChange={(e) => onSkillFilter(e.target.value as SkillFilter)}
              >
                <option value="all">{t("review.skill_all")}</option>
                <option value="reading">{t("recommend.reading")}</option>
                <option value="listening">{t("recommend.listening")}</option>
              </select>
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="state-box">
              <div className="state-title">{t("review.empty_sub")}</div>
            </div>
          ) : (
            <div className="q-review-list">
              {rows.map(({ question, number }) => (
                <ReviewQuestionCard
                  key={number}
                  question={question}
                  number={number}
                  activeAudioId={activeAudioId}
                  onActivate={setActiveAudioId}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
