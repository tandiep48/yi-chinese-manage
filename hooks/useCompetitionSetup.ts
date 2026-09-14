"use client";

// hooks/useCompetitionSetup.ts
// The Learn Together create/edit form, porting the setup half of
// Learning/web_app/static/competition/competition.js (onModeChange / onLevelChange /
// onBookChange / onLessonChange / collectRoomBody / editRoomSettings). Passages are
// fetched once per source and cached, so a host can mix parts across several levels;
// the option lists themselves are built by the pure helpers in
// lib/competition/roomLogic.ts.
//
// A room is sourced either from HSK levels (vocab / lesson modes) or from the books
// the host has saved words in (book mode). The two pickers are mutually exclusive and
// feed the same Lesson -> Part cascade.

import { useCallback, useMemo, useRef, useState } from "react";
import { useT } from "@/components/i18n/I18nProvider";
import { getPassages } from "@/lib/api/lessons";
import { getBookPassages } from "@/lib/api/competition";
import { getSavedBooks } from "@/lib/api/learnerVocab";
import {
  buildLessonOptions,
  buildPartOptions,
  collectRoomSettings,
  groupPassagesByLesson,
  parsePassageId,
  parseTypeValues,
  TYPE_OPTIONS,
  type PassageByLesson,
  type SourcePassage,
} from "@/lib/competition/roomLogic";
import type {
  CompetitionCategory,
  CompetitionRoom,
  CompetitionRoomSettings,
} from "@/lib/types/types";

const DEFAULT_MAX_USERS = 8;
const DEFAULT_TIMEOUT = 15;
export const TIMEOUT_OPTIONS = [5, 10, 15, 20];

export function useCompetitionSetup(initialMode: CompetitionCategory = "vocab") {
  const { t } = useT();

  const [mode, setModeState] = useState<CompetitionCategory>(initialMode);

  const typeOptions = useMemo(
    () => TYPE_OPTIONS[mode].map((o) => ({ value: o.value, label: t(o.key) })),
    [mode, t]
  );

  // Defaults to every type selected so a room always has at least one.
  const [types, setTypes] = useState<string[]>(() => TYPE_OPTIONS[initialMode].map((o) => o.value));
  const [levels, setLevelsState] = useState<string[]>([]);
  const [books, setBooksState] = useState<string[]>([]);
  const [bookOptions, setBookOptions] = useState<{ value: string; label: string }[]>([]);
  const [lessonKeys, setLessonKeysState] = useState<string[]>([]);
  const [partIds, setPartIds] = useState<string[]>([]);
  const [maxUsers, setMaxUsers] = useState(DEFAULT_MAX_USERS);
  const [timeoutMinutes, setTimeoutMinutes] = useState(DEFAULT_TIMEOUT);
  const [grouped, setGrouped] = useState<PassageByLesson>({});
  const [error, setError] = useState("");

  const isBook = mode === "book";

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

  // Commit a freshly built lesson map, keeping the lesson/part picks that still exist
  // under it. Shared by both source pickers; `emptyError` is what to say when the new
  // source set yields no lessons at all.
  const applyGrouped = useCallback(
    (
      nextGrouped: PassageByLesson,
      keep: { lessonKeys?: string[]; partIds?: string[] } | undefined,
      emptyError: string
    ) => {
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
    async (next: string[], keep?: { lessonKeys?: string[]; partIds?: string[] }) => {
      setLevelsState(next);
      const nums = next.map(Number).filter(Boolean);
      if (!nums.length) {
        setGrouped({});
        setLessonKeysState([]);
        setPartIds([]);
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

      const nextGrouped = groupPassagesByLesson(nums, cache.current);
      applyGrouped(nextGrouped, keep, t("vocab.no_lessons_found"));
    },
    [applyGrouped, t]
  );

  // Book mode's source picker: load each newly-picked book's saved-in parts, then
  // rebuild the same lesson/part cascade the HSK path uses (onBookChange).
  const setBooks = useCallback(
    async (next: string[], keep?: { lessonKeys?: string[]; partIds?: string[] }) => {
      setBooksState(next);
      if (!next.length) {
        setGrouped({});
        setLessonKeysState([]);
        setPartIds([]);
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

      const nextGrouped = groupPassagesByLesson(next, bookCache.current);
      applyGrouped(nextGrouped, keep, t("competition.no_saved_books"));
    },
    [applyGrouped, t]
  );

  // Load the books the host has saved words in, for the Book picker (loadSavedBooks).
  const loadBookOptions = useCallback(async () => {
    const saved = await getSavedBooks();
    setBookOptions(saved.map((b) => ({ value: b.book_code, label: b.name || b.book_code })));
    if (!saved.length) setError(t("competition.no_saved_books"));
  }, [t]);

  // Switching mode repopulates the Type selector with that mode's skills, all selected,
  // and swaps the source picker: book mode picks Books, the others pick HSK levels.
  // Either way the lesson/part cascade and its cached groups are invalidated
  // (onModeChange in competition.js).
  const setMode = useCallback(
    async (next: CompetitionCategory) => {
      setModeState(next);
      setTypes(TYPE_OPTIONS[next].map((o) => o.value));
      setLevelsState([]);
      setBooksState([]);
      setGrouped({});
      setLessonKeysState([]);
      setPartIds([]);
      setError("");
      if (next === "book") await loadBookOptions();
      else setBookOptions([]);
    },
    [loadBookOptions]
  );

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

  // Reopen the form pre-filled with an existing room's settings (host Edit Settings).
  // The source picker is rebuilt from the room's passage ids — HSK levels, or the book
  // codes in their first segment.
  const prefillFromRoom = useCallback(
    async (room: CompetitionRoom) => {
      const roomMode: CompetitionCategory = TYPE_OPTIONS[room.category]
        ? room.category
        : "vocab";
      setModeState(roomMode);
      setTypes(parseTypeValues(room.activity_type, roomMode));
      setMaxUsers(room.max_users || DEFAULT_MAX_USERS);
      setTimeoutMinutes(room.section_timeout_minutes || DEFAULT_TIMEOUT);

      const ids = room.passage_ids || [];
      const infos = ids.map(parsePassageId);
      const keep = {
        lessonKeys: Array.from(new Set(infos.map((i) => i.lessonKey))),
        partIds: ids,
      };

      if (roomMode === "book") {
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

  // Validated payload for create / save, or null when nothing is picked.
  const buildSettings = useCallback((): CompetitionRoomSettings | null => {
    const settings = collectRoomSettings({
      mode,
      types,
      passageIds: partIds,
      maxUsers,
      sectionTimeoutMinutes: timeoutMinutes,
    });
    if (!settings) {
      setError(t("competition.select_hsk_lesson_part"));
      return null;
    }
    setError("");
    return settings;
  }, [mode, types, partIds, maxUsers, timeoutMinutes, t]);

  return {
    mode,
    setMode,
    isBook,
    typeOptions,
    types,
    setTypes,
    levels,
    setLevels,
    books,
    setBooks,
    bookOptions,
    lessonOptions,
    lessonKeys,
    setLessonKeys,
    partOptions,
    partIds,
    setPartIds,
    maxUsers,
    setMaxUsers,
    timeoutMinutes,
    setTimeoutMinutes,
    error,
    setError,
    prefillFromRoom,
    buildSettings,
  };
}

export type CompetitionSetup = ReturnType<typeof useCompetitionSetup>;
