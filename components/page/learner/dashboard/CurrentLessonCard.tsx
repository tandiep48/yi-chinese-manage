"use client";

// components/page/learner/dashboard/CurrentLessonCard.tsx
// The dashboard's lead card. It has five states in priority order: loading,
// signed out, load error, signed in with no recent lesson, and the lesson
// itself — the same ladder the legacy dashboard.js walked.

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookOpen, faUserGraduate, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import type { DashboardLesson } from "@/lib/types/dashboard";

export function CurrentLessonCard({
  loading,
  signedOut,
  error,
  hasRecent,
  lesson,
}: {
  loading: boolean;
  signedOut: boolean;
  error: string | null;
  hasRecent: boolean | null;
  lesson: DashboardLesson | null;
}) {
  const { t } = useT();
  return (
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
  );
}
