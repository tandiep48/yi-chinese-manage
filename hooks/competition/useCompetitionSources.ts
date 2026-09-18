"use client";

// hooks/useCompetitionSources.ts
// Where a Learn Together room's questions come from: the source picker (HSK
// levels, or the books the host has saved words in) and the Lesson -> Part
// cascade both of them feed. Ports onLevelChange / onBookChange /
// onLessonChange / loadSavedBooks from
// Learning/web_app/static/competition/competition.js.
//
// The two source pickers are mutually exclusive but rebuild the same cascade,
// so they share applyGrouped: it commits a new lesson map and keeps whichever
// lesson and part picks still exist underneath it.
//
// `error` lives here rather than in useCompetitionSetup because three of its
// four writers are in this file; the form reads and clears it through setError.

import { useCallback, useMemo, useRef, useState } from "react";
import { useT } from "@/components/i18n/I18nProvider";
import { getPassages } from "@/lib/api/learner/lessons";
import { getBookPassages } from "@/lib/api/learner/competition";
import { getSavedBooks } from "@/lib/api/learner/learnerVocab";
import {
  buildLessonOptions,
  buildPartOptions,
  groupPassagesByLesson,
  parsePassageId,
  type PassageByLesson,
  type SourcePassage,
} from "@/lib/competition/roomLogic";

export interface KeepPicks {
  lessonKeys?: string[];
  partIds?: string[];
}

