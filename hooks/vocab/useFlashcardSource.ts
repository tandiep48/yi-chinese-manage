"use client";

// hooks/vocab/useFlashcardSource.ts
// Resolves the vocab word list for the /vocab-learning flash-cards page from the
// URL. Two entries, mirroring the legacy vocab_learning.js DOMContentLoaded flow:
//   - ?source=selection  → words the /vocab page stashed in sessionStorage
//     ('selectedVocabFlashcards'), read once then cleared (a refresh starts over,
//     same as the legacy readSelectedFlashcards()).
//   - ?passage_id=<id>   → the lesson part's vocab, fetched from /api/lesson/vocab.
// Words are normalised to the shared LessonVocabRow shape either way.

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getLessonPassageVocab } from "@/lib/api/learner/lessons";
import type { LessonVocabRow } from "@/lib/types/vocab";

const SELECTION_KEY = "selectedVocabFlashcards";

interface RawWord {
  word?: string;
  cn?: string;
  pinyin?: string;
  meaning_vn?: string;
  meaning_en?: string;
  audio_key?: string;
  level?: string;
  hsk_level?: string;
}

function toLessonVocabRow(row: RawWord): LessonVocabRow {
  const cn = row.word || row.cn || "";
  return {
    cn,
    pinyin: row.pinyin || "",
    meaning_vn: row.meaning_vn || "",
    meaning_en: row.meaning_en || "",
    audio_key: row.audio_key || "",
    hsk_level: row.level || row.hsk_level || "",
  };
}

export function useFlashcardSource() {
  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const passageId = searchParams.get("passage_id") || "";

  const [words, setWords] = useState<LessonVocabRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    // Read once — the selection branch consumes (clears) sessionStorage, so
    // React StrictMode's double-invoke must not run it twice.
    if (ran.current) return;
    ran.current = true;

    if (source === "selection") {
      let parsed: RawWord[] = [];
      try {
        const raw = sessionStorage.getItem(SELECTION_KEY);
        sessionStorage.removeItem(SELECTION_KEY);
        if (raw) parsed = JSON.parse(raw);
      } catch {
        parsed = [];
      }
      const rows = Array.isArray(parsed)
        ? parsed.map(toLessonVocabRow).filter((w) => w.cn)
        : [];
      setWords(rows);
      setLoading(false);
      return;
    }

    if (passageId) {
      getLessonPassageVocab(passageId)
        .then((vocab) => setWords((vocab ?? []).map(toLessonVocabRow)))
        .catch((e) => setError(e instanceof Error ? e.message : "Failed to load words."))
        .finally(() => setLoading(false));
      return;
    }

    setLoading(false);
  }, [source, passageId]);

  return { words, loading, error, passageId: passageId || undefined };
}
