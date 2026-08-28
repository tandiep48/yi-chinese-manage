"use client";

// hooks/useLessonPicker.ts
// Data for the HSK lesson/part picker (app/(learner)/hsk/[level]/...). Ported
// from Learning/web_app/static/shared/passage_picker.js's showLessonPicker().

import { useEffect, useState } from "react";
import { getPassages, getPickerProgress } from "@/lib/api/lessons";
import {
  groupPassagesByLesson,
  sortLessonNums,
  sortPartsByNumber,
  toProgress,
  lessonTitle,
  type Progress,
} from "@/lib/lessons/lessons";
import type { PickerPassage } from "@/lib/types/types";

export interface PickerLessonSummary {
  lesson: string;
  title?: string;
  parts: PickerPassage[];
  partCount: number;
  progress: Progress;
  isPinyinLesson: boolean;
}

interface UseLessonPickerReturn {
  loading: boolean;
  error: string | null;
  lessons: PickerLessonSummary[];
  partsProgress: Record<string, Progress>;
}

export function useLessonPicker(levelKey: string): UseLessonPickerReturn {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lessons, setLessons] = useState<PickerLessonSummary[]>([]);
  const [partsProgress, setPartsProgress] = useState<Record<string, Progress>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([getPassages(levelKey), getPickerProgress(levelKey)])
      .then(([passages, progress]) => {
        if (cancelled) return;

        const grouped = groupPassagesByLesson(levelKey, passages);
        const summaries = sortLessonNums(Object.keys(grouped)).map((lessonNum): PickerLessonSummary => {
          const parts = sortPartsByNumber(grouped[lessonNum]);
          return {
            lesson: lessonNum,
            title: lessonTitle(parts),
            parts,
            partCount: parts.length,
            progress: toProgress(progress?.lessons?.[lessonNum]),
            isPinyinLesson: levelKey.toUpperCase() === "HSK1" && lessonNum === "1",
          };
        });
        setLessons(summaries);

        const partsMap: Record<string, Progress> = {};
        for (const [passageId, entry] of Object.entries(progress?.parts ?? {})) {
          partsMap[passageId] = toProgress(entry);
        }
        setPartsProgress(partsMap);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load lessons.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [levelKey]);

  return { loading, error, lessons, partsProgress };
}
