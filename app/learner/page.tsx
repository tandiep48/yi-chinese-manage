"use client";

// app/learner/page.tsx
// Learner home dashboard — layout ported from the Learning app
// (templates/dashboard/dashboard.html + static/dashboard/dashboard.css).
// Data wiring ported from static/dashboard/dashboard.js, against the same
// (non-enveloped) JSON endpoints — see hooks/useDashboardHome.ts.

import Link from "next/link";
import { Inter } from "next/font/google";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faUserGraduate,
  faArrowsRotate,
  faArrowRight,
  faPlay,
  faWandMagicSparkles,
  faChevronRight,
  faChartLine,
  faClock,
  faChartColumn,
  faPencil,
  faClipboardCheck,
  faChalkboardUser,
  faLanguage,
  faHeadphonesSimple,
  faFileLines,
  faListCheck,
} from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { useDashboardHome } from "@/hooks/useDashboardHome";
import type { GlobalStatsBucket, RecommendStatus } from "@/lib/types/types";
import "@/components/page/learner/dashboard/dashboard.css";
import "@/components/page/learner/dashboard/dashboard-rec-card.css";
import "@/components/page/learner/dashboard/dashboard-stats.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatChartDate(iso: string): string {
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || !MONTHS[parts[1] - 1]) return iso;
  return `${MONTHS[parts[1] - 1]} ${parts[2]}`;
}

function recommendStatusKey(status: RecommendStatus): string {
  if (status === "Finish and success") return "status_finish_success";
  if (status === "Finish and fail") return "status_finish_fail";
  return "status_not_start";
}

