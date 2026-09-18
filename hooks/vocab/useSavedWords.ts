"use client";

// hooks/useSavedWords.ts
// The learner's personal saved-word list for a book-lesson passage, backing the
// word popup's "Add to list" toggle. Ported from loadSavedWords()/toggleSavedWord()
// in Learning/web_app/static/reading/reading.js. Only book lessons have a personal
// list, so this is disabled (and never fetches) for HSK passages.

import { useCallback, useEffect, useState } from "react";
import { getSavedWords, addSavedWord, removeSavedWord } from "@/lib/api/learner/learnerVocab";
import type { LessonPassageDetail } from "@/lib/types/lesson";

interface UseSavedWordsReturn {
  enabled: boolean;
  saved: Set<string>;
  toggle: (cn: string) => Promise<void>;
}

export function useSavedWords(passage: LessonPassageDetail | null): UseSavedWordsReturn {
  const passageId = passage?.passage_id ?? "";
  const enabled = Boolean(passage?.book_code && passageId);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    if (!enabled) {
      setSaved(new Set());
      return;
    }
    getSavedWords(passageId)
      .then((words) => !cancelled && setSaved(new Set(words)))
      .catch(() => {
        /* leave empty on failure, matching the legacy page */
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, passageId]);

  const toggle = useCallback(
    async (cn: string) => {
      if (!enabled || !cn) return;
      const wasSaved = saved.has(cn);
      // Optimistic update; revert on failure.
      setSaved((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.delete(cn);
        else next.add(cn);
        return next;
      });
      try {
        if (wasSaved) await removeSavedWord(passageId, cn);
        else await addSavedWord(passageId, cn);
      } catch {
        setSaved((prev) => {
          const next = new Set(prev);
          if (wasSaved) next.add(cn);
          else next.delete(cn);
          return next;
        });
      }
    },
    [enabled, passageId, saved]
  );

  return { enabled, saved, toggle };
}
