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
import { useRouter, useSearchParams } from "next/navigation";
import { useT } from "@/components/i18n/I18nProvider";
import { useCurrentLesson } from "@/hooks/lesson/useCurrentLesson";
import { LessonFlow } from "@/components/page/learner/lesson/LessonFlow";
import type { HomePanelProps } from "./HomePanel";

export const LESSON_RUN = "lesson-trainer";

export function LessonTab({ setRun }: HomePanelProps) {
  const { t } = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loading, lesson } = useCurrentLesson();

  const stepParam = Number(searchParams.get("step"));
  const initialStep = stepParam >= 1 && stepParam <= 6 ? stepParam : undefined;

  // Merged onto the live query string, not the one captured on the last render:
  // this fires from an effect inside the milestone, which can run after the tab bar
  // has already written a new `?tab=`. Rebuilding from a stale capture would put the
  // old tab back — the same race useLearnerHome's setRun had.
  const onStepChange = useCallback(
    (step: number) => {
      const params = new URLSearchParams(
        typeof window !== "undefined" ? window.location.search : searchParams.toString()
      );
      if (String(step) === params.get("step")) return;
      params.set("step", String(step));
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
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
