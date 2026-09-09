"use client";

// components/page/learner/profile/ReviewPanel.tsx
// The profile page's "Practice Review" section (review.js): a filterable,
// paged list of past practice/exam sessions, and a read-only per-session
// detail. Backed by hooks/useReviewPanel.

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faFolderOpen,
} from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { useReviewPanel } from "@/hooks/useReviewPanel";
import {
  sessionCardLevels,
  sessionCardLessons,
} from "@/lib/review/reviewLogic";
import { ReviewSessionDetail } from "./ReviewSessionDetail";

// Localised session timestamp (review.js fmtDate).
function fmtDate(iso: string | null, lang: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString(lang === "vi" ? "vi-VN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ReviewPanel() {
  const { t, lang } = useT();
  const rp = useReviewPanel();

  if (rp.view === "detail") {
    return (
      <ReviewSessionDetail
        detail={rp.detail}
        loading={rp.detailLoading}
        error={rp.detailError}
        resultFilter={rp.resultFilter}
        skillFilter={rp.skillFilter}
        onResultFilter={rp.setResultFilter}
        onSkillFilter={rp.setSkillFilter}
        onBack={rp.backToList}
      />
    );
  }

  const showPager = rp.filters.page > 1 || rp.hasMore;

  return (
    <div>
      <div className="review-filters">
        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-date">
            {t("review.date")}
          </label>
          <div className="review-date-wrap">
            <input
              type="date"
              id="filter-date"
              className="filter-select"
              value={rp.filters.date}
              onChange={(e) => rp.setFilter({ date: e.target.value })}
            />
            <button
              type="button"
              className="review-date-clear"
              onClick={rp.clearDate}
            >
              {t("review.all_dates")}
            </button>
          </div>
        </div>
        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-level">
            {t("recommend.level")}
          </label>
          <select
            id="filter-level"
            className="filter-select"
            value={rp.filters.level}
            onChange={(e) => rp.setFilter({ level: e.target.value })}
          >
            <option value="all">{t("recommend.all_levels")}</option>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={String(n)}>
                HSK {n}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-category">
            {t("recommend.category")}
          </label>
          <select
            id="filter-category"
            className="filter-select"
            value={rp.filters.category}
            onChange={(e) => rp.setFilter({ category: e.target.value })}
          >
            <option value="all">{t("recommend.all_categories")}</option>
            <option value="practice">{t("dashboard.exercise")}</option>
            <option value="exam">{t("dashboard.exam")}</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-sort">
            {t("review.sort")}
          </label>
          <select
            id="filter-sort"
            className="filter-select"
            value={rp.filters.sort}
            onChange={(e) =>
              rp.setFilter({ sort: e.target.value as "recent" | "oldest" })
            }
          >
            <option value="recent">{t("review.sort_recent")}</option>
            <option value="oldest">{t("review.sort_oldest")}</option>
          </select>
        </div>
      </div>

      {rp.listLoading ? (
        <div className="state-box">
          <div className="loading-dots">
            <span />
            <span />
            <span />
          </div>
        </div>
      ) : rp.listError ? (
        <div className="state-box">
          <div className="state-title">{rp.listError}</div>
        </div>
      ) : rp.sessions.length === 0 ? (
        <div className="state-box">
          <FontAwesomeIcon icon={faFolderOpen} className="state-icon" />
          {rp.filters.page > 1 ? (
            <div className="state-sub">{t("review.no_more")}</div>
          ) : (
            <>
              <div className="state-title">{t("review.empty_title")}</div>
              <div className="state-sub">{t("review.empty_sub")}</div>
            </>
          )}
        </div>
      ) : (
        <div id="session-list">
          {rp.sessions.map((s) => {
            const levels = sessionCardLevels(s);
            const lessons = sessionCardLessons(s);
            return (
              <button
                key={s.session_id}
                type="button"
                className="session-card"
                onClick={() => rp.openSession(s.session_id)}
              >
                <div className="session-card-main">
                  <div className="session-card-title">
                    {levels}
                    {lessons ? ` · ${t("picker.lesson_prefix")} ${lessons}` : ""}
                  </div>
                  <div className="session-card-meta">
                    <span className="session-date">{fmtDate(s.ended_at, lang)}</span>
                    <span>{t("review.questions", { count: s.total })}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {showPager && !rp.listLoading && (
        <div className="review-pagination">
          <button
            type="button"
            className="review-page-btn"
            disabled={rp.filters.page <= 1}
            onClick={() => rp.changePage(-1)}
          >
            <FontAwesomeIcon icon={faChevronLeft} /> {t("reading.prev")}
          </button>
          <span className="review-page-indicator">
            {t("review.page_indicator", { page: rp.filters.page })}
          </span>
          <button
            type="button"
            className="review-page-btn"
            disabled={!rp.hasMore}
            onClick={() => rp.changePage(1)}
          >
            {t("reading.next")} <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      )}
    </div>
  );
}
