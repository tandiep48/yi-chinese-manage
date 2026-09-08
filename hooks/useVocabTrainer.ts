"use client";

// hooks/useVocabTrainer.ts
// State machine for the batch vocab trainer, porting the session logic of
// Learning/web_app/static/vocab/vocab_training_batch.js (entry resolution, answer
// recording + per-activity batch flush, the results popup, the recap, and
// retry-missed). The activity building itself lives in lib/lessons/vocabTrainer.ts;
// the per-activity UI lives in the TypingActivity / MatchActivity components.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/i18n/I18nProvider";
import { now } from "@/lib/clock";
import {
  buildActivities,
  type Activity,
  type TrainerWord,
  type VocabActivityType,
} from "@/lib/lessons/vocabTrainer";
import {
  resolveTrainerWords,
  submitVocabBatch,
  type TrainerWordsPayload,
  type VocabTrainerRecord,
} from "@/lib/api/vocabTrainer";
import type { TrainerScreen } from "@/components/page/learner/trainer/TrainerShell";

const WORDS_KEY = "selectedVocabTrainerWords";
const TYPES_KEY = "vocabTrainerActivityTypes";
const WIDE_KEY = "lessonWideVocabTrainer";

// Read without consuming. Removal is deferred until the selection has been resolved
// so React StrictMode's double-invoked mount effect (dev) doesn't drop the entry data
// on its second pass — the first pass is cancelled and would otherwise leave nothing.
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

export interface UseVocabTrainer {
  screen: TrainerScreen;
  subtitle: string;
  progress: number;
  counterText: string;
  activity: Activity | null;
  activityKey: number;
  recordAnswer: (
    row: TrainerWord,
    type: string,
    userAnswer: string,
    isCorrect: boolean,
    responseMs: number,
    wrongAttempts?: number
  ) => void;
  advance: () => void;
  popupOpen: boolean;
  popupTotal: number;
  popupCorrect: number;
  continueToRecap: () => void;
  missed: TrainerWord[];
  canRetry: boolean;
  retryMissed: () => void;
  goHome: () => void;
}

