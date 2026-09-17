"use client";

// components/page/learner/dashboard/LearningStatistics.tsx
// The progress block: two headline figures, the two three-day charts, and a
// per-activity breakdown of questions answered and time spent.

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine,
  faClock,
  faChartColumn,
  faPencil,
  faClipboardCheck,
  faChalkboardUser,
  faLanguage,
} from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { MiniBarChart, formatChartDate } from "./MiniBarChart";
import type {
  GlobalStats,
  GlobalStatsBucket,
  LearnedWordsDay,
  TimeLearnedDay,
} from "@/lib/types/types";
import "./dashboard-stats.css";

export function LearningStatistics({
  stats,
  wordsDays,
  timeDays,
}: {
  stats: GlobalStats | null;
  wordsDays: LearnedWordsDay[];
  timeDays: TimeLearnedDay[];
}) {
  const { t } = useT();

  const subStats: { icon: typeof faPencil; labelKey: string; bucket: GlobalStatsBucket | undefined }[] = [
    { icon: faPencil, labelKey: "dashboard.exercise", bucket: stats?.buckets.exercise },
    { icon: faClipboardCheck, labelKey: "dashboard.exam", bucket: stats?.buckets.exam },
    { icon: faChalkboardUser, labelKey: "dashboard.lesson_trainer", bucket: stats?.buckets.lesson_trainer },
    { icon: faLanguage, labelKey: "dashboard.vocab_trainer", bucket: stats?.buckets.vocab_trainer },
  ];

  return (
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
  );
}
