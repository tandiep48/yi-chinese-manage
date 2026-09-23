"use client";

// components/page/learner/home/ReviewTab.tsx
// Word Review panel (docs/plans/dashboard-tabs.md Phase 2). The list, selection and
// audio are VocabReviewPage's, unforked — hooks/vocab/useVocabReview stays the
// single source. Only the hand-off changes: instead of stashing the selection in
// sessionStorage and navigating to /learner/vocab-training-batch, the rows go
// straight into a trainer that runs inside this panel.
//
// The rows need no round trip. /api/vocab/review and /api/vocab/words both return
// normalize_vocab_row() output, so what the list already holds IS a trainer row —
// the embedded path saves the POST /api/vocab/words the standalone route makes.
//
// Both children keep their own root class and stylesheet (`.vocab-review`,
// `.trainer-shell.vocab-trainer`), so neither is ever styled by the container (§2).

import { useEffect, useState } from "react";
import { VocabReviewPage } from "@/components/page/learner/vocab-review/VocabReviewPage";
import { VocabTrainerPage } from "@/components/page/learner/vocab-training/VocabTrainerPage";
import { invalidateVocabReview } from "@/hooks/vocab/useVocabReview";
import type { VocabRow } from "@/lib/types/vocab";
import type { HomePanelProps } from "./HomePanel";

export const REVIEW_RUN = "vocab-trainer";

export function ReviewTab({ run, setRun }: HomePanelProps) {
  const [words, setWords] = useState<VocabRow[]>([]);

  // A reload lands here with ?run= still set but the selection gone — it lived in
  // memory, not in the URL, and putting a few hundred words there is not an option.
  // Fall back to the list rather than mounting a trainer with nothing in it.
  useEffect(() => {
    if (run === REVIEW_RUN && words.length === 0) setRun(null);
  }, [run, words.length, setRun]);

  if (run === REVIEW_RUN && words.length > 0) {
    return (
      <VocabTrainerPage
        words={words}
        contained
        onExit={() => {
          // Training is what removes words from the review list, so the cached
          // page-1 read is stale the moment a run ends.
          invalidateVocabReview();
          setWords([]);
          setRun(null);
        }}
      />
    );
  }

  return (
    <VocabReviewPage
      embedded
      onStart={(rows) => {
        setWords(rows);
        setRun(REVIEW_RUN);
      }}
    />
  );
}