export function useVocabTrainer(): UseVocabTrainer {
  const router = useRouter();
  const { t } = useT();

  const [screen, setScreen] = useState<TrainerScreen>("loading");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [index, setIndex] = useState(0);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupStats, setPopupStats] = useState({ total: 0, correct: 0 });
  const [missed, setMissed] = useState<TrainerWord[]>([]);
  // The lesson-part passage this run was launched from (mode-6 deep link), if any.
  const [passageId, setPassageId] = useState<string | null>(null);

  // Kept in refs so the answer callbacks never read stale values across renders.
  const wordsRef = useRef<TrainerWord[]>([]);
  const typesRef = useRef<VocabActivityType[] | undefined>(undefined);
  const sessionIdRef = useRef(0);
  const isRetryRef = useRef(false);
  const pendingRef = useRef<VocabTrainerRecord[]>([]);
  const missedRef = useRef<TrainerWord[]>([]);
  const totalsRef = useRef({ total: 0, correct: 0 });

  const start = useCallback((rows: TrainerWord[]) => {
    sessionIdRef.current = now();
    isRetryRef.current = false;
    pendingRef.current = [];
    missedRef.current = [];
    totalsRef.current = { total: 0, correct: 0 };
    setMissed([]);
    setActivities(buildActivities(rows, typesRef.current));
    setIndex(0);
    setScreen("training");
  }, []);

  // Entry resolution — mirrors the DOMContentLoaded handler in vocab_training_batch.js.
  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);

    const rawTypes = peekJson<string[]>(TYPES_KEY);
    typesRef.current =
      Array.isArray(rawTypes) && rawTypes.length ? (rawTypes as VocabActivityType[]) : undefined;

    const selectedWords = peekJson<string[]>(WORDS_KEY);
    const wide = peekJson<{ passage_ids?: string[] }>(WIDE_KEY);
    let payload: TrainerWordsPayload | null = null;
    const keysToClear: string[] = [];
    if (Array.isArray(selectedWords) && selectedWords.length) {
      payload = { words: selectedWords.filter(Boolean) };
      keysToClear.push(WORDS_KEY, TYPES_KEY);
    } else if (Array.isArray(wide?.passage_ids) && wide.passage_ids.length) {
      // Lesson-wide (master) run from the part picker: union all the lesson's parts.
      payload = { passage_ids: wide.passage_ids };
      keysToClear.push(WIDE_KEY, TYPES_KEY);
    } else if (params.get("mode") === "6" && params.get("passage_id")) {
      const pid = params.get("passage_id")!;
      setPassageId(pid);
      payload = { passage_id: pid };
      keysToClear.push(TYPES_KEY);
    }

    if (!payload) {
      router.replace("/vocab");
      return;
    }

    resolveTrainerWords(payload).then((rows) => {
      if (cancelled) return;
      clearKeys(keysToClear);
      if (!rows.length) {
        router.replace("/vocab");
        return;
      }
      wordsRef.current = rows;
      start(rows);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flush = useCallback(() => {
    if (!pendingRef.current.length) return;
    const batch = pendingRef.current;
    pendingRef.current = [];
    submitVocabBatch(sessionIdRef.current, batch);
  }, []);

  const recordAnswer = useCallback<UseVocabTrainer["recordAnswer"]>(
    (row, type, userAnswer, isCorrect, responseMs, wrongAttempts = 0) => {
      // Matching reports once on solve (always correct) with a mistake count; a word
      // that needed a retry counts as missed, so mastery / retry-missed are unchanged.
      const clean = isCorrect && !wrongAttempts;
      totalsRef.current.total += 1;
      if (clean) totalsRef.current.correct += 1;
      else missedRef.current.push(row);

      pendingRef.current.push({
        type,
        word: row.word,
        round_num: isRetryRef.current ? 2 : 1,
        user_answer: userAnswer,
        is_correct: clean,
        response_time_ms: 0,
        game_info: { pinyin: row.pinyin, meaning_en: row.meaning_en },
      });
    },
    []
  );

  const finish = useCallback(() => {
    flush();
    setPopupStats({ ...totalsRef.current });
    setPopupOpen(true);
  }, [flush]);

  const advance = useCallback(() => {
    flush();
    setIndex((i) => {
      const next = i + 1;
      if (next >= activities.length) {
        finish();
        return i;
      }
      return next;
    });
  }, [activities.length, finish, flush]);

  const continueToRecap = useCallback(() => {
    setPopupOpen(false);
    // De-dupe missed words for the recap table / retry pool.
    const seen = new Set<string>();
    const unique: TrainerWord[] = [];
    missedRef.current.forEach((row) => {
      if (seen.has(row.word)) return;
      seen.add(row.word);
      unique.push(row);
    });
    setMissed(unique);
    setScreen("complete");
  }, []);

  const retryMissed = useCallback(() => {
    if (!missed.length) return;
    isRetryRef.current = true;
    pendingRef.current = [];
    missedRef.current = [];
    totalsRef.current = { total: 0, correct: 0 };
    setActivities(buildActivities(missed, typesRef.current));
    setIndex(0);
    setScreen("training");
  }, [missed]);

  const goHome = useCallback(() => {
    if (passageId) {
      router.push(`/lesson?passage_id=${encodeURIComponent(passageId)}`);
      return;
    }
    router.push("/vocab");
  }, [router, passageId]);

  const activity = activities[index] ?? null;

  const subtitle = useMemo(() => {
    if (!passageId) return "";
    const parts = String(passageId).split("_");
    const hskRaw = parts[0] || "";
    const hsk = hskRaw ? (hskRaw.startsWith("HSK") ? hskRaw : "HSK" + hskRaw.replace(/^H/, "")) : "";
    const lessonLabel = parts[1] ? `${t("picker.lesson_prefix")} ${parts[1]}` : "";
    const partLabel = parts[2] ? `${t("picker.part_prefix")} ${parts[2]}` : "";
    return [hsk, lessonLabel, partLabel].filter(Boolean).join(" · ");
  }, [t, passageId]);

  const totalGroups = activities.length ? activities[activities.length - 1].groupIndex + 1 : 1;
  const progress = activities.length ? index / activities.length : 0;
  const counterText = activity
    ? t("vocab_trainer.group_counter", { current: activity.groupIndex + 1, total: totalGroups })
    : "";

  return {
    screen,
    subtitle,
    progress,
    counterText,
    activity,
    activityKey: index,
    recordAnswer,
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
