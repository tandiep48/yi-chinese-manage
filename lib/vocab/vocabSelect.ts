// lib/vocab/vocabSelect.ts
// Pure helpers behind the learner vocab selection page: which modes carry no
// filters, how lessons and parts sort and group, and how a row is keyed in the
// cross-page selection set.
//
// Ported from the sorting/grouping bits of
// Learning/web_app/static/vocab/vocab_select.js.

import type { PickerPassage } from "@/lib/types/lesson";
import type { VocabMode, VocabRow } from "@/lib/types/vocab";

export interface MultiSelectOption {
  value: string;
  label: string;
  group?: string | null;
}

// A prompt/loading message (already translated) or the loaded table.
export interface TableState {
  status: "prompt" | "loading" | "ready";
  message: string;
}

export interface PassageMeta extends PickerPassage {
  lesson: string;
  part: string;
}

// These load straight from the user's own history, with no HSK/lesson filters.
const HISTORY_MODES: ReadonlySet<VocabMode> = new Set(["unsure", "unlearn", "recent"]);

export const DEFAULT_PAGE_SIZE = 20;

export function isHistoryMode(mode: VocabMode): boolean {
  return HISTORY_MODES.has(mode);
}

// 'Other' sinks to the bottom; the rest sort numerically by lesson/part number.
export function numericSort(a: string, b: string): number {
  if (a === "Other") return 1;
  if (b === "Other") return -1;
  return Number(a) - Number(b);
}

export function wordKey(row: VocabRow): string {
  return row.word || row.cn || "";
}

// Passage ids look like "H2_3_1" (level_lesson_part). Anything that doesn't
// split into at least two segments is filed under "Other".
export function groupPassagesByLesson(passages: PickerPassage[]): Record<string, PassageMeta[]> {
  const grouped: Record<string, PassageMeta[]> = {};
  passages.forEach((passage) => {
    const parts = String(passage.passage_id || "").split("_");
    const lesson = parts.length >= 2 ? parts[1] : "Other";
    const part = parts.length >= 3 ? parts[2] : passage.passage_id;
    (grouped[lesson] ||= []).push({ ...passage, lesson, part });
  });
  return grouped;
}

export function buildLessonOptions(
  grouped: Record<string, PassageMeta[]>,
  lessonLabel: (lesson: string) => string
): MultiSelectOption[] {
  return Object.keys(grouped)
    .sort(numericSort)
    .map((lesson) => ({ value: lesson, label: lessonLabel(lesson) }));
}

// Each part option carries its full passage_id. When several lessons are
// selected the parts are grouped by lesson so they stay distinguishable.
export function buildPartOptions(
  lessons: string[],
  grouped: Record<string, PassageMeta[]>,
  lessonLabel: (lesson: string) => string,
  partLabel: (part: string) => string
): MultiSelectOption[] {
  const showGroups = lessons.length > 1;
  const options: MultiSelectOption[] = [];
  [...lessons].sort(numericSort).forEach((lesson) => {
    const passages = grouped[lesson];
    if (!passages?.length) return;
    const groupLabel = lessonLabel(lesson);
    [...passages]
      .sort((a, b) => Number(a.part) - Number(b.part))
      .forEach((passage) => {
        options.push({
          value: passage.passage_id,
          label: partLabel(passage.part),
          group: showGroups ? groupLabel : null,
        });
      });
  });
  return options;
}