function MiniBarChart({
  values,
  labels,
  suffix = "",
}: {
  values: number[];
  labels: string[];
  suffix?: string;
}) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex h-[240px] items-end justify-around gap-4 px-2">
      {values.map((value, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-2">
          <span className="text-xs font-semibold text-[var(--text-main)]">
            {value}
            {suffix}
          </span>
          <div
            className="w-full max-w-10 rounded-t-md bg-[var(--primary)]"
            style={{ height: `${Math.max(4, (value / max) * 160)}px` }}
          />
          <span className="text-xs text-[var(--text-light)]">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useT();
  const {
    loading,
    signedOut,
    hasRecent,
    lesson,
    stats,
    wordsDays,
    timeDays,
    recommendations,
    recommendError,
    error,
  } = useDashboardHome();

  const subStats: { icon: typeof faPencil; labelKey: string; bucket: GlobalStatsBucket | undefined }[] = [
    { icon: faPencil, labelKey: "dashboard.exercise", bucket: stats?.buckets.exercise },
    { icon: faClipboardCheck, labelKey: "dashboard.exam", bucket: stats?.buckets.exam },
    { icon: faChalkboardUser, labelKey: "dashboard.lesson_trainer", bucket: stats?.buckets.lesson_trainer },
    { icon: faLanguage, labelKey: "dashboard.vocab_trainer", bucket: stats?.buckets.vocab_trainer },
  ];

  return (
    <div className={`${inter.variable} ui2-dashboard`}>
      <main className="dashboard-main">
        {/* ── Top grid: current lesson + review ─────────────────────── */}
        <div className="top-grid">
          {/* Current Lesson */}
          <div className="card current-lesson">
            <div className="card-content">
              <div className="tag">
                <FontAwesomeIcon icon={faBookOpen} /> {t("dashboard.current_lesson")}
              </div>

              {loading ? (
                <>
                  <h2>{t("dashboard.loading")}</h2>
                  <p className="description">&nbsp;</p>
                </>
              ) : signedOut ? (
                <>
                  <h2>{t("dashboard.signed_out_title")}</h2>
                  <p className="description">{t("dashboard.signed_out_body")}</p>
                  <div className="button-group">
                    <Link className="btn btn-primary" href="/learner/login">
                      {t("auth.login_button")} <FontAwesomeIcon icon={faArrowRight} />
                    </Link>
                  </div>
                </>
              ) : error ? (
                <>
                  <h2>{t("dashboard.load_failed")}</h2>
                  <p className="description">{error}</p>
                </>
              ) : hasRecent === false ? (
                <>
                  <h2>{t("dashboard.no_lesson_title")}</h2>
                  <p className="description">{t("dashboard.no_lesson_body")}</p>
                  <div className="button-group">
                    <Link className="btn btn-primary" href="/learner/hsk">
                      {t("dashboard.open_learning")} <FontAwesomeIcon icon={faArrowRight} />
                    </Link>
                  </div>
                </>
              ) : lesson ? (
                <>
                  <h2>
                    HSK {lesson.level} · {t("picker.lesson_prefix")} {lesson.lesson}
                  </h2>
                  <p className="description">
                    {t("dashboard.current_part", {
                      part: lesson.part,
                      count: lesson.passage_ids.length || 1,
                    })}
                  </p>
                  <div className="button-group">
                    <Link className="btn btn-primary" href={`/learner/hsk/${lesson.hsk_level}/${lesson.lesson}`}>
                      {t("dashboard.continue_lesson")} <FontAwesomeIcon icon={faArrowRight} />
                    </Link>
                    <Link className="btn btn-secondary" href="/learner/hsk">
                      {t("dashboard.change_lesson")}
                    </Link>
                  </div>
                </>
              ) : null}
            </div>
            <div className="card-illustration">
              <FontAwesomeIcon icon={faUserGraduate} />
            </div>
          </div>

          {/* Review */}
          <div className="card review-card">
            <div className="tag text-primary">
              <FontAwesomeIcon icon={faArrowsRotate} /> {t("dashboard.review_kicker")}
            </div>
            <h2>{t("dashboard.review_title")}</h2>
            <p className="description">{t("dashboard.review_subtitle")}</p>

            <Link className="btn btn-primary w-100 mt-auto" href="/learner/vocab-review">
              {t("dashboard.review_button")} <FontAwesomeIcon icon={faPlay} />
            </Link>
          </div>
        </div>

        {/* ── Recommended ───────────────────────────────────────────── */}
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

        {/* ── Progress / stats ──────────────────────────────────────── */}
        <section className="progress-section">
          <div className="section-header">
            <div className="title-wrapper">
              <div className="tag">
                <FontAwesomeIcon icon={faChartLine} /> {t("dashboard.progress_kicker")}
              </div>
              <h2>{t("dashboard.learning_statistics")}</h2>
            </div>
          </div>

          <div className="stats-overview">
            <div className="main-stats">
              <div className="primary-stat">
                <p className="stat-label">{t("dashboard.total_time").toUpperCase()}</p>
                <h3>{stats?.total_time_label ?? "0s"}</h3>
              </div>
              <div className="stat-divider-vertical" />
              <div className="primary-stat">
                <p className="stat-label">{t("dashboard.words_mastered").toUpperCase()}</p>
                <h3>{(stats?.total_words ?? 0).toLocaleString()}</h3>
              </div>
            </div>

            <div className="charts-section">
              <div className="charts-grid">
                <div className="chart-card">
                  <h4>
                    <FontAwesomeIcon icon={faClock} className="text-primary" /> {t("dashboard.time_learned_3days")}
                  </h4>
                  {timeDays.length === 0 ? (
                    <div className="chart-canvas-wrap">{t("dashboard.no_chart_data")}</div>
                  ) : (
                    <MiniBarChart
                      values={timeDays.map((d) => d.minutes)}
                      labels={timeDays.map((d) => formatChartDate(d.date))}
                      suffix="m"
                    />
                  )}
                </div>
                <div className="chart-card">
                  <h4>
                    <FontAwesomeIcon icon={faChartColumn} className="text-primary" />{" "}
                    {t("dashboard.words_mastered_3days")}
                  </h4>
                  {wordsDays.length === 0 ? (
                    <div className="chart-canvas-wrap">{t("dashboard.no_chart_data")}</div>
                  ) : (
                    <MiniBarChart
                      values={wordsDays.map((d) => d.count)}
                      labels={wordsDays.map((d) => formatChartDate(d.date))}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="sub-stats-grid">
              {subStats.map((s) => (
                <div key={s.labelKey} className="sub-stat-card">
                  <div className="icon-wrapper">
                    <FontAwesomeIcon icon={s.icon} />
                  </div>
                  <div className="sub-stat-info">
                    <p className="label">{t(s.labelKey).toUpperCase()}</p>
                    <h4>{(s.bucket?.questions ?? 0).toLocaleString()}</h4>
                    <p className="time">{s.bucket?.time_label ?? "0s"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
