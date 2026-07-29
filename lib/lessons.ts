// lib/lessons.ts
// Mock data + types for the lesson picker flow (HSK level → lesson → part).
// Replace the getters with real API calls when wiring the backend.

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

export interface Lesson {
  lesson: number;
  partCount: number;
  progress: Progress;
}

export type PartType = "part" | "grammar" | "translation";

export interface LessonPart {
  key: string; // "part-1" | "grammar" | "translation"
  type: PartType;
  partNumber?: number; // numbered parts only
  progress?: Progress; // numbered parts only
}

// HSK level card colours mirror the Learning pickers (passage_picker.js HSK_COLORS).
export const HSK_LEVELS: HskLevel[] = [
  { key: "HSK1", level: 1, label: "HSK 1", color: "#d9d9d8" },
  { key: "HSK2", level: 2, label: "HSK 2", color: "#d0f1d2" },
  { key: "HSK3", level: 3, label: "HSK 3", color: "#99d8e9" },
  { key: "HSK4", level: 4, label: "HSK 4", color: "#fce084" },
  { key: "HSK5", level: 5, label: "HSK 5", color: "#fcb86f" },
  { key: "HSK6", level: 6, label: "HSK 6", color: "#ee5550" },
];

const LESSONS_PER_LEVEL = 8;
const PARTS_PER_LESSON = 3;

// Deterministic mock progress so the bars render without a backend.
function mockProgress(seed: number): Progress {
  const totalWords = 40;
  const progressPct = (seed * 17) % 100;
  const learnedWords = Math.round((totalWords * progressPct) / 100);
  return { learnedWords, totalWords, progressPct };
}

export function getLevel(key: string): HskLevel | undefined {
  return HSK_LEVELS.find((l) => l.key.toLowerCase() === key.toLowerCase());
}

export function getLessons(levelKey: string): Lesson[] {
  if (!getLevel(levelKey)) return [];
  return Array.from({ length: LESSONS_PER_LEVEL }, (_, i) => {
    const n = i + 1;
    return {
      lesson: n,
      partCount: PARTS_PER_LESSON,
      progress: mockProgress(n),
    };
  });
}

export function getLessonProgress(levelKey: string, lesson: number): Progress {
  return mockProgress(lesson);
}

// Mock: N numbered parts (each with progress) + Grammar + Translation.
export function getParts(levelKey: string, lesson: number): LessonPart[] {
  if (!getLevel(levelKey) || Number.isNaN(lesson)) return [];
  const parts: LessonPart[] = Array.from({ length: PARTS_PER_LESSON }, (_, i) => ({
    key: `part-${i + 1}`,
    type: "part" as const,
    partNumber: i + 1,
    progress: mockProgress(lesson * 10 + i + 1),
  }));
  parts.push({ key: "grammar", type: "grammar" });
  parts.push({ key: "translation", type: "translation" });
  return parts;
}
