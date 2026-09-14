"use client";

// components/page/learner/competition/SectionScreen.tsx
// The in-room play screen: the room bar with the task/group counter and the player's
// live score, the trainer for the room's mode, the live scoreboard, and the action bar
// the activity's Skip/Next button portals into. Ported from the #screen-section section
// of learn_together.html plus startTrainer() / startLessonTrainer() /
// mountCompetitionAction() in competition.js.
//
// Vocab rooms resolve and group their words in the browser; lesson rooms play the task
// list the server generated at session start. Both trainers' hooks run either way — the
// one that is not in play is handed null and stays idle — so the hook order is stable.

import { useEffect, useState } from "react";
import { useT } from "@/components/i18n/I18nProvider";
import { TrainerActionSlotProvider } from "@/components/page/learner/trainer/TrainerShell";
import { TypingActivity } from "@/components/page/learner/vocab-training/TypingActivity";
import { MatchActivity } from "@/components/page/learner/vocab-training/MatchActivity";
import { ChoiceTask } from "@/components/page/learner/lesson-training/ChoiceTask";
import { TypingTask } from "@/components/page/learner/lesson-training/TypingTask";
import { ReorderTask } from "@/components/page/learner/lesson-training/ReorderTask";
import { useCompetitionTrainer } from "@/hooks/useCompetitionTrainer";
import { useCompetitionLessonTrainer } from "@/hooks/useCompetitionLessonTrainer";
import type { CompetitionRoom, CompetitionScore, CompetitionSession } from "@/lib/types/types";
import { RankingList } from "./RankingList";

// A correct multiple-choice answer holds for 800ms here, not the solo trainer's 3s
// (lesson_trainer_core.js).
const COMPETITION_MC_DELAY_MS = 800;

export function SectionScreen({
  room,
  session,
  scores,
  userId,
  onVocabAnswer,
  onLessonAnswer,
  onFinish,
}: {
  room: CompetitionRoom | null;
  session: CompetitionSession | null;
  scores: CompetitionScore[];
  userId: number | null;
  onVocabAnswer: (
    word: string,
    activityType: string,
    isCorrect: boolean,
    responseMs: number,
    wrongAttempts: number
  ) => void;
  onLessonAnswer: (
    itemKey: string,
    taskType: string,
    isCorrect: boolean,
    responseMs: number
  ) => void;
  onFinish: () => void;
}) {
  const { t } = useT();
  const [actionBar, setActionBar] = useState<HTMLElement | null>(null);
  const isLesson = room?.category === "lesson";

  const vocab = useCompetitionTrainer({
    room: isLesson ? null : room,
    onAnswer: onVocabAnswer,
    onFinish,
  });
  const lesson = useCompetitionLessonTrainer({
    session: isLesson ? session : null,
    onAnswer: onLessonAnswer,
    onFinish,
  });

  // Enter advances via the activity's primary action, unless a text field has focus
  // (typing inputs manage their own Enter).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      const active = document.activeElement as HTMLElement | null;
      if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;
      const btn = document.querySelector<HTMLButtonElement>(
        ".competition-action-bar .bt-primary-action:not([disabled])"
      );
      if (btn) {
        e.preventDefault();
        btn.click();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const myScore = scores.find((score) => Number(score.user_id) === Number(userId));
  const activity = vocab.activity;
  const task = lesson.task;

  function renderBody() {
    if (isLesson) {
      if (lesson.status === "empty") {
        return <div className="competition-empty">{t("competition.no_tasks")}</div>;
      }
      if (!task) return null;
      const props = {
        task,
        onResolved: lesson.recordAnswer,
        onAdvance: lesson.advance,
      };
      if (task.type === "typing") return <TypingTask key={lesson.taskKey} {...props} />;
      if (task.type === "reorder") return <ReorderTask key={lesson.taskKey} {...props} />;
      return <ChoiceTask key={lesson.taskKey} {...props} mcDelayMs={COMPETITION_MC_DELAY_MS} />;
    }

    if (vocab.status === "empty") {
      return <div className="competition-empty">{t("competition.no_words")}</div>;
    }
    if (vocab.status === "loading") {
      return <div className="competition-empty">{t("competition.loading")}</div>;
    }
    if (!activity) return null;
    return activity.type === "typing" ? (
      <TypingActivity
        key={vocab.activityKey}
        activity={activity}
        onRecord={vocab.recordAnswer}
        onAdvance={vocab.advance}
        autoAdvance
      />
    ) : (
      <MatchActivity
        key={vocab.activityKey}
        activity={activity}
        onRecord={vocab.recordAnswer}
        onAdvance={vocab.advance}
        autoAdvance
        keyboardShortcuts
      />
    );
  }

  return (
    <section className="competition-screen active">
      <div className="competition-room-bar">
        <div>
          <span className="competition-label">{t("competition.room_label")}</span>
          <strong>{room?.room_code || ""}</strong>
        </div>
        <div className="competition-section-meta">
          <span className="competition-progress">
            {isLesson ? lesson.counterText : vocab.counterText}
          </span>
          <div className="score-pill">
            {t("competition.points", { n: myScore?.total_points || 0 })}
          </div>
        </div>
      </div>

      <div className="competition-play-grid">
        {/* The boards reuse the solo trainers' scoped styles (.vocab-trainer .bt-* /
            .lesson-trainer .lt-*) — the legacy page loads the same stylesheets — and
            they resolve against the sage tokens on .competition-shell. */}
        <div className={`competition-trainer ${isLesson ? "lesson-trainer" : "vocab-trainer"}`}>
          <TrainerActionSlotProvider slot={actionBar}>{renderBody()}</TrainerActionSlotProvider>
        </div>

        <aside className="competition-scoreboard-panel">
          <h3>{t("competition.scoreboard")}</h3>
          <RankingList scores={scores} />
        </aside>
      </div>

      <div className="competition-action-bar" ref={setActionBar} />
    </section>
  );
}
