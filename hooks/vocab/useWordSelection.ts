"use client";

// hooks/useWordSelection.ts
// The vocab selection page's cross-page word set. Selection deliberately
// survives paging and filter changes — the legacy page kept the same global
// Map — so it is independent of whatever the table is currently showing and
// only needs the current rows to answer "is this whole page selected?".

import { useCallback, useMemo, useState } from "react";
import { wordKey } from "@/lib/vocab/vocabSelect";
import type { VocabRow } from "@/lib/types/vocab";

export function useWordSelection(rows: VocabRow[]) {
  const [selectedWords, setSelectedWords] = useState<Map<string, VocabRow>>(() => new Map());

  const toggleWord = useCallback((row: VocabRow, checked: boolean) => {
    setSelectedWords((prev) => {
      const next = new Map(prev);
      const key = wordKey(row);
      if (checked) next.set(key, row);
      else next.delete(key);
      return next;
    });
  }, []);

  const togglePage = useCallback((pageRows: VocabRow[], checked: boolean) => {
    setSelectedWords((prev) => {
      const next = new Map(prev);
      pageRows.forEach((row) => {
        const key = wordKey(row);
        if (checked) next.set(key, row);
        else next.delete(key);
      });
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedWords(new Map());
  }, []);

  const isSelected = useCallback(
    (row: VocabRow) => selectedWords.has(wordKey(row)),
    [selectedWords]
  );

  const allOnPageSelected = useMemo(
    () => rows.length > 0 && rows.every((row) => selectedWords.has(wordKey(row))),
    [rows, selectedWords]
  );

  const selectedWordList = useMemo(() => Array.from(selectedWords.values()), [selectedWords]);

  return {
    toggleWord,
    togglePage,
    clearSelection,
    isSelected,
    allOnPageSelected,
    selectedCount: selectedWords.size,
    selectedWordList,
  };
}
