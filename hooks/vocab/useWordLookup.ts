"use client";

// hooks/useWordLookup.ts
// Prefetches vocabulary for every clickable word in a lesson's lines, so the
// Lesson Summary word popup can show pinyin/meaning instantly. Ported from
// prefetchTokens() in Learning/web_app/static/reading/reading.js. The backend
// caps lookup-batch at 80 words, so larger lessons are chunked.

import { useEffect, useMemo, useState } from "react";
import { lookupWordsBatch } from "@/lib/api/learner/vocab";
import { isPunctToken } from "@/lib/lessons/tokens";
import type { LessonPassageLine } from "@/lib/types/lesson";
import type { VocabLookupMap } from "@/lib/types/vocab";

const BATCH_SIZE = 80;
// A newline can never appear inside a single word token, so it is a safe key
// join/split separator.
const KEY_SEP = "\n";

interface UseWordLookupReturn {
  lookupMap: VocabLookupMap;
  ready: boolean;
}

export function useWordLookup(lines: LessonPassageLine[]): UseWordLookupReturn {
  const [lookupMap, setLookupMap] = useState<VocabLookupMap>({});
  const [ready, setReady] = useState(false);

  // A value-stable key for the unique clickable words. Depending the effect on
  // this string (not the `lines` array identity) means an unmemoised `lines`
  // prop can't trigger an infinite prefetch/render loop.
  const wordsKey = useMemo(
    () =>
      [...new Set(lines.flatMap((l) => l.tokens ?? []).filter((w) => w && !isPunctToken(w)))].join(
        KEY_SEP
      ),
    [lines]
  );

  useEffect(() => {
    let cancelled = false;
    const words = wordsKey ? wordsKey.split(KEY_SEP) : [];
    if (words.length === 0) {
      setLookupMap({});
      setReady(true);
      return;
    }
    setReady(false);

    const chunks: string[][] = [];
    for (let i = 0; i < words.length; i += BATCH_SIZE) {
      chunks.push(words.slice(i, i + BATCH_SIZE));
    }

    Promise.all(chunks.map(lookupWordsBatch))
      .then((maps) => {
        if (cancelled) return;
        setLookupMap(Object.assign({}, ...maps));
      })
      .catch(() => {
        if (!cancelled) setLookupMap({});
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [wordsKey]);

  return { lookupMap, ready };
}
