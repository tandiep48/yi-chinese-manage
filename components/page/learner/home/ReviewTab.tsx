"use client";

// components/page/learner/home/ReviewTab.tsx
// Word Review panel (docs/plans/dashboard-tabs.md Phase 2). The review page is
// watch-only now — the learner browses their "Recent learn word" and "Review word"
// lists with the vocabulary page's study tools, with no selection and no trainer.
// So this tab is just the shared VocabReviewPage mounted embedded (which hides the
// back-to-dashboard link); it runs nothing, so it ignores the run/setRun guard the
// other panels use.

import { VocabReviewPage } from "@/components/page/learner/vocab-review/VocabReviewPage";

export function ReviewTab() {
  return <VocabReviewPage embedded />;
}
