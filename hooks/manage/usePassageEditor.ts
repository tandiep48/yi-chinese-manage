"use client";

// hooks/manage/usePassageEditor.ts
// One passage and its lines; every change is saved to the API on its own.

import { useState, useCallback, useEffect } from "react";
import type { LessonLine, LessonPassage, LineFormData, PassageDetailsData } from "@/lib/types/lesson";
import {
  addPassageLine,
  getPassage,
  reorderPassageLines,
  updatePassage,
  updatePassageLine,
} from "@/lib/api/manage/passage";

export function usePassageEditor(passageId: string) {
  const [passage, setPassage] = useState<LessonPassage | null>(null);
  const [lines, setLines] = useState<LessonLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    let active = true;
    getPassage(passageId)
      .then((loaded) => {
        if (!active) return;
        setPassage(loaded);
        setLines(loaded.lines ?? []);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : "Failed to load the passage.");
      });
    return () => {
      active = false;
    };
  }, [passageId]);

  const nextLineId = Math.max(0, ...lines.map((l) => l.line_id ?? 0)) + 1;

  const saveDetails = useCallback(
    async (data: PassageDetailsData) => {
      const saved = await updatePassage(passageId, data);
      setPassage(saved);
      return saved;
    },
    [passageId]
  );

  const saveLine = useCallback(
    async (lineId: number, data: LineFormData) => {
      const saved = await updatePassageLine(passageId, lineId, data);
      setLines((current) => current.map((l) => (l.id === saved.id ? saved : l)));
      return saved;
    },
    [passageId]
  );

  const addLine = useCallback(
    async (data: LineFormData) => {
      const saved = await addPassageLine(passageId, { ...data, line_id: nextLineId });
      setLines((current) => [...current, saved]);
      return saved;
    },
    [passageId, nextLineId]
  );

  // Swap the line at `index` with its neighbour (-1 above, 1 below).
  const moveLine = useCallback(
    async (index: number, step: -1 | 1) => {
      const ids = lines.map((l) => l.line_id as number);
      [ids[index], ids[index + step]] = [ids[index + step], ids[index]];
      setReordering(true);
      try {
        setLines(await reorderPassageLines(passageId, ids));
      } finally {
        setReordering(false);
      }
    },
    [passageId, lines]
  );

  return { passage, lines, error, reordering, nextLineId, saveDetails, saveLine, addLine, moveLine };
}
