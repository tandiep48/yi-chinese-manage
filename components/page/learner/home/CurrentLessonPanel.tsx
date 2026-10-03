"use client";

// components/page/learner/home/CurrentLessonPanel.tsx
// The learner home's right rail: a compact "current lesson" card floated to the
// right on web (Duolingo-style), showing the current lesson and its milestone
// progress. It reads the same lesson the Lesson tab runs — useCurrentLesson is one
// shared cached request — plus that part's milestone progress. It is informational
// only; it carries no Continue button.
//
// It is chrome of the learner home, so every class is a `.learner-home…` the home
// root owns; it never reaches into a panel's markup (docs/plans/dashboard-tabs.md
// §2). Whether it shows at all (signed in) is HomeShell's call — this component
// just renders the current lesson it is given.

import Link from "next/link";
import { useT } from "@/components/i18n/I18nProvider";
import { useCurrentLesson } from "@/hooks/lesson/useCurrentLesson";
import { useLessonMilestone } from "@/hooks/lesson/useLessonMilestone";
import { STEP_TITLE_KEYS } from "@/components/page/learner/milestone/MilestoneBar";

export function CurrentLessonPanel() {
  const { t } = useT();
  const { loading, lesson } = useCurrentLesson();
  // Called unconditionally (hooks rule); an empty id is a no-op inside the hook.
  const milestone = useLessonMilestone(lesson?.passage_id ?? "");

  if (loading) {
    return (
      <aside className="learner-home-aside" aria-busy="true">
        <span className="learner-home-skeleton-label">{t("home.lesson_loading")}</span>
        <div className="learner-home-skeleton-bar is-title" />
        <div className="learner-home-skeleton-bar" />
        <div className="learner-home-skeleton-bar" />
      </aside>
    );
  }

  if (!lesson?.passage_id) {
    return (
      <aside className="learner-home-aside">
        <h2 className="learner-home-aside-kicker">{t("home.current_lesson")}</h2>
        <p className="learner-home-aside-empty">{t("home.lesson_empty")}</p>
        <Link className="learner-home-note-link" href="/learner/hsk">
          {t("home.lesson_browse")}
        </Link>
      </aside>
    );
  }

  const context = `${lesson.hsk_level} · ${t("picker.lesson_prefix")} ${lesson.lesson} · ${t("picker.part_prefix")} ${lesson.part}`;
  const total = milestone.totalSteps;
  const done = milestone.milestone?.steps.filter((s) => s.completed).length ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <aside className="learner-home-aside">
      <h2 className="learner-home-aside-kicker">{t("home.current_lesson")}</h2>
      <p className="learner-home-lesson-context">{context}</p>

      {milestone.milestone && (
        <>
          <p className="learner-home-lesson-step">
            {t("milestone.step_counter", { n: milestone.step, total })}
            {" · "}
            {t(STEP_TITLE_KEYS[milestone.step] ?? "")}
          </p>
          <div
            className="learner-home-lesson-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={done}
          >
            <div className="learner-home-lesson-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </>
      )}
    </aside>
  );
}
