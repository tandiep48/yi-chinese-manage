"use client";

// hooks/useLessonTrainer.ts
// State machine for the solo lesson trainer, porting the session logic of
// Learning/web_app/static/lesson/lesson.js: entry resolution (a ?passage_id part or a
// lesson-wide master run stashed in sessionStorage), starting the server session,
// per-answer submit + missed tracking, the results popup, the recap and retry-missed,
// and saving part progress. The per-task UI/flow lives in useLessonTaskFlow + the
// ChoiceTask / TypingTask / ReorderTask components.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/i18n/I18nProvider";
import { now } from "@/lib/clock";
import { partPickerHref } from "@/lib/lessons/lessons";
import { filterTasksByType } from "@/lib/lessons/lessonTrainer";
import {
  startLessonSession,
  submitLessonAnswer,
  completeLessonPart,
} from "@/lib/api/learner/lessons";
import type { LessonTask, LessonTaskType } from "@/lib/types/lesson";
import type { TrainerScreen } from "@/components/page/learner/trainer/TrainerShell";

const WIDE_KEY = "lessonWideLessonTrainer";
const TYPES_KEY = "lessonTrainerActivityTypes";

function peekJson<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function clearKeys(keys: string[]) {
  keys.forEach((k) => {
    try {
      sessionStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  });
}

export interface MissedTask {
  task: LessonTask;
  userAnswer: string;
}

export interface UseLessonTrainer {
  screen: TrainerScreen;
  subtitle: string;
  progress: number;
  counterText: string;
  task: LessonTask | null;
  taskKey: number;
  onResolved: (
    task: LessonTask,
    userAnswer: string,
    isCorrect: boolean,
    skipped: boolean,
    responseMs: number
  ) => void;
  advance: () => void;
  popupOpen: boolean;
  popupTotal: number;
  popupCorrect: number;
  continueToRecap: () => void;
  missed: MissedTask[];
  canRetry: boolean;
  retryMissed: () => void;
  goHome: () => void;
}

function shuffle<T>(input: readonly T[]): T[] {
  const arr = input.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function useLessonTrainer(): UseLessonTrainer {
  const router = useRouter();
  const { t } = useT();

  const [screen, setScreen] = useState<TrainerScreen>("loading");
  const [tasks, setTasks] = useState<LessonTask[]>([]);
  const [index, setIndex] = useState(0);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupStats, setPopupStats] = useState({ total: 0, correct: 0 });
  const [missed, setMissed] = useState<MissedTask[]>([]);

  const sessionIdRef = useRef(0);
  const modeRef = useRef<"part" | "master">("part");
  const passageIdsRef = useRef<string[]>([]);
  const typesRef = useRef<LessonTaskType[] | undefined>(undefined);
  const missedRef = useRef<MissedTask[]>([]);
  const totalRef = useRef(0);

  const homeHref = useCallback(() => {
    const ids = passageIdsRef.current;
    if (!ids.length) return "/learner/hsk";
    return modeRef.current === "master"
      ? partPickerHref(ids[0])
      : `/learner/lesson?passage_id=${encodeURIComponent(ids[0])}`;
  }, []);

  const beginRound = useCallback((roundTasks: LessonTask[]) => {
    missedRef.current = [];
    totalRef.current = roundTasks.length;
    setMissed([]);
    setTasks(roundTasks);
    setIndex(0);
    setScreen("training");
  }, []);

  // Entry resolution — mirrors window.onload in lesson.js. Peek sessionStorage (don't
  // consume) so React StrictMode's double-invoked effect keeps the data on its second
  // pass; clear only after the session resolves.
  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);

    const rawTypes = peekJson<string[]>(TYPES_KEY);
    typesRef.current =
      Array.isArray(rawTypes) && rawTypes.length ? (rawTypes as LessonTaskType[]) : undefined;

    const wide = peekJson<{ passage_ids?: string[] }>(WIDE_KEY);
    let passageIds: string[] = [];
    let mode: "part" | "master" = "part";
    if (Array.isArray(wide?.passage_ids) && wide.passage_ids.length) {
      passageIds = wide.passage_ids;
      mode = "master";
    } else if (params.get("passage_id")) {
      passageIds = [params.get("passage_id")!];
      mode = "part";
    }

    // Pinyin-guide placeholders and the Numbers pseudo-part aren't graded lessons.
    const first = passageIds[0];
    if (first === "H1_1_1") {
      router.replace("/learner/lesson/basic-pinyin");
      return;
    }
    if (first === "H1_1_2") {
      router.replace("/learner/lesson/advanced-pinyin");
      return;
    }
    if (!passageIds.length || first === "H1_5_99") {
      router.replace(passageIds.length ? `/learner/lesson?passage_id=${encodeURIComponent(first)}` : "/learner/hsk");
      return;
    }

    modeRef.current = mode;
    passageIdsRef.current = passageIds;

    startLessonSession(passageIds, mode)
      .then((data) => {
        if (cancelled) return;
        clearKeys([WIDE_KEY, TYPES_KEY]);
        sessionIdRef.current = data.session_id ?? now();
        const roundTasks = filterTasksByType(data.tasks ?? [], typesRef.current);
        if (!roundTasks.length) {
          router.replace(homeHref());
          return;
        }
        beginRound(roundTasks);
      })
      .catch(() => {
        if (cancelled) return;
        clearKeys([WIDE_KEY, TYPES_KEY]);
        router.replace(homeHref());
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onResolved = useCallback<UseLessonTrainer["onResolved"]>(
    (task, userAnswer, isCorrect, skipped, responseMs) => {
      if (!isCorrect) missedRef.current.push({ task, userAnswer });

      const gameInfo: Record<string, unknown> = {};
      if (skipped) gameInfo.skipped = true;
      if (task.options) gameInfo.options = task.options;
      if (task.shuffled_tokens) gameInfo.tokens = task.shuffled_tokens;

      submitLessonAnswer({
        session_id: sessionIdRef.current,
        passage_id: task.passage_id,
        line_id: task.line_id,
        type: task.type,
        user_answer: userAnswer,
        correct_answer: task.correct_answer,
        is_correct: isCorrect,
        response_time_ms: responseMs,
        game_info: gameInfo,
      });
    },
    []
  );

  const finish = useCallback(() => {
    const total = totalRef.current;
    const correct = Math.max(0, total - missedRef.current.length);
    // Save progress for every passage in the run (master records a %, part completes
    // at the pass threshold; word mastery is server-gated to a perfect round).
    passageIdsRef.current.forEach((pid) => completeLessonPart(pid, total, correct, modeRef.current));
    setPopupStats({ total, correct });
    setPopupOpen(true);
  }, []);

  const advance = useCallback(() => {
    setIndex((i) => {
      const next = i + 1;
      if (next >= tasks.length) {
        finish();
        return i;
      }
      return next;
    });
  }, [tasks.length, finish]);

  const continueToRecap = useCallback(() => {
    setPopupOpen(false);
    setMissed(missedRef.current.slice());
    setScreen("complete");
  }, []);

  const retryMissed = useCallback(() => {
    if (!missed.length) return;
    beginRound(shuffle(missed.map((m) => m.task)));
  }, [missed, beginRound]);

  const goHome = useCallback(() => {
    router.push(homeHref());
  }, [router, homeHref]);

  const task = tasks[index] ?? null;

  const subtitle = useMemo(() => {
    if (!task) return "";
    const parts = String(task.passage_id || "").split("_");
    let hsk = task.hsk_level || "";
    if (hsk && !String(hsk).startsWith("HSK")) hsk = "HSK" + String(hsk).replace(/^H/, "");
    const lessonLabel = parts[1] ? `${t("picker.lesson_prefix")} ${parts[1]}` : "";
    const partLabel = parts[2] ? `${t("picker.part_prefix")} ${parts[2]}` : "";
    return [hsk, lessonLabel, partLabel].filter(Boolean).join(" · ");
  }, [t, task]);

  const total = tasks.length;
  const progress = total ? index / total : 0;
  const counterText = total ? t("trainer.task_counter", { current: index + 1, total }) : "";

  return {
    screen,
    subtitle,
    progress,
    counterText,
    task,
    taskKey: index,
    onResolved,
    advance,
    popupOpen,
    popupTotal: popupStats.total,
    popupCorrect: popupStats.correct,
    continueToRecap,
    missed,
    canRetry: missed.length > 0,
    retryMissed,
    goHome,
  };
}
