"use client";

// hooks/profile/useProfileStats.ts
// The Learning Statistics block's data, moved off the dashboard
// (docs/plans/dashboard-tabs.md Phase 5). Three independent reads that the
// legacy dashboard also soft-failed: a stats widget that can't load should
// render empty, never take the page down with it.

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  getGlobalStats,
  getLearnedWordsLast3Days,
  getTimeLearnedLast3Days,
} from "@/lib/api/learner/dashboard";
import type { GlobalStats, LearnedWordsDay, TimeLearnedDay } from "@/lib/types/dashboard";

interface UseProfileStatsReturn {
  loading: boolean;
  stats: GlobalStats | null;
  wordsDays: LearnedWordsDay[];
  timeDays: TimeLearnedDay[];
}

export function useProfileStats(): UseProfileStatsReturn {
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [wordsDays, setWordsDays] = useState<LearnedWordsDay[]>([]);
  const [timeDays, setTimeDays] = useState<TimeLearnedDay[]>([]);

  useEffect(() => {
    // Signed out there is nothing to fetch, and the return below derives
    // `loading` for that case rather than setting it synchronously here
    // (react-hooks/set-state-in-effect).
    if (authLoading || !user) return;

    let cancelled = false;

    // The headline figures gate the loading state; the two charts fill in
    // beside them and each falls back to an empty series of its own.
    getGlobalStats()
      .then((data) => !cancelled && setStats(data))
      .catch(() => {
        // Soft-fail, matching the legacy dashboard.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    getLearnedWordsLast3Days()
      .then((days) => !cancelled && setWordsDays(days))
      .catch(() => !cancelled && setWordsDays([]));

    getTimeLearnedLast3Days()
      .then((days) => !cancelled && setTimeDays(days))
      .catch(() => !cancelled && setTimeDays([]));

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const signedOut = !authLoading && !user;
  return {
    loading: authLoading || (!signedOut && loading),
    stats,
    wordsDays,
    timeDays,
  };
}
