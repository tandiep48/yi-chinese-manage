"use client";

// hooks/useCompetitionSetup.ts
// The Learn Together create/edit form, porting the setup half of
// Learning/web_app/static/competition/competition.js (onModeChange / onLevelChange /
// onLessonChange / collectRoomBody / editRoomSettings). Passages are fetched once per
// HSK level and cached, so a host can mix parts across several levels; the option
// lists themselves are built by the pure helpers in lib/competition/roomLogic.ts.

import { useCallback, useMemo, useRef, useState } from "react";
import { useT } from "@/components/i18n/I18nProvider";
import { getPassages } from "@/lib/api/lessons";
import {
  buildLessonOptions,
  buildPartOptions,
  collectRoomSettings,
  groupPassagesByLesson,
  parsePassageId,
  parseTypeValues,
  TYPE_OPTIONS,
  type PassageByLesson,
} from "@/lib/competition/roomLogic";
import type {
  CompetitionCategory,
  CompetitionRoom,
  CompetitionRoomSettings,
  PickerPassage,
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
  const [lessonKeys, setLessonKeysState] = useState<string[]>([]);
  const [partIds, setPartIds] = useState<string[]>([]);
  const [maxUsers, setMaxUsers] = useState(DEFAULT_MAX_USERS);
  const [timeoutMinutes, setTimeoutMinutes] = useState(DEFAULT_TIMEOUT);
  const [grouped, setGrouped] = useState<PassageByLesson>({});
  const [error, setError] = useState("");

  // Fetched passages per HSK level, kept across level toggles.
  const cache = useRef<Record<number, PickerPassage[]>>({});

  const labels = useMemo(
    () => ({
      lessonPrefix: t("picker.lesson_prefix"),
      partPrefix: t("picker.part_prefix"),
      other: t("vocab.other_label"),
    }),
    [t]
  );

  const lessonOptions = useMemo(
    () => buildLessonOptions(grouped, levels.length, labels),
    [grouped, levels.length, labels]
  );
  const partOptions = useMemo(
    () => buildPartOptions(lessonKeys, grouped, labels),
    [lessonKeys, grouped, labels]
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
      setGrouped(nextGrouped);
      if (!Object.keys(nextGrouped).length) {
        setError(t("vocab.no_lessons_found"));
        return;
      }

      // Drop picks whose lesson/part no longer exists under the new level set.
      const keptLessons = keep?.lessonKeys ?? lessonKeys;
      const validLessons = keptLessons.filter((key) => nextGrouped[key]);
      setLessonKeysState(validLessons);
      const validIds = new Set(
        validLessons.flatMap((key) => (nextGrouped[key] || []).map((p) => p.passage_id))
      );
      const keptParts = keep?.partIds ?? partIds;
      setPartIds(keptParts.filter((id) => validIds.has(id)));
    },
    [lessonKeys, partIds, t]
  );

  // Switching mode repopulates the Type selector with that mode's skills, all selected
  // (onModeChange in competition.js) — the two modes share no type values.
  const setMode = useCallback((next: CompetitionCategory) => {
    setModeState(next);
    setTypes(TYPE_OPTIONS[next].map((o) => o.value));
  }, []);

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
  const prefillFromRoom = useCallback(
    async (room: CompetitionRoom) => {
      const roomMode: CompetitionCategory = room.category === "lesson" ? "lesson" : "vocab";
      setModeState(roomMode);
      setTypes(parseTypeValues(room.activity_type, roomMode));
      setMaxUsers(room.max_users || DEFAULT_MAX_USERS);
      setTimeoutMinutes(room.section_timeout_minutes || DEFAULT_TIMEOUT);

      const ids = room.passage_ids || [];
      const infos = ids.map(parsePassageId);
      const roomLevels = Array.from(
        new Set(infos.map((i) => String(i.level)).filter((v) => v !== "0"))
      );
      await setLevels(roomLevels, {
        lessonKeys: Array.from(new Set(infos.map((i) => i.lessonKey))),
        partIds: ids,
      });
    },
    [setLevels]
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
    typeOptions,
    types,
    setTypes,
    levels,
    setLevels,
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
