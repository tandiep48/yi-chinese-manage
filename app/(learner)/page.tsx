"use client";

// app/(learner)/page.tsx
// Learner home dashboard — layout ported from the Learning app
// (templates/dashboard/dashboard.html + static/dashboard/dashboard.css).
// Content is static placeholder for now; real data wiring comes later.

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

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

// Placeholder stats — replace with real DB-backed data later.
const SUB_STATS = [
  { icon: faPencil, labelKey: "dashboard.exercise", value: "128", time: "3h 12m" },
  { icon: faClipboardCheck, labelKey: "dashboard.exam", value: "42", time: "1h 05m" },
  { icon: faChalkboardUser, labelKey: "dashboard.lesson_trainer", value: "310", time: "5h 48m" },
  { icon: faLanguage, labelKey: "dashboard.vocab_trainer", value: "560", time: "4h 20m" },
];

// Placeholder recommendations — replace with real DB-backed data later.
const RECOMMENDED = [
  { level: 1, lesson: 4, skill: "listening", category: "practice", questions: 20, statusKey: "status_not_start" },
  { level: 1, lesson: 5, skill: "reading", category: "practice", questions: 18, statusKey: "status_finish_success" },
  { level: 2, lesson: 1, skill: "listening", category: "exam", questions: 25, statusKey: "status_not_start" },
];

export default function DashboardPage() {
  const { t } = useT();

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
              <h2>HSK 1 · {t("picker.lesson_prefix")} 3</h2>
              <p className="description">{t("dashboard.continue_subtitle")}</p>

              <div className="button-group">
                <Link className="btn btn-primary" href="/hsk">
                  {t("dashboard.continue_lesson")} <FontAwesomeIcon icon={faArrowRight} />
                </Link>
                <Link className="btn btn-secondary" href="/hsk">
                  {t("dashboard.change_lesson")}
                </Link>
              </div>
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

            <Link className="btn btn-primary w-100 mt-auto" href="/vocab">
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
            <Link href="/recommend" className="see-more">
              {t("dashboard.recommend_see_more")} <FontAwesomeIcon icon={faChevronRight} />
            </Link>
          </div>

          <div className="rec-grid dashboard-rec-grid">
            {RECOMMENDED.map((r) => (
              <div key={`${r.level}-${r.lesson}-${r.category}`} className="rec-card">
                <div className="rec-card-header">
                  <input
                    type="checkbox"
                    className="rec-card-checkbox"
                    defaultChecked={false}
                    aria-label={`${t("picker.lesson_prefix")} ${r.lesson}`}
                  />
                  <span className={`hsk-badge hsk-${r.level}`}>HSK {r.level}</span>
                  <span className="rec-card-title">
                    {t("picker.lesson_prefix")} {r.lesson}
                  </span>
                </div>
                <div className="rec-card-meta">
                  <span className="rec-card-skill">
                    <FontAwesomeIcon
                      icon={r.skill === "listening" ? faHeadphonesSimple : faBookOpen}
                    />{" "}
                    {t(r.skill === "listening" ? "recommend.listening" : "recommend.reading")}
                  </span>
                  <span
                    className={`category-badge ${
                      r.category === "exam" ? "badge-exam" : "badge-practice"
                    }`}
                  >
                    <FontAwesomeIcon icon={r.category === "exam" ? faFileLines : faListCheck} />
                    <span>{t(r.category === "exam" ? "dashboard.exam" : "dashboard.exercise")}</span>
                  </span>
                  <span className="status-badge">{t(`recommend.${r.statusKey}`)}</span>
                </div>
                <div className="rec-progress-label">
                  {t("recommend.question_count", { count: r.questions })}
                </div>
              </div>
            ))}
          </div>
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
                <h3>14h 25m</h3>
              </div>
              <div className="stat-divider-vertical" />
              <div className="primary-stat">
                <p className="stat-label">{t("dashboard.words_mastered").toUpperCase()}</p>
                <h3>248</h3>
              </div>
            </div>

            <div className="charts-section">
              <div className="charts-grid">
                <div className="chart-card">
                  <h4>
                    <FontAwesomeIcon icon={faClock} className="text-primary" />{" "}
                    {t("dashboard.time_learned_3days")}
                  </h4>
                  <div className="chart-canvas-wrap">{t("dashboard.no_chart_data")}</div>
                </div>
                <div className="chart-card">
                  <h4>
                    <FontAwesomeIcon icon={faChartColumn} className="text-primary" />{" "}
                    {t("dashboard.words_mastered_3days")}
                  </h4>
                  <div className="chart-canvas-wrap">{t("dashboard.no_chart_data")}</div>
                </div>
              </div>
            </div>

            <div className="sub-stats-grid">
              {SUB_STATS.map((s) => (
                <div key={s.labelKey} className="sub-stat-card">
                  <div className="icon-wrapper">
                    <FontAwesomeIcon icon={s.icon} />
                  </div>
                  <div className="sub-stat-info">
                    <p className="label">{t(s.labelKey).toUpperCase()}</p>
                    <h4>{s.value}</h4>
                    <p className="time">{s.time}</p>
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
