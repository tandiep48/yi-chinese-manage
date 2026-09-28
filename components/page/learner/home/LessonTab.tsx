"use client";

// components/page/learner/home/LessonTab.tsx
// Lesson panel (docs/plans/dashboard-tabs.md Phase 4). It mounts the same shared
// MilestoneRunner that /learner/lesson mounts — the tab only supplies the part to
// run and the URL plumbing; everything else is the milestone's own state.
//
// The part comes from useCurrentLesson(), one request against the same
// /api/dashboard/current-lesson endpoint the old dashboard card used. With no
// recent lesson there is nothing to run, so the panel points at the picker.
//
// `?run=` from Phase 1 becomes `?step=` here: the milestone owns the step, and
// the shell's mid-session guard is armed only while a graded step's trainer is
// actually running (steps 3 and 6), which is the only time switching tabs costs
// the learner a round.
//
// MilestoneRunner keeps its own `.milestone` root and stylesheet, and mounts no
// LessonStudyShell — the sidebar belongs to /learner/lesson, not to a dashboard
// panel that already has a tab bar for navigation (§2, §10.6).

import { useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useT } from "@/components/i18n/I18nProvider";
import { useCurrentLesson } from "@/hooks/lesson/useCurrentLesson";
import { MilestoneRunner } from "@/components/page/learner/milestone/MilestoneRunner";
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
  // this fires from an effect inside MilestoneRunner, which can run after the tab
  // bar has already written a new `?tab=`. Rebuilding from a stale capture would
  // put the old tab back — the same race useLearnerHome's setRun had.
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
    <MilestoneRunner
      passageId={lesson.passage_id}
      passageIds={lesson.passage_ids}
      initialStep={initialStep}
      onStepChange={onStepChange}
      onRunningChange={onRunningChange}
    />
  );
}
