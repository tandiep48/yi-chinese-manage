"use client";

// components/page/learner/recommend/RecommendCard.tsx
// One recommendation card — ports buildCard() from static/shared/recommend_cards.js
// declaratively (checkbox + whole-card toggle select, HSK/skill/category/status
// badges, progress + question count, recent-word focus line).

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faFileLines,
  faHeadphonesSimple,
  faListCheck,
} from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import type { RecommendedPractice, RecommendStatus } from "@/lib/types/types";
import { parseProgress } from "@/lib/recommend/recommendLogic";
import "./recommend-card.css";

const STATUS_KEY: Record<RecommendStatus, string> = {
  "Not start": "recommend.status_not_start",
  "Finish and success": "recommend.status_finish_success",
  "Finish and fail": "recommend.status_finish_fail",
};

export function RecommendCard({
  rec,
  selected,
  onToggle,
}: {
  rec: RecommendedPractice;
  selected: boolean;
  onToggle: () => void;
}) {
  const { t } = useT();

  const isExam = rec.category === "exam";
  const qCount =
    rec.question_count != null ? rec.question_count : 0;
  const recentWords = Array.isArray(rec.recent_matched_words)
    ? rec.recent_matched_words.slice(0, 6)
    : [];

  const progress = parseProgress(rec.progress);
  const progressLabel =
    progress.kind === "none"
      ? "-"
      : progress.kind === "range"
        ? t("recommend.questions_range", { a: progress.a, b: progress.b })
        : t("recommend.question_single", { n: progress.n });

  const skillLabel =
    rec.skill === "listening"
      ? t("recommend.listening")
      : rec.skill === "reading"
        ? t("recommend.reading")
        : "";

  const statusText = t(
    STATUS_KEY[(rec.status as RecommendStatus) || "Not start"]
  );

  return (
    <div
      className={`rec-card${selected ? " selected" : ""}`}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      <div className="rec-card-header">
        <input
          type="checkbox"
          className="rec-card-checkbox"
          checked={selected}
          onChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          aria-label={t("recommend.select_lesson_aria", { n: rec.lesson })}
        />
        <span className={`hsk-badge hsk-${rec.level}`}>HSK {rec.level}</span>
        <span className="rec-card-title">
          {t("picker.lesson_prefix")} {rec.lesson}
        </span>
      </div>

      <div className="rec-card-meta">
        {skillLabel && (
          <span className="rec-card-skill">
            <FontAwesomeIcon
              icon={rec.skill === "listening" ? faHeadphonesSimple : faBookOpen}
              aria-hidden
            />{" "}
            {skillLabel}
          </span>
        )}
        <span
          className={`category-badge ${isExam ? "badge-exam" : "badge-practice"}`}
        >
          <FontAwesomeIcon icon={isExam ? faFileLines : faListCheck} aria-hidden />
          <span>{isExam ? t("dashboard.exam") : t("dashboard.exercise")}</span>
        </span>
        <span className="status-badge">{statusText}</span>
      </div>

      <div className="rec-progress-label">
        {progressLabel} &middot; {t("recommend.question_count", { count: qCount })}
      </div>

      {recentWords.length > 0 && (
        <div className="rec-new-focus">
          {t("recommend.new_focus", { words: recentWords.join(", ") })}
        </div>
      )}
    </div>
  );
}
