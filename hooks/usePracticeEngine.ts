"use client";

// hooks/usePracticeEngine.ts
// The practice/exam session state machine, ported from the module-level globals
// of Learning/web_app/static/practice/practice_engine.js. Owns session loading,
// per-group answer state (persisted across navigation), scoring, and submit.
// Both shells (sidebar = practice_standard, bottom-nav = multi) consume this.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getPracticeLesson,
  getPracticeMulti,
  getPracticeProgressGroup,
  submitPractice,
} from "@/lib/api/practice";
import {
  buildAnswerRows,
  firstUncheckedAfter,
  allChecked,
  resultIcon,
} from "@/lib/practice/practiceEngine";
import {
  applyBlankFocus,
  applyCheck,
  applyChipToggle,
  applyKeySelection,
  applyMCSelection,
  applyT6Assignment,
  freshGroupState,
  type GroupUIState,
} from "@/lib/practice/groupState";
import { now } from "@/lib/clock";
import type { PracticeAnswerRow, PracticeCategory, PracticeGroup, PracticeMultiItem } from "@/lib/types/practice";

export type Screen = "loading" | "practice" | "result";

export interface PracticeEngineOptions {
  category: PracticeCategory;
  number?: number | string; // hsk level (absent in multi mode)
  lessonId?: string;
  progress?: string; // deep-link to one progress group
  multi?: boolean;
}

interface ReferrerInfo {
  href: string;
  title: string;
}

