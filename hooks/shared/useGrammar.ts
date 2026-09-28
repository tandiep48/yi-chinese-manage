"use client";

// hooks/shared/useGrammar.ts
// Lesson-wide grammar rules for a passage, split into sections. Ported from
// loadGrammar()/splitGrammarByType1() in Learning/web_app/static/grammar/grammar.js:
// the flat id-ordered list starts a new section at each type=1 (title) row.

import { useEffect, useState } from "react";
import { getPassageGrammar } from "@/lib/api/learner/lessons";
import type { LessonGrammarRule } from "@/lib/types/lesson";

export type GrammarSection = LessonGrammarRule[];

interface UseGrammarReturn {
  loading: boolean;
  error: string | null;
  sections: GrammarSection[];
}

// [1,2,4,2,2,1,4,3,2] -> [[1,2,4,2,2],[1,4,3,2]]; a leading non-title row opens
// its own section too (current === null case in the legacy splitter).
export function splitGrammarByType1(rules: LessonGrammarRule[]): GrammarSection[] {
  const sections: GrammarSection[] = [];
  let current: GrammarSection | null = null;
  for (const g of rules) {
    if (g.type === 1 || current === null) {
      current = [];
      sections.push(current);
    }
    current.push(g);
  }
  return sections;
}

export function useGrammar(passageId: string): UseGrammarReturn {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sections, setSections] = useState<GrammarSection[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (!passageId) {
      setLoading(false);
      setSections([]);
      return;
    }
    setLoading(true);
    setError(null);

    getPassageGrammar(passageId)
      .then((rules) => !cancelled && setSections(splitGrammarByType1(rules)))
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load grammar.");
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [passageId]);

  return { loading, error, sections };
}
