// lib/competition/roomLogic.ts
// Pure logic behind the Learn Together setup form and room summary, ported from
// Learning/web_app/static/competition/competition.js. Everything here is free of
// React and i18n: label text comes in through a `labels` bag and summary lines are
// returned as descriptors the components translate.

import type { MultiSelectOption } from "@/components/shared/customer_ui/MultiSelect/MultiSelect";
import type { CompetitionCategory, CompetitionRoom, PickerPassage } from "@/lib/types/types";

// One passage id split into its parts. `lessonKey` scopes a lesson to its HSK level
// ("H1_2") so lesson numbers never collide across levels.
export interface PassageInfo {
  passage_id: string;
  hsk: string;
  level: number;
  lesson: string;
  part: string;
  lessonKey: string;
}

export type PassageByLesson = Record<string, (PickerPassage & PassageInfo)[]>;

export interface OptionLabels {
  lessonPrefix: string; // t("picker.lesson_prefix")
  partPrefix: string; // t("picker.part_prefix")
  other: string; // t("vocab.other_label")
}

// The Type selector offers a different skill set per mode: the vocab competition
// picks among typing/listening/reading, the lesson trainer among its four task types.
export const TYPE_OPTIONS: Record<CompetitionCategory, { value: string; key: string }[]> = {
  vocab: [
    { value: "typing", key: "competition.type_typing" },
    { value: "listening", key: "competition.type_listening" },
    { value: "reading", key: "competition.type_reading" },
  ],
  lesson: [
    { value: "listening", key: "competition.type_listening" },
    { value: "meaning", key: "competition.type_meaning" },
    { value: "typing", key: "competition.type_typing" },
    { value: "reorder", key: "competition.type_reorder" },
  ],
};

// Maps each selectable vocab type onto the trainer's internal activity type.
const VOCAB_TYPE_TO_ACTIVITY: Record<string, "typing" | "listen" | "reading"> = {
  typing: "typing",
  listening: "listen",
  reading: "reading",
};

export const HSK_LEVELS = [1, 2, 3, 4, 5, 6];

// Real passage ids look like "H1_10_2" (the level prefix is "H1", not "HSK1"), so the
// level is read by stripping non-digits — which also accepts the "HSK1_..." form.
export function parsePassageId(passageId: string): PassageInfo {
  const parts = String(passageId || "").split("_");
  const hsk = parts[0] || "";
  const level = Number(String(hsk).replace(/\D/g, "")) || 0;
  const hasStructure = parts.length >= 2;
  return {
    passage_id: passageId,
    hsk,
    level,
    lesson: hasStructure ? parts[1] : "Other",
    part: parts.length >= 3 ? parts[2] : passageId,
    lessonKey: hasStructure ? `${hsk}_${parts[1]}` : String(passageId),
  };
}

export function numericSort(a: string, b: string): number {
  if (a === "Other") return 1;
  if (b === "Other") return -1;
  return Number(a) - Number(b) || String(a).localeCompare(String(b));
}

// Sort lessonKeys ("H1_2") by HSK level, then by lesson number.
export function lessonKeySort(a: string, b: string): number {
  const pa = String(a).split("_");
  const pb = String(b).split("_");
  const la = Number(pa[0].replace(/\D/g, "")) || 0;
  const lb = Number(pb[0].replace(/\D/g, "")) || 0;
  return la - lb || numericSort(pa[1], pb[1]);
}

// Rebuild the lesson -> passages map from the selected levels only, so deselecting a
// level drops its lessons while the others stay (a host can mix parts across levels).
export function groupPassagesByLesson(
  levels: number[],
  passagesByLevel: Record<number, PickerPassage[]>
): PassageByLesson {
  const grouped: PassageByLesson = {};
  levels.forEach((n) => {
    (passagesByLevel[n] || []).forEach((passage) => {
      const info = parsePassageId(passage.passage_id);
      if (!grouped[info.lessonKey]) grouped[info.lessonKey] = [];
      grouped[info.lessonKey].push({ ...passage, ...info });
    });
  });
  return grouped;
}

// Lesson options, grouped under "HSK n" headers when more than one level is selected.
export function buildLessonOptions(
  grouped: PassageByLesson,
  levelCount: number,
  labels: OptionLabels
): MultiSelectOption[] {
  const showGroups = levelCount > 1;
  return Object.keys(grouped)
    .sort(lessonKeySort)
    .map((key) => {
      const info = grouped[key][0];
      return {
        value: key,
        label: info.lesson === "Other" ? labels.other : `${labels.lessonPrefix} ${info.lesson}`,
        group: showGroups ? `HSK ${info.level}` : null,
      };
    });
}

