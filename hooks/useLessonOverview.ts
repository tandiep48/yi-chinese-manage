"use client";

// hooks/useLessonOverview.ts
// Data for a single lesson part's read-only overview screens (Lesson Overview
// = passage content, Vocab Overview = linked vocabulary) — the "before you
// start training" screens ported from Learning/web_app/static/reading/reading.js.

import { useEffect, useState } from "react";
import { getLessonPassageDetail, getLessonPassageVocab } from "@/lib/api/lessons";
import type { LessonPassageDetail, LessonVocabRow } from "@/lib/types/types";

interface UseLessonOverviewReturn {
  loading: boolean;
  error: string | null;
  passage: LessonPassageDetail | null;
  vocab: LessonVocabRow[];
  vocabError: string | null;
}

export function useLessonOverview(passageId: string): UseLessonOverviewReturn {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passage, setPassage] = useState<LessonPassageDetail | null>(null);
  const [vocab, setVocab] = useState<LessonVocabRow[]>([]);
  const [vocabError, setVocabError] = useState<string | null>(null);

  useEffect(() => {
    if (!passageId) {
      setLoading(false);
      setError("No passage selected.");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setVocabError(null);

    getLessonPassageDetail(passageId)
      .then((data) => !cancelled && setPassage(data))
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load passage.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    getLessonPassageVocab(passageId)
      .then((rows) => !cancelled && setVocab(rows))
      .catch((e) => {
        if (cancelled) return;
        setVocab([]);
        setVocabError(e instanceof Error ? e.message : "Failed to load vocabulary.");
      });

    return () => {
      cancelled = true;
    };
  }, [passageId]);

  return { loading, error, passage, vocab, vocabError };
}
