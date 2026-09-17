"use client";

// components/page/learner/dashboard/RecommendedSection.tsx
// The "Ready to Practice" row: the dashboard's cut-down preview of the
// /learner/recommend page, with a "see more" link through to it.

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faWandMagicSparkles,
  faChevronRight,
  faHeadphonesSimple,
  faFileLines,
  faListCheck,
} from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import type { RecommendedPractice, RecommendStatus } from "@/lib/types/types";
import "./dashboard-rec-card.css";

function recommendStatusKey(status: RecommendStatus): string {
  if (status === "Finish and success") return "status_finish_success";
  if (status === "Finish and fail") return "status_finish_fail";
  return "status_not_start";
}

export function RecommendedSection({
  loading,
  recommendError,
  recommendations,
}: {
  loading: boolean;
  recommendError: string | null;
  recommendations: RecommendedPractice[];
}) {
  const { t } = useT();
  return (
    <section className="recommended-section">
      <div className="section-header">
        <div className="title-wrapper">
          <div className="tag">
            <FontAwesomeIcon icon={faWandMagicSparkles} /> {t("dashboard.recommend_kicker")}
          </div>
          <h2>{t("dashboard.recommend_title")}</h2>
        </div>
        <Link href="/learner/recommend" className="see-more">
          {t("dashboard.recommend_see_more")} <FontAwesomeIcon icon={faChevronRight} />
        </Link>
      </div>

      {loading ? (
        <p className="dashboard-empty">{t("dashboard.recommend_loading")}</p>
      ) : recommendError ? (
        <p className="dashboard-empty">{recommendError}</p>
      ) : recommendations.length === 0 ? (
        <p className="dashboard-empty">{t("dashboard.recommend_empty")}</p>
      ) : (
        <div className="rec-grid dashboard-rec-grid">
          {recommendations.map((r) => (
            <div key={`${r.level}-${r.lesson}-${r.progress}-${r.category}`} className="rec-card">
              <div className="rec-card-header">
                <span className={`hsk-badge hsk-${r.level}`}>HSK {r.level}</span>
                <span className="rec-card-title">
                  {t("picker.lesson_prefix")} {r.lesson}
                </span>
              </div>
              <div className="rec-card-meta">
                <span className="rec-card-skill">
                  <FontAwesomeIcon icon={r.skill === "listening" ? faHeadphonesSimple : faBookOpen} />{" "}
                  {t(r.skill === "listening" ? "recommend.listening" : "recommend.reading")}
                </span>
                <span className={`category-badge ${r.category === "exam" ? "badge-exam" : "badge-practice"}`}>
                  <FontAwesomeIcon icon={r.category === "exam" ? faFileLines : faListCheck} />
                  <span>{t(r.category === "exam" ? "dashboard.exam" : "dashboard.exercise")}</span>
                </span>
                <span className="status-badge">{t(`recommend.${recommendStatusKey(r.status)}`)}</span>
              </div>
              <div className="rec-progress-label">
                {t("recommend.question_count", { count: r.question_count })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
