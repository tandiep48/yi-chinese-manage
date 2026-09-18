"use client";

// hooks/useCompetitionLessonTrainer.ts
// The in-room lesson trainer for Learn Together, porting startLessonTrainer() /
// emitLessonAnswer() from Learning/web_app/static/competition/competition.js and the
// flow of static/lesson/lesson_trainer_core.js.
//
// Unlike the vocab competition (which resolves and groups its words in the browser),
// the lesson room's tasks are generated ONCE on the server at session start — already
// filtered to the room's chosen task types and rendered in the host's language — and
// ride along on the session payload, so every participant answers the same questions
// in the same order. This hook only walks that list.

import { useCallback, useState } from "react";
import { useT } from "@/components/i18n/I18nProvider";
import { lessonItemKey } from "@/lib/competition/roomLogic";
import type { CompetitionSession } from "@/lib/types/competition";
import type { LessonTask } from "@/lib/types/lesson";

export type CompetitionLessonStatus = "playing" | "empty";

export function useCompetitionLessonTrainer({
  session,
  onAnswer,
  onFinish,
}: {
  session: CompetitionSession | null;
  onAnswer: (itemKey: string, taskType: string, isCorrect: boolean, responseMs: number) => void;
  onFinish: () => void;
}) {
  const { t } = useT();
  const [index, setIndex] = useState(0);

  const tasks: LessonTask[] = session?.lesson_tasks ?? [];

  const advance = useCallback(() => {
    setIndex((i) => {
      const next = i + 1;
      if (next >= tasks.length) {
        onFinish();
        return i;
      }
      return next;
    });
  }, [tasks.length, onFinish]);

  // The task components report (task, answer, isCorrect, skipped, ms); the socket needs
  // the task's identity and whether it was right. A skip is simply a wrong answer.
  const recordAnswer = useCallback(
    (
      task: LessonTask,
      _userAnswer: string,
      isCorrect: boolean,
      _skipped: boolean,
      responseMs: number
    ) => {
      onAnswer(lessonItemKey(task), task.type, isCorrect, responseMs);
    },
    [onAnswer]
  );

  const task = tasks[index] ?? null;
  const status: CompetitionLessonStatus = tasks.length ? "playing" : "empty";
  const counterText = task
    ? t("trainer.task_counter", { current: index + 1, total: tasks.length })
    : "";

  return { status, task, taskKey: index, counterText, recordAnswer, advance };
}
