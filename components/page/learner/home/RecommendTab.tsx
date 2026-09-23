"use client";

// components/page/learner/home/RecommendTab.tsx
// Recommend panel (docs/plans/dashboard-tabs.md Phase 3). The filters, card grid
// and multi-select are RecommendPage's, unforked — hooks/practice/useRecommend
// stays the single source. Only the hand-off changes: instead of stashing the
// queue in multi_practice_queue, marking practice_referrer and leaving the page
// for /learner/practice/multi, the selected items go straight into a
// PracticeRunner that runs inside this panel.
//
// PracticeRunner was already props-driven, so this is the `items` / `referrer` /
// `onExit` / `onRetry` options from Phase 0 doing their job. `onRetry` matters
// here: the standalone "try again" is a full page reload, which embedded would
// take the whole dashboard with it — remounting the runner reloads just the run.
//
// Both children keep their own root class and stylesheet (`.recommend-page`,
// `.practice-shell`), so neither is ever styled by the container (§2).

import { useEffect, useState } from "react";
import { RecommendPage } from "@/components/page/learner/recommend/RecommendPage";
import { PracticeRunner } from "@/components/page/learner/practice/PracticeRunner";
import { invalidateRecommendations } from "@/hooks/practice/useRecommend";
import type { PracticeMultiItem } from "@/lib/types/practice";
import type { HomePanelProps } from "./HomePanel";

export const RECOMMEND_RUN = "practice-multi";

export function RecommendTab({ run, setRun }: HomePanelProps) {
  const [items, setItems] = useState<PracticeMultiItem[]>([]);
  // Bumped by "try again", which remounts the runner for a fresh session.
  const [attempt, setAttempt] = useState(0);

  // A reload lands here with ?run= still set but the queue gone — it lived in
  // memory, not in the URL. Fall back to the grid rather than an empty runner.
  useEffect(() => {
    if (run === RECOMMEND_RUN && items.length === 0) setRun(null);
  }, [run, items.length, setRun]);

  if (run === RECOMMEND_RUN && items.length > 0) {
    return (
      <PracticeRunner
        key={attempt}
        category="practice"
        multi
        items={items}
        // The panel is the run's "back", so the label reads as returning to the
        // grid rather than to the standalone recommend route.
        referrer={{ href: "/learner/recommend", title: "recommend" }}
        onExit={() => {
          // A finished practice run changes what gets recommended next.
          invalidateRecommendations();
          setItems([]);
          setRun(null);
        }}
        onRetry={() => setAttempt((n) => n + 1)}
      />
    );
  }

  return (
    <RecommendPage
      embedded
      onStartMulti={(queue) => {
        setItems(queue);
        setRun(RECOMMEND_RUN);
      }}
    />
  );
}
