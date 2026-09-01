"use client";

// hooks/useTranslation.ts
// Lesson-wide translation sentences for a passage. Ported from loadTranslation()
// in Learning/web_app/static/translation/translation.js: derive HSK level + lesson
// from the passage id, then fetch every sentence for that lesson.

import { useEffect, useState } from "react";
import { getLessonTranslations } from "@/lib/api/translation";
import { hskLevelFromPassageId } from "@/lib/lessons/lessons";
import type { TranslationRow } from "@/lib/types/types";

interface UseTranslationReturn {
  loading: boolean;
  error: string | null;
  rows: TranslationRow[];
}

export function useTranslation(passageId: string): UseTranslationReturn {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<TranslationRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    const seg = passageId.split("_");
    const lesson = seg.length >= 2 ? seg[1] : "";
    if (!passageId || !lesson) {
      setLoading(false);
      setRows([]);
      return;
    }
    setLoading(true);
    setError(null);

    getLessonTranslations(hskLevelFromPassageId(passageId), lesson)
      .then((data) => !cancelled && setRows(data))
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load translations.");
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [passageId]);

  return { loading, error, rows };
}