// Part options carry the full passage_id as their value; parts are grouped by
// HSK + lesson when several lessons are selected so they stay distinguishable.
export function buildPartOptions(
  selectedKeys: string[],
  grouped: PassageByLesson,
  labels: OptionLabels
): MultiSelectOption[] {
  const showGroups = selectedKeys.length > 1;
  const options: MultiSelectOption[] = [];
  [...selectedKeys].sort(lessonKeySort).forEach((key) => {
    const passages = grouped[key];
    if (!passages || !passages.length) return;
    const info = passages[0];
    const groupLabel =
      info.lesson === "Other"
        ? labels.other
        : `HSK ${info.level} · ${labels.lessonPrefix} ${info.lesson}`;
    [...passages]
      .sort((a, b) => Number(a.part) - Number(b.part))
      .forEach((passage) => {
        options.push({
          value: passage.passage_id,
          label: `${labels.partPrefix} ${passage.part}`,
          group: showGroups ? groupLabel : null,
        });
      });
  });
  return options;
}

// Parse a stored activity_type ("all" or a CSV of type values) into a value array,
// expanding "all" to every option available for the mode. The server normalizes a
// full selection back to "all", so this is also the Edit-Settings prefill path.
export function parseTypeValues(
  activityType: string | null | undefined,
  mode: CompetitionCategory
): string[] {
  const all = TYPE_OPTIONS[mode].map((o) => o.value);
  if (!activityType || activityType === "all") return all;
  const wanted = new Set(
    String(activityType)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  const picked = all.filter((v) => wanted.has(v));
  return picked.length ? picked : all;
}

// Resolve the room's vocab type selection into the trainer's internal activity types.
export function vocabActivityTypes(
  activityType: string | null | undefined
): ("typing" | "listen" | "reading")[] {
  return parseTypeValues(activityType, "vocab").map((v) => VOCAB_TYPE_TO_ACTIVITY[v]);
}

export interface RoomFormValues {
  mode: CompetitionCategory;
  types: string[];
  passageIds: string[];
  maxUsers: number;
  sectionTimeoutMinutes: number;
}

// Read + validate the setup form into a room-settings payload (shared by create and
// edit). Returns null when no part is picked — the caller shows the error.
export function collectRoomSettings(form: RoomFormValues) {
  if (!form.passageIds.length) return null;
  // The parts can span multiple HSK levels; `level` is display metadata server-side,
  // so send the lowest level involved to keep the column meaningful and non-null.
  const levels = form.passageIds.map((id) => parsePassageId(id).level).filter(Boolean);
  return {
    category: form.mode,
    activity_type: form.types.length ? form.types.join(",") : "all",
    level: levels.length ? Math.min(...levels) : 1,
    passage_ids: form.passageIds,
    max_users: form.maxUsers,
    section_timeout_minutes: form.sectionTimeoutMinutes,
  };
}

// The room summary's translatable pieces: the component turns `typeKeys` into a
// "Vocabulary · Typing, Listening" line and the counts into their i18n strings.
export interface RoomSummary {
  hskLabel: string;
  modeKey: string;
  typeKeys: string[];
  allTypes: boolean;
  lessonCount: number;
  partCount: number;
  isLesson: boolean;
  count: number;
  memberCount: number;
  maxUsers: number;
  minutes: number;
}

export function roomSummary(room: CompetitionRoom): RoomSummary {
  const passageIds = room.passage_ids || [];
  const infos = passageIds.map(parsePassageId);
  const hskLevels = Array.from(new Set(infos.map((i) => i.level).filter(Boolean))).sort(
    (a, b) => a - b
  );
  const mode: CompetitionCategory = room.category === "lesson" ? "lesson" : "vocab";
  const activityType = room.activity_type || "all";
  const byValue = Object.fromEntries(TYPE_OPTIONS[mode].map((o) => [o.value, o.key]));
  const allTypes = activityType === "all";

  return {
    hskLabel: hskLevels.length
      ? hskLevels.map((n) => `HSK ${n}`).join(", ")
      : `HSK ${room.level}`,
    modeKey: mode === "lesson" ? "competition.mode_lesson" : "competition.mode_vocab",
    typeKeys: allTypes
      ? []
      : String(activityType)
          .split(",")
          .map((v) => byValue[v.trim()] || v.trim()),
    allTypes,
    lessonCount: new Set(infos.map((i) => i.lessonKey)).size,
    partCount: passageIds.length,
    isLesson: mode === "lesson",
    count: room.word_count || 0,
    memberCount: room.members?.length || 0,
    maxUsers: room.max_users,
    minutes: room.section_timeout_minutes,
  };
}

// The per-task identity a lesson answer is recorded under, matching
// emitLessonAnswer() in competition.js (and itemKey() in lesson_trainer_core.js).
export function lessonItemKey(task: { passage_id?: string; line_id?: number | null }) {
  return `${task.passage_id || ""}:${task.line_id != null ? task.line_id : ""}`;
}

export function isRoomHost(room: CompetitionRoom | null, userId: number | null | undefined) {
  return !!room && !!userId && Number(room.host_user_id) === Number(userId);
}

// The host's Edit / Start controls hide once the room is running.
export function canManageRoom(room: CompetitionRoom | null, userId: number | null | undefined) {
  return isRoomHost(room, userId) && room?.status !== "running";
}
