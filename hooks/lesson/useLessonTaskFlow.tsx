"use client";

// hooks/lesson/useLessonTaskFlow.tsx
// Shared per-task flow for the lesson trainer's three task components, porting the
// answer / skip / advance handling of Learning/web_app/static/lesson/lesson.js. Each
// task owns its own Skip→Next button (portaled into the trainer bottom bar, like the
// vocab trainer's Check button) and its audio:
//   - commit(answer, isCorrect, skipped): records + submits once, then either
//     auto-advances (correct — after the audio finishes for typing/reorder, or a
//     fixed delay for multiple choice) or turns Skip into Next (wrong / skipped).
//   - the Skip button reveals the answer as a miss; Next advances.

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useT } from "@/components/i18n/I18nProvider";
import { now } from "@/lib/clock";
import { lessonTaskAudioUrl, MC_CORRECT_DELAY_MS } from "@/lib/lessons/lessonTrainer";
import { useTrainerActionSlot } from "@/components/page/learner/trainer/TrainerShell";
import type { LessonTask } from "@/lib/types/lesson";

export type TaskOutcome = "correct" | "wrong" | "skipped" | null;

export interface LessonTaskFlow {
  answered: boolean;
  outcome: TaskOutcome;
  audioSrc: string | null;
  playAudio: () => void;
  commit: (userAnswer: string, isCorrect: boolean) => void;
  buttonPortal: React.ReactNode;
}

export function useLessonTaskFlow({
  task,
  onResolved,
  onAdvance,
  mcDelayMs = MC_CORRECT_DELAY_MS,
}: {
  task: LessonTask;
  onResolved: (
    task: LessonTask,
    userAnswer: string,
    isCorrect: boolean,
    skipped: boolean,
    responseMs: number
  ) => void;
  onAdvance: () => void;
  // How long a correct multiple-choice answer stays on screen. The solo trainer holds
  // it for lesson.js's 3s; Learn Together moves on after 800ms so the room keeps pace
  // (lesson_trainer_core.js).
  mcDelayMs?: number;
}): LessonTaskFlow {
  const { t } = useT();
  const slot = useTrainerActionSlot();
  const [answered, setAnswered] = useState(false);
  const [outcome, setOutcome] = useState<TaskOutcome>(null);

  const startRef = useRef(now());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioSrc = useMemo(() => lessonTaskAudioUrl(task), [task]);

  useEffect(() => {
    // One audio element per task; tear it down on unmount.
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  function ensureAudio(): HTMLAudioElement | null {
    if (!audioSrc) return null;
    if (!audioRef.current) audioRef.current = new Audio();
    if (audioRef.current.src !== audioSrc) audioRef.current.src = audioSrc;
    return audioRef.current;
  }

  function playAudio() {
    const el = ensureAudio();
    if (!el) return;
    try {
      el.currentTime = 0;
      void el.play().catch(() => {});
    } catch {
      /* ignore playback errors */
    }
  }

  // Play the task audio and resolve when it ends (bounded), so typing/reorder answers
  // let the audio finish before advancing. Resolves quickly when there is no audio.
  function playAudioToEnd(): Promise<void> {
    const el = ensureAudio();
    if (!el) return new Promise((r) => window.setTimeout(r, 500));
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };
      try {
        el.onended = finish;
        el.onerror = finish;
        el.currentTime = 0;
        void el.play().catch(finish);
      } catch {
        finish();
      }
      window.setTimeout(finish, 6000);
    });
  }

  function resolve(userAnswer: string, isCorrect: boolean, skipped: boolean) {
    if (answered) return;
    setAnswered(true);
    setOutcome(isCorrect ? "correct" : skipped ? "skipped" : "wrong");
    onResolved(task, userAnswer, isCorrect, skipped, now() - startRef.current);
    if (isCorrect) {
      if (task.type === "typing" || task.type === "reorder") {
        void playAudioToEnd().then(onAdvance);
      } else {
        window.setTimeout(onAdvance, mcDelayMs);
      }
    }
    // wrong / skipped: the Next button (below) advances when the learner is ready.
  }

  const commit = (userAnswer: string, isCorrect: boolean) => resolve(userAnswer, isCorrect, false);
  const skip = () => resolve("", false, true);

  // Skip before answering; Next after a wrong/skipped answer; nothing after a correct
  // one (it auto-advances). Portaled into the shared bottom bar.
  let button: React.ReactNode = null;
  if (!answered) {
    button = (
      <button type="button" className="btn secondary bt-primary-action skip-bottom-btn" onClick={skip}>
        {t("trainer.skip")}
      </button>
    );
  } else if (outcome !== "correct") {
    button = (
      <button type="button" className="btn secondary bt-primary-action skip-bottom-btn" onClick={onAdvance}>
        {t("lesson.next")}
      </button>
    );
  }
  const buttonPortal = slot && button ? createPortal(button, slot) : null;

  return { answered, outcome, audioSrc, playAudio, commit, buttonPortal };
}
