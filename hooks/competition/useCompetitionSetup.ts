"use client";

// hooks/competition/useCompetitionSetup.ts
// The Learn Together create/edit form, porting the setup half of
// Learning/web_app/static/competition/competition.js (onModeChange /
// collectRoomBody / editRoomSettings).
//
// This hook owns the room's own settings — mode, activity types, capacity and
// section timeout — and composes useCompetitionSources for where the questions
// come from. A room is sourced either from HSK levels (vocab / lesson modes) or
// from the books the host has saved words in (book mode); the two pickers are
// mutually exclusive and feed the same Lesson -> Part cascade.

import { useCallback, useMemo, useState } from "react";
import { useT } from "@/components/i18n/I18nProvider";
import {
  collectRoomSettings,
  parseTypeValues,
  TYPE_OPTIONS,
} from "@/lib/competition/roomLogic";
import { useCompetitionSources } from "./useCompetitionSources";
import type {
  CompetitionCategory,
  CompetitionRoom,
  CompetitionRoomSettings,
} from "@/lib/types/competition";

const DEFAULT_MAX_USERS = 8;
const DEFAULT_TIMEOUT = 15;
export const TIMEOUT_OPTIONS = [5, 10, 15, 20];

export function useCompetitionSetup(initialMode: CompetitionCategory = "vocab") {
  const { t } = useT();

  const [mode, setModeState] = useState<CompetitionCategory>(initialMode);
  const isBook = mode === "book";

  const sources = useCompetitionSources(isBook);
  const { partIds, resetForMode, prefillSources, setError } = sources;

  const typeOptions = useMemo(
    () => TYPE_OPTIONS[mode].map((o) => ({ value: o.value, label: t(o.key) })),
    [mode, t]
  );

  // Defaults to every type selected so a room always has at least one.
  const [types, setTypes] = useState<string[]>(() => TYPE_OPTIONS[initialMode].map((o) => o.value));
  const [maxUsers, setMaxUsers] = useState(DEFAULT_MAX_USERS);
  const [timeoutMinutes, setTimeoutMinutes] = useState(DEFAULT_TIMEOUT);

  // Switching mode repopulates the Type selector with that mode's skills, all selected,
  // and swaps the source picker: book mode picks Books, the others pick HSK levels.
  // Either way the lesson/part cascade and its cached groups are invalidated
  // (onModeChange in competition.js).
  const setMode = useCallback(
    async (next: CompetitionCategory) => {
      setModeState(next);
      setTypes(TYPE_OPTIONS[next].map((o) => o.value));
      await resetForMode(next === "book");
    },
    [resetForMode]
  );

  // Reopen the form pre-filled with an existing room's settings (host Edit Settings).
  const prefillFromRoom = useCallback(
    async (room: CompetitionRoom) => {
      const roomMode: CompetitionCategory = TYPE_OPTIONS[room.category] ? room.category : "vocab";
      setModeState(roomMode);
      setTypes(parseTypeValues(room.activity_type, roomMode));
      setMaxUsers(room.max_users || DEFAULT_MAX_USERS);
      setTimeoutMinutes(room.section_timeout_minutes || DEFAULT_TIMEOUT);
      await prefillSources(roomMode === "book", room.passage_ids || []);
    },
    [prefillSources]
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
  }, [mode, types, maxUsers, timeoutMinutes, partIds, setError, t]);

  return {
    mode,
    setMode,
    isBook,
    typeOptions,
    types,
    setTypes,
    levels: sources.levels,
    setLevels: sources.setLevels,
    books: sources.books,
    setBooks: sources.setBooks,
    bookOptions: sources.bookOptions,
    lessonOptions: sources.lessonOptions,
    lessonKeys: sources.lessonKeys,
    setLessonKeys: sources.setLessonKeys,
    partOptions: sources.partOptions,
    partIds: sources.partIds,
    setPartIds: sources.setPartIds,
    maxUsers,
    setMaxUsers,
    timeoutMinutes,
    setTimeoutMinutes,
    error: sources.error,
    setError: sources.setError,
    prefillFromRoom,
    buildSettings,
  };
}

export type CompetitionSetup = ReturnType<typeof useCompetitionSetup>;
