"use client";

// components/page/learner/home/LessonTab.tsx
// Lesson panel (docs/plans/dashboard-tabs.md Phase 4). It mounts the shared
// LessonFlow — the six-step milestone across every part, then Grammar, Translation
// and on to the next lesson — the same component the standalone /learner/lesson
// page mounts. The tab only supplies the part to open on (from useCurrentLesson)
// and the URL plumbing; LessonFlow owns the part/phase state and the study sidebar.
//
// `?step=` seeds the milestone step; onRunningChange arms the home tab bar's
// mid-session guard while a graded trainer step (3 or 6) runs.

import { useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useT } from "@/components/i18n/I18nProvider";
import { useCurrentLesson } from "@/hooks/lesson/useCurrentLesson";
import { LessonFlow } from "@/components/page/learner/lesson/LessonFlow";
import type { HomePanelProps } from "./HomePanel";

export const LESSON_RUN = "lesson-trainer";

export function LessonTab({ setRun }: HomePanelProps) {
  const { t } = useT();
  const searchParams = useSearchParams();
  const { loading, lesson } = useCurrentLesson();

  const stepParam = Number(searchParams.get("step"));
  const initialStep = stepParam >= 1 && stepParam <= 6 ? stepParam : undefined;

  // Written with history.replaceState, NOT router.replace, and merged onto the live
  // query string. Entering or leaving a trainer step (3, 6) fires this *and* setRun
  // (?run=) in the same tick: both rebuild the URL from window.location.search, but
  // router.replace does not update window.location synchronously, so whichever landed
  // second used a stale snapshot and dropped the other's param — the bug where the
  // ?step stuck at the pre-trainer step and a refresh snapped the milestone back a
  // step. replaceState updates the URL synchronously, so this (which runs first) is
  // seen by setRun's router.replace and the two compose. ?step is read only on mount
  // (initialStep) for refresh-resume, so it needs no re-render of its own.
  const onStepChange = useCallback(
    (step: number) => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      if (String(step) === params.get("step")) return;
      params.set("step", String(step));
      window.history.replaceState(null, "", `?${params.toString()}`);
    },
    []
  );

  const onRunningChange = useCallback(
    (running: boolean) => setRun(running ? LESSON_RUN : null),
    [setRun]
  );

  if (loading) return <p className="learner-home-note">{t("home.lesson_loading")}</p>;

  if (!lesson?.passage_id) {
    return (
      <div className="learner-home-note">
        <p className="learner-home-note-text">{t("home.lesson_empty")}</p>
        <Link className="learner-home-note-link" href="/learner/hsk">
          {t("home.lesson_browse")}
        </Link>
      </div>
    );
  }

  return (
    <LessonFlow
      passageId={lesson.passage_id}
      initialStep={initialStep}
      onStepChange={onStepChange}
      onRunningChange={onRunningChange}
    />
  );
}
