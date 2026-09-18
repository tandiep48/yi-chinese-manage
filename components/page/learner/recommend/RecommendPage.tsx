"use client";

// components/page/learner/recommend/RecommendPage.tsx
// Recommended-lessons page — ports templates/recommend/recommend.html +
// static/recommend/recommend.js. Filter bar (level/skill/category/status),
// card grid, pagination, and the sticky multi-select bar that queues selected
// groups into /practice/multi. State lives in useRecommend; CSS is scoped under
// `.recommend-page` in app/globals.css.

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faChevronDown,
  faCompass,
  faGraduationCap,
  faPlay,
  faSeedling,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { useRecommend } from "@/hooks/practice/useRecommend";
import { RecommendCard } from "./RecommendCard";
import { RecommendPagination } from "./RecommendPagination";
import "./recommend-page.css";

const LEVEL_OPTIONS = ["all", "1", "2", "3", "4", "5", "6"] as const;

export function RecommendPage() {
  const { t } = useT();
  const rec = useRecommend();

  return (
    <div className="recommend-page">
      <div className="recommend-container">
        <Link href="/learner" className="page-back">
          ← {t("picker.back_to_dashboard")}
        </Link>

        <div className="page-header">
          <h1 className="page-title">
            <FontAwesomeIcon icon={faCompass} aria-hidden />
            <span>{t("recommend.page_title")}</span>
          </h1>
        </div>

        <div className="filters-bar">
          <FilterSelect
            label={t("recommend.level")}
            value={rec.filters.level}
            onChange={(v) =>
              rec.setFilter("level", v as (typeof LEVEL_OPTIONS)[number])
            }
            options={LEVEL_OPTIONS.map((v) => ({
              value: v,
              label: v === "all" ? t("recommend.all_levels") : `HSK ${v}`,
            }))}
          />
          <FilterSelect
            label={t("recommend.skill")}
            value={rec.filters.skill}
            onChange={(v) => rec.setFilter("skill", v as "all" | "listening" | "reading")}
            options={[
              { value: "all", label: t("recommend.all_skills") },
              { value: "listening", label: t("recommend.listening") },
              { value: "reading", label: t("recommend.reading") },
            ]}
          />
          <FilterSelect
            label={t("recommend.category")}
            value={rec.filters.category}
            onChange={(v) => rec.setFilter("category", v as "all" | "practice" | "exam")}
            options={[
              { value: "all", label: t("recommend.all_categories") },
              { value: "practice", label: t("dashboard.exercise") },
              { value: "exam", label: t("dashboard.exam") },
            ]}
          />
          <FilterSelect
            label={t("recommend.status")}
            value={rec.filters.status}
            onChange={(v) =>
              rec.setFilter(
                "status",
                v as
                  | "all"
                  | "Not start"
                  | "Finish and success"
                  | "Finish and fail"
              )
            }
            options={[
              { value: "all", label: t("recommend.all_statuses") },
              { value: "Not start", label: t("recommend.status_not_start") },
              {
                value: "Finish and success",
                label: t("recommend.status_finish_success"),
              },
              {
                value: "Finish and fail",
                label: t("recommend.status_finish_fail"),
              },
            ]}
          />
        </div>

        {rec.status === "loading" && (
          <div className="state-box">
            <div className="loading-dots">
              <span />
              <span />
              <span />
            </div>
            <div className="state-title" style={{ marginTop: 16 }}>
              {t("recommend.finding")}
            </div>
            <div className="state-sub">{t("recommend.analysing")}</div>
          </div>
        )}

        {rec.status === "error" && (
          <div className="state-box">
            <div className="state-icon">
              <FontAwesomeIcon icon={faTriangleExclamation} aria-hidden />
            </div>
            <div className="state-title">{t("recommend.error_title")}</div>
            <div className="state-sub">{t(rec.errorKey)}</div>
          </div>
        )}

        {rec.status === "empty" && (
          <div className="state-box">
            <div className="state-icon">
              <FontAwesomeIcon icon={faGraduationCap} aria-hidden />
            </div>
            <div className="state-title">{t("recommend.empty_title")}</div>
            <div className="state-sub">{t("recommend.empty_sub")}</div>
          </div>
        )}

        {rec.status === "new-user" && (
          <div className="state-box new-user-box">
            <div className="state-icon">
              <FontAwesomeIcon icon={faSeedling} aria-hidden />
            </div>
            <div className="state-title">{t("recommend.new_user_title")}</div>
            <div className="state-sub">{t("recommend.new_user_sub")}</div>
            <Link
              href="/learner/vocab"
              className="btn-start-practice"
              style={{
                marginTop: 20,
                display: "inline-flex",
                padding: "12px 28px",
                fontSize: "1rem",
              }}
            >
              <FontAwesomeIcon icon={faBookOpen} aria-hidden />
              <span>{t("recommend.new_user_cta")}</span>
            </Link>
          </div>
        )}

        {rec.status === "ready" &&
          (rec.totalItems === 0 ? (
            <div className="state-box">
              <div className="state-icon">
                <FontAwesomeIcon icon={faGraduationCap} aria-hidden />
              </div>
              <div className="state-title">{t("recommend.empty_title")}</div>
              <div className="state-sub">{t("recommend.empty_sub")}</div>
            </div>
          ) : (
            <>
              <p className="results-count">
                {t("recommend.groups_found", { count: rec.totalItems })}
              </p>
              <div className="rec-grid">
                {rec.pageItems.map((item) => (
                  <RecommendCard
                    key={`${item.category}-${item.level}-${item.lesson}-${item.progress}`}
                    rec={item}
                    selected={rec.isSelected(item)}
                    onToggle={() => rec.toggleSelect(item)}
                  />
                ))}
              </div>
              <RecommendPagination
                page={rec.page}
                totalPages={rec.totalPages}
                totalItems={rec.totalItems}
                pageNumbers={rec.pageNumbers}
                pageSize={rec.pageSize}
                onGo={rec.goToPage}
              />
            </>
          ))}
      </div>

      <div className={`multi-select-bar${rec.selectedCount > 0 ? "" : " hidden"}`}>
        <span id="multi-select-count">
          {t("recommend.items_selected", { count: rec.selectedCount })}
        </span>
        <button className="btn-start-practice" onClick={rec.startSelected}>
          <FontAwesomeIcon icon={faPlay} aria-hidden />
          <span>{t("recommend.start_selected")}</span>
        </button>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="filter-group">
      <label className="filter-label">{label}</label>
      <div className="select-wrapper">
        <select
          className="filter-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <FontAwesomeIcon icon={faChevronDown} className="select-icon" aria-hidden />
      </div>
    </div>
  );
}