export function useCompetitionSources(isBook: boolean) {
  const { t } = useT();

  const [levels, setLevelsState] = useState<string[]>([]);
  const [books, setBooksState] = useState<string[]>([]);
  const [bookOptions, setBookOptions] = useState<{ value: string; label: string }[]>([]);
  const [lessonKeys, setLessonKeysState] = useState<string[]>([]);
  const [partIds, setPartIds] = useState<string[]>([]);
  const [grouped, setGrouped] = useState<PassageByLesson>({});
  const [error, setError] = useState("");

  // Fetched passages per source, kept across toggles: by HSK level number for the
  // level picker, by book code for the book picker.
  const cache = useRef<Record<number, SourcePassage[]>>({});
  const bookCache = useRef<Record<string, SourcePassage[]>>({});

  const labels = useMemo(
    () => ({
      lessonPrefix: t("picker.lesson_prefix"),
      partPrefix: t("picker.part_prefix"),
      other: t("vocab.other_label"),
    }),
    [t]
  );

  // Group headers appear once more than one source (level, or book) is picked.
  const sourceCount = isBook ? books.length : levels.length;
  const lessonOptions = useMemo(
    () => buildLessonOptions(grouped, sourceCount, labels),
    [grouped, sourceCount, labels]
  );
  const partOptions = useMemo(
    () => buildPartOptions(lessonKeys, grouped, labels),
    [lessonKeys, grouped, labels]
  );

  const clearCascade = useCallback(() => {
    setGrouped({});
    setLessonKeysState([]);
    setPartIds([]);
  }, []);

  // Commit a freshly built lesson map, keeping the lesson/part picks that still exist
  // under it. Shared by both source pickers; `emptyError` is what to say when the new
  // source set yields no lessons at all.
  const applyGrouped = useCallback(
    (nextGrouped: PassageByLesson, keep: KeepPicks | undefined, emptyError: string) => {
      setGrouped(nextGrouped);
      if (!Object.keys(nextGrouped).length) {
        setError(emptyError);
        return;
      }
      const keptLessons = keep?.lessonKeys ?? lessonKeys;
      const validLessons = keptLessons.filter((key) => nextGrouped[key]);
      setLessonKeysState(validLessons);
      const validIds = new Set(
        validLessons.flatMap((key) => (nextGrouped[key] || []).map((p) => p.passage_id))
      );
      const keptParts = keep?.partIds ?? partIds;
      setPartIds(keptParts.filter((id) => validIds.has(id)));
    },
    [lessonKeys, partIds]
  );

  // Load every newly-picked level, then rebuild the lesson/part option lists. Prior
  // lesson and part picks survive when they still exist under the new level set.
  const setLevels = useCallback(
    async (next: string[], keep?: KeepPicks) => {
      setLevelsState(next);
      const nums = next.map(Number).filter(Boolean);
      if (!nums.length) {
        clearCascade();
        return;
      }

      setError("");
      try {
        await Promise.all(
          nums
            .filter((n) => !cache.current[n])
            .map(async (n) => {
              cache.current[n] = await getPassages(`HSK${n}`);
            })
        );
      } catch {
        setError(t("picker.failed_load_lessons"));
        return;
      }

      applyGrouped(groupPassagesByLesson(nums, cache.current), keep, t("vocab.no_lessons_found"));
    },
    [applyGrouped, clearCascade, t]
  );

  // Book mode's source picker: load each newly-picked book's saved-in parts, then
  // rebuild the same lesson/part cascade the HSK path uses (onBookChange).
  const setBooks = useCallback(
    async (next: string[], keep?: KeepPicks) => {
      setBooksState(next);
      if (!next.length) {
        clearCascade();
        return;
      }

      setError("");
      try {
        await Promise.all(
          next
            .filter((code) => !bookCache.current[code])
            .map(async (code) => {
              bookCache.current[code] = await getBookPassages(code);
            })
        );
      } catch {
        setError(t("picker.failed_load_lessons"));
        return;
      }

      applyGrouped(
        groupPassagesByLesson(next, bookCache.current),
        keep,
        t("competition.no_saved_books")
      );
    },
    [applyGrouped, clearCascade, t]
  );

  // Load the books the host has saved words in, for the Book picker (loadSavedBooks).
  const loadBookOptions = useCallback(async () => {
    const saved = await getSavedBooks();
    setBookOptions(saved.map((b) => ({ value: b.book_code, label: b.name || b.book_code })));
    if (!saved.length) setError(t("competition.no_saved_books"));
  }, [t]);

  // Deselecting a lesson drops the parts that belonged to it.
  const setLessonKeys = useCallback(
    (next: string[]) => {
      setLessonKeysState(next);
      const validIds = new Set(
        next.flatMap((key) => (grouped[key] || []).map((p) => p.passage_id))
      );
      setPartIds((prev) => prev.filter((id) => validIds.has(id)));
    },
    [grouped]
  );

  // Swap the source picker and invalidate the cascade, on a mode change.
  const resetForMode = useCallback(
    async (nextIsBook: boolean) => {
      setLevelsState([]);
      setBooksState([]);
      clearCascade();
      setError("");
      if (nextIsBook) await loadBookOptions();
      else setBookOptions([]);
    },
    [clearCascade, loadBookOptions]
  );

  // Rebuild the source picker and the cascade from an existing room's passage
  // ids, keeping every lesson and part the room already uses. Book rooms carry
  // their book code in the id's first segment; HSK rooms carry the level.
  const prefillSources = useCallback(
    async (nextIsBook: boolean, passageIds: string[]) => {
      const infos = passageIds.map(parsePassageId);
      const keep: KeepPicks = {
        lessonKeys: Array.from(new Set(infos.map((i) => i.lessonKey))),
        partIds: passageIds,
      };

      if (nextIsBook) {
        setLevelsState([]);
        await loadBookOptions();
        await setBooks(Array.from(new Set(infos.map((i) => i.hsk).filter(Boolean))), keep);
        return;
      }

      setBooksState([]);
      setBookOptions([]);
      await setLevels(
        Array.from(new Set(infos.map((i) => String(i.level)).filter((v) => v !== "0"))),
        keep
      );
    },
    [loadBookOptions, setBooks, setLevels]
  );

  return {
    levels,
    setLevels,
    books,
    setBooks,
    bookOptions,
    lessonKeys,
    setLessonKeys,
    partIds,
    setPartIds,
    lessonOptions,
    partOptions,
    error,
    setError,
    resetForMode,
    prefillSources,
  };
}
