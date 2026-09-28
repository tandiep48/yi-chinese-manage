"use client";

// app/learner/page.tsx
// Learner home — one container holding the Word Review, Lesson and Recommend
// tabs, each running its activity in place instead of navigating away
// (docs/plans/dashboard-tabs.md, Phase 6 swap).
//
// This replaced the ported Flask dashboard (templates/dashboard/dashboard.html
// + static/dashboard/dashboard.js): the current-lesson card, the review card and
// the "Ready to Practice" row are now the tabs themselves, and Learning
// Statistics moved to /learner/profile in Phase 5.
//
// Suspense is required, not decorative: useLearnerHome reads useSearchParams, and
// Next refuses to prerender a page that does so outside a Suspense boundary.

import { Suspense } from "react";
import { HomeShell } from "@/components/page/learner/home/HomeShell";

export default function LearnerHomePage() {
  return (
    <Suspense fallback={null}>
      <HomeShell />
    </Suspense>
  );
}
