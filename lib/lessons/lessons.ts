// lib/lessons/lessons.ts
// HSK level metadata + helpers for grouping/sorting real API passages into
// the lesson picker flow (HSK level → lesson → part). Ported from
// Learning/web_app/static/shared/passage_picker.js's Picker object.
import { LESSON_CONSTANTS, LESSON_COLORS } from './constants';
import type { PickerPassage, PickerProgressEntry } from '@/lib/types/types';

export interface HskLevel {
  key: string; // "HSK1"
  level: number; // 1
  label: string; // "HSK 1"
  color: string; // level-card background
}

export interface Progress {
  learnedWords: number;
  totalWords: number;
  progressPct: number;
}

export const HSK_LEVELS: HskLevel[] = LESSON_CONSTANTS.HSK_LEVELS;

// Hardcoded pinyin-guide passage id injected in place of HSK1 lesson 1's real
// (incomplete) rows, and the "Numbers" pseudo-lesson-part — mirrors
// passage_picker.js's HSK1 special-casing exactly.
export const PINYIN_PASSAGE_ID = 'H1_1_1';
export const NUMBER_PART_ID = 'H1_5_99';

export function getLevel(key: string): HskLevel | undefined {
  return HSK_LEVELS.find((l) => l.key.toLowerCase() === key.toLowerCase());
}

// Per-lesson header tint, keyed "H<level>-<lesson>" (e.g. HSK1 + "2" -> "H1-2").
// Returns undefined when the lesson has no mapped color. Mirrors the legacy
// passage_picker.js LESSON_COLORS lookup.
export function lessonColor(hskKey: string, lessonNum: string | number): string | undefined {
  const h = hskKey.toUpperCase().replace("HSK", "H");
  return LESSON_COLORS[`${h}-${lessonNum}`];
}

export function isNumberPart(passageId: string): boolean {
  return passageId === NUMBER_PART_ID;
}

export function toProgress(entry: PickerProgressEntry | undefined): Progress {
  if (!entry) return { learnedWords: 0, totalWords: 0, progressPct: 0 };
  return {
    learnedWords: entry.learned_words,
    totalWords: entry.total_words,
    progressPct: entry.progress_pct,
  };
}

// e.g. "H1_10_3" -> 3; the number part always sorts first within its lesson.
export function getPartNumber(passageId: string): number {
  if (isNumberPart(passageId)) return 0;
  const parts = passageId.split('_');
  const n = parts.length >= 3 ? Number(parts[2]) : Number.MAX_SAFE_INTEGER;
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
}

export function sortPartsByNumber(passages: PickerPassage[]): PickerPassage[] {
  return [...passages].sort((a, b) => getPartNumber(a.passage_id) - getPartNumber(b.passage_id));
}

export function sortLessonNums(lessonNums: string[]): string[] {
  return [...lessonNums].sort((a, b) => {
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    return Number(a) - Number(b);
  });
}

// Lesson title = the part-1 passage's title, falling back to any part with one.
export function lessonTitle(passages: PickerPassage[]): string | undefined {
  const part1 = passages.find((p) => p.passage_id.split('_')[2] === '1');
  if (part1?.title) return part1.title;
  return passages.find((p) => p.title)?.title ?? undefined;
}

// Group a level's passages by lesson number, applying the same HSK1 lesson-1
// (pinyin) and "Numbers" part fix-ups as the legacy picker.
export function groupPassagesByLesson(
  levelKey: string,
  passages: PickerPassage[]
): Record<string, PickerPassage[]> {
  let list = passages;

  if (levelKey.toUpperCase() === 'HSK1') {
    list = list.filter((p) => !p.passage_id.startsWith('H1_1_'));
    list = [...list, { passage_id: PINYIN_PASSAGE_ID, hsk_level: 'HSK1' }];
    if (!list.some((p) => p.passage_id === NUMBER_PART_ID)) {
      list = [...list, { passage_id: NUMBER_PART_ID, hsk_level: 'HSK1', title: 'Number' }];
    }
  }

  const grouped: Record<string, PickerPassage[]> = {};
  for (const p of list) {
    const idParts = p.passage_id.split('_');
    const lessonNum = idParts.length >= 2 ? idParts[1] : 'Other';
    (grouped[lessonNum] ??= []).push(p);
  }
  return grouped;
}
