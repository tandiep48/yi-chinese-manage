"use client";

// hooks/lesson/useCurrentLesson.ts
// The lesson part the learner is currently on, from GET /api/dashboard/current-lesson.
//
// This is what is left of useDashboardHome (docs/plans/dashboard-tabs.md Phase 6).
// That hook loaded the whole ported Flask dashboard — current lesson, global
// stats, two three-day charts and the recommendation row, five requests on every
// mount. Phase 5 took the statistics out, and Phase 6 deleted the dashboard
// itself: the recommendation row is now the Recommend tab, which fetches its own
// through useRecommend. One caller, one request, one concern — so it moved to
// hooks/lesson/ and took a name that says what it does.

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getDashboardCurrentLesson } from "@/lib/api/learner/dashboard";
import { cachedRead, invalidateRead } from "@/lib/api/readCache";
import type { DashboardLesson } from "@/lib/types/dashboard";

// Re-requested on every return to the Lesson tab, because the learner home
// unmounts the inactive panel. Completing a part can move the current lesson on,
// so a finished lesson run drops the key.
const CURRENT_LESSON_CACHE_KEY = "lesson:current";

export function invalidateCurrentLesson(): void {
  invalidateRead(CURRENT_LESSON_CACHE_KEY);
}

interface UseCurrentLessonReturn {
  loading: boolean;
  lesson: DashboardLesson | null;
  error: string | null;
}

export function useCurrentLesson(): UseCurrentLessonReturn {
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState<DashboardLesson | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Signed out there is nothing to fetch, and the return below derives
    // `loading` for that case rather than setting it synchronously here
    // (react-hooks/set-state-in-effect).
    if (authLoading || !user) return;

    let cancelled = false;

    cachedRead(CURRENT_LESSON_CACHE_KEY, () => getDashboardCurrentLesson(1, 5))
      .then((data) => !cancelled && setLesson(data.lesson ?? null))
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load your current lesson.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const signedOut = !authLoading && !user;
  return { loading: authLoading || (!signedOut && loading), lesson, error };
}
