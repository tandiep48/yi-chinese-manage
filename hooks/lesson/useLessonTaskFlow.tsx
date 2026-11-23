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
//   - a correct typing / reorder answer plays its sentence audio, and Next stays
//     disabled until that audio has ended — or failed to play, so a missing or broken
//     clip never strands the learner.

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useT } from "@/components/i18n/I18nProvider";
import { now } from "@/lib/clock";
import { lessonTaskAudioUrl, MC_CORRECT_DELAY_MS } from "@/lib/lessons/lessonTrainer";
import { useTrainerActionSlot } from "@/components/page/learner/trainer/TrainerShell";
import type { LessonTask } from "@/lib/types/lesson";

// Upper bound on waiting for the reveal audio, so a clip that never reports "ended"
// or "error" cannot hold the learner on the question forever.
const AUDIO_SAFETY_MS = 15000;

export type TaskOutcome = "correct" | "wrong" | "skipped" | null;

export interface LessonTaskFlow {
  answered: boolean;
  outcome: TaskOutcome;
  audioSrc: string | null;
  // True while the task audio is playing, so the play button can show a stop icon.
  isPlaying: boolean;
  playAudio: () => void;
  stopAudio: () => void;
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
  const [isPlaying, setIsPlaying] = useState(false);
  // False while a correct answer's reveal audio is still playing; gates Next.
  const [audioDone, setAudioDone] = useState(true);

  const startRef = useRef(now());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const advanceTimerRef = useRef<number | null>(null);
  const advancedRef = useRef(false);
  const audioSrc = useMemo(() => lessonTaskAudioUrl(task), [task]);

  useEffect(() => {
    // One audio element + pending auto-advance per task; tear them down on unmount.
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (advanceTimerRef.current != null) {
        window.clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
    };
  }, []);

  // A correct answer both auto-advances (after the MC delay / reveal audio) and now
  // shows a Next button so the learner can move on at once. Whichever fires first
  // wins; the other is a no-op, so a task never advances twice.
  function advanceOnce() {
    if (advancedRef.current) return;
    advancedRef.current = true;
    if (advanceTimerRef.current != null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    onAdvance();
  }

  function ensureAudio(): HTMLAudioElement | null {
    if (!audioSrc) return null;
    if (!audioRef.current) {
      audioRef.current = new Audio();
      // Keep the play/stop button's icon in sync with playback. These listeners are
      // separate from the `onended` that playAudioToEnd sets, so they never clobber it.
      audioRef.current.addEventListener("play", () => setIsPlaying(true));
      audioRef.current.addEventListener("ended", () => setIsPlaying(false));
      audioRef.current.addEventListener("pause", () => setIsPlaying(false));
      audioRef.current.addEventListener("error", () => setIsPlaying(false));
    }
    if (audioRef.current.src !== audioSrc) audioRef.current.src = audioSrc;
    return audioRef.current;
  }

  function playAudio() {
    const el = ensureAudio();
    if (!el) return;
    try {
      el.currentTime = 0;
      void el.play().catch(() => setIsPlaying(false));
    } catch {
      /* ignore playback errors */
    }
  }

  function stopAudio() {
    const el = audioRef.current;
    if (!el) return;
    try {
      el.pause();
      el.currentTime = 0;
    } catch {
      /* ignore */
    }
    setIsPlaying(false);
  }

  // Play the task audio and resolve when it ends (or fails), so typing/reorder answers
  // let the audio finish before advancing. Resolves quickly when there is no audio.
  function playAudioToEnd(): Promise<void> {
    const el = ensureAudio();
    if (!el) {
      setAudioDone(true);
      return new Promise((r) => window.setTimeout(r, 500));
    }
    setAudioDone(false);
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        setAudioDone(true);
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
      window.setTimeout(finish, AUDIO_SAFETY_MS);
    });
  }

  function resolve(userAnswer: string, isCorrect: boolean, skipped: boolean) {
    if (answered) return;
    setAnswered(true);
    setOutcome(isCorrect ? "correct" : skipped ? "skipped" : "wrong");
    onResolved(task, userAnswer, isCorrect, skipped, now() - startRef.current);
    if (isCorrect) {
      if (task.type === "typing" || task.type === "reorder") {
        void playAudioToEnd().then(advanceOnce);
      } else {
        advanceTimerRef.current = window.setTimeout(advanceOnce, mcDelayMs);
      }
    }
    // wrong / skipped: the Next button (below) advances when the learner is ready.
  }

  const commit = (userAnswer: string, isCorrect: boolean) => resolve(userAnswer, isCorrect, false);
  const skip = () => resolve("", false, true);

  // Skip before answering; once answered, Next is shown — a wrong/skipped answer waits
  // for it, and a correct one offers it once its audio (if any) has finished.
  // Portaled into the shared bottom bar.
  let button: React.ReactNode = null;
  if (!answered) {
    button = (
      <button type="button" className="btn secondary bt-primary-action skip-bottom-btn" onClick={skip}>
        {t("trainer.skip")}
      </button>
    );
  } else {
    button = (
      <button
        type="button"
        className="btn secondary bt-primary-action skip-bottom-btn"
        disabled={!audioDone}
        onClick={advanceOnce}
      >
        {t("lesson.next")}
      </button>
    );
  }
  const buttonPortal = slot && button ? createPortal(button, slot) : null;

  return { answered, outcome, audioSrc, isPlaying, playAudio, stopAudio, commit, buttonPortal };
}