export function usePracticeEngine(opts: PracticeEngineOptions) {
  const { category, number, lessonId, progress, multi } = opts;

  const [screen, setScreen] = useState<Screen>("loading");
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<PracticeGroup[]>([]);
  const [states, setStates] = useState<GroupUIState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<{ score: number; total: number; icon: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [referrer, setReferrer] = useState<ReferrerInfo>({
    href: category === "exam" ? "/learner/exam" : "/learner/practice",
    title: "",
  });
  const sessionIdRef = useRef<number>(0);

  const totalQuestions = useMemo(
    () => groups.reduce((s, g) => s + g.questions.length, 0),
    [groups]
  );

  // ── Session loading (mirrors loadPracticeSession) ───────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      // Resolve the referrer-aware back target once, alongside the session fetch
      // (reading sessionStorage requires the client, so it belongs in this effect).
      let ref: string | null = null;
      try {
        ref = window.sessionStorage.getItem("practice_referrer");
        window.sessionStorage.removeItem("practice_referrer");
      } catch {
        ref = null;
      }
      if (ref === "recommend") {
        setReferrer({ href: "/learner/recommend", title: "recommend" });
      } else if (ref && ref.startsWith("exam-")) {
        setReferrer({ href: `/learner/exam/${ref.split("-")[1]}`, title: `exam-${ref.split("-")[1]}` });
      } else if (ref && ref.startsWith("practice-")) {
        setReferrer({ href: `/learner/practice/${ref.split("-")[1]}`, title: `practice-${ref.split("-")[1]}` });
      }
      try {
        let loaded: PracticeGroup[];
        if (multi) {
          let raw: string | null = null;
          try {
            raw = window.sessionStorage.getItem("multi_practice_queue");
          } catch {
            raw = null;
          }
          if (!raw) {
            window.location.href = "/learner/recommend";
            return;
          }
          const items = JSON.parse(raw) as PracticeMultiItem[];
          const data = await getPracticeMulti(items);
          loaded = data.groups;
        } else if (progress) {
          const g = await getPracticeProgressGroup(
            number ?? "",
            lessonId ?? "",
            progress,
            category
          );
          loaded = [{ progress: g.progress, lesson: g.lesson, questions: g.questions }];
        } else {
          const data = await getPracticeLesson(number ?? "", lessonId ?? "", category);
          loaded = data.groups;
        }
        if (cancelled) return;
        sessionIdRef.current = now();
        const initial = loaded.map(freshGroupState);
        if (initial[0]) initial[0].startTime = now(); // start timing the first group
        setGroups(loaded);
        setStates(initial);
        setCurrentIndex(0);
        setScore(0);
        setScreen("practice");
      } catch {
        if (!cancelled) setError("load_failed");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navigate to group `i`, stamping its startTime the first time it is visited
  // (mirrors the engine setting startTime lazily when a group first renders).
  const visit = useCallback((i: number) => {
    setCurrentIndex(i);
    setStates((prev) => {
      if (!prev[i] || prev[i].startTime) return prev;
      const next = [...prev];
      next[i] = { ...next[i], startTime: now() };
      return next;
    });
  }, []);

  // ── Per-group state mutation helper ─────────────────────────────────────────
  const updateCurrent = useCallback(
    (fn: (s: GroupUIState) => GroupUIState) => {
      setStates((prev) => {
        const next = [...prev];
        next[currentIndex] = fn(next[currentIndex]);
        return next;
      });
    },
    [currentIndex]
  );

  // ── Answer interactions ─────────────────────────────────────────────────────
  const selectMC = useCallback(
    (blockId: string, key: string) => {
      updateCurrent((s) => applyMCSelection(s, blockId, key));
    },
    [updateCurrent]
  );

  // Unique-key-per-row selection (t5 grouped layouts). Toggling the same key clears it.
  const selectKey = useCallback(
    (blockId: string, key: string) => {
      updateCurrent((s) => applyKeySelection(s, blockId, key));
    },
    [updateCurrent]
  );

  const toggleChip = useCallback(
    (blockId: string, key: string) => {
      updateCurrent((s) => applyChipToggle(s, blockId, key));
    },
    [updateCurrent]
  );

  const blankClick = useCallback(
    (blockId: string, index: number) => {
      updateCurrent((s) => applyBlankFocus(s, blockId, index));
    },
    [updateCurrent]
  );

  // Assign the shared option `key` to the active blank (type 6 group). Re-clicking
  // frees the previously placed option back to the pool.
  const assignT6 = useCallback(
    (key: string) => {
      updateCurrent((s) => applyT6Assignment(s, key));
    },
    [updateCurrent]
  );

  // ── Check / scoring ─────────────────────────────────────────────────────────
  const check = useCallback(() => {
    setStates((prev) => {
      const next = [...prev];
      const s = next[currentIndex];
      if (!s) return prev;
      const group = groups[currentIndex];
      const elapsed = Math.max(0, now() - (s.startTime || now()));
      const graded = applyCheck(s, group, elapsed);
      if (!graded) return prev;
      next[currentIndex] = graded.state;
      setScore((prevScore) => prevScore + graded.correct);
      return next;
    });
  }, [currentIndex, groups]);

  // ── Navigation ──────────────────────────────────────────────────────────────
  const checkedFlags = useMemo(() => states.map((s) => !!s?.checked), [states]);
  const jumpTo = useCallback(
    (i: number) => {
      if (i >= 0 && i < groups.length) visit(i);
    },
    [groups.length, visit]
  );
  const goPrev = useCallback(() => {
    if (currentIndex > 0) visit(currentIndex - 1);
  }, [currentIndex, visit]);
  const goNext = useCallback(() => {
    const n = firstUncheckedAfter(checkedFlags, currentIndex);
    if (n !== -1) visit(n);
  }, [checkedFlags, currentIndex, visit]);

  // ── Finish / submit ─────────────────────────────────────────────────────────
  const finish = useCallback(async () => {
    if (!allChecked(checkedFlags)) {
      const i = firstUncheckedAfter(checkedFlags, -1);
      if (i !== -1) visit(i);
      return;
    }
    setSubmitting(true);
    const answers: PracticeAnswerRow[] = [];
    groups.forEach((g, i) => {
      answers.push(...buildAnswerRows(g, states[i].userAnswers, states[i].perQuestionTimeMs, category));
    });
    try {
      await submitPractice({
        session_id: sessionIdRef.current,
        hsk_level: number ?? null,
        lesson: lessonId ?? null,
        answers,
      });
    } catch {
      // best-effort, mirrors the engine which logs and still shows the result
    }
    const pct = totalQuestions > 0 ? score / totalQuestions : 0;
    setResult({ score, total: totalQuestions, icon: resultIcon(pct) });
    setScreen("result");
    setSubmitting(false);
  }, [checkedFlags, groups, states, category, number, lessonId, totalQuestions, score, visit]);

  const retry = useCallback(() => {
    window.location.reload();
  }, []);

  // ── Derived values for the shells ───────────────────────────────────────────
  const checkedCount = useMemo(() => checkedFlags.filter(Boolean).length, [checkedFlags]);
  const progressPct = groups.length ? Math.round((checkedCount / groups.length) * 100) : 0;
  const everyChecked = allChecked(checkedFlags);
  const hasNextUnchecked = firstUncheckedAfter(checkedFlags, currentIndex) !== -1;

  const currentGroup = groups[currentIndex];
  const currentState = states[currentIndex];
  const answeredCount = currentState ? Object.keys(currentState.userAnswers).length : 0;
  const canCheck =
    !!currentGroup && !currentState?.checked && answeredCount >= currentGroup.questions.length;

  return {
    // status
    screen,
    error,
    submitting,
    // data
    groups,
    states,
    currentIndex,
    currentGroup,
    currentState,
    score,
    totalQuestions,
    result,
    referrer,
    // derived
    checkedFlags,
    checkedCount,
    progressPct,
    everyChecked,
    hasNextUnchecked,
    canCheck,
    // actions
    selectMC,
    selectKey,
    toggleChip,
    blankClick,
    assignT6,
    check,
    jumpTo,
    goPrev,
    goNext,
    finish,
    retry,
  };
}

export type PracticeEngine = ReturnType<typeof usePracticeEngine>;
