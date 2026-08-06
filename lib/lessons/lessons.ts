// lib/lessons/lessons.ts
// Mock data + types for the lesson picker flow (HSK level → lesson → part).
// Replace the getters with real API calls when wiring the backend.
import { LESSON_CONSTANTS } from './constants';

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

export const HSK_LEVELS: HskLevel[] = LESSON_CONSTANTS.HSK_LEVELS;

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
  return Array.from({ length: LESSON_CONSTANTS.LESSONS_PER_LEVEL }, (_, i) => {
    const n = i + 1;
    return {
      lesson: n,
      partCount: LESSON_CONSTANTS.PARTS_PER_LESSON,
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
  const parts: LessonPart[] = Array.from({ length: LESSON_CONSTANTS.PARTS_PER_LESSON }, (_, i) => ({
    key: `part-${i + 1}`,
    type: "part" as const,
    partNumber: i + 1,
    progress: mockProgress(lesson * 10 + i + 1),
  }));
  parts.push({ key: "grammar", type: "grammar" });
  parts.push({ key: "translation", type: "translation" });
  return parts;
}
