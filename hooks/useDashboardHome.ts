"use client";

// hooks/useDashboardHome.ts
// Data for the learner home dashboard (app/learner/page.tsx). Ported from
// Learning/web_app/static/dashboard/dashboard.js's loadHomeDashboard(), against
// the same (non-enveloped) JSON endpoints.

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  getDashboardCurrentLesson,
  getGlobalStats,
  getLearnedWordsLast3Days,
  getTimeLearnedLast3Days,
  getRecommendedPractices,
} from "@/lib/api/dashboard";
import type {
  DashboardLesson,
  GlobalStats,
  LearnedWordsDay,
  TimeLearnedDay,
  RecommendedPractice,
} from "@/lib/types/types";

interface UseDashboardHomeReturn {
  loading: boolean;
  signedOut: boolean;
  hasRecent: boolean | null;
  lesson: DashboardLesson | null;
  stats: GlobalStats | null;
  wordsDays: LearnedWordsDay[];
  timeDays: TimeLearnedDay[];
  recommendations: RecommendedPractice[];
  recommendError: string | null;
  error: string | null;
  refresh: () => void;
}

export function useDashboardHome(): UseDashboardHomeReturn {
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [hasRecent, setHasRecent] = useState<boolean | null>(null);
  const [lesson, setLesson] = useState<DashboardLesson | null>(null);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [wordsDays, setWordsDays] = useState<LearnedWordsDay[]>([]);
  const [timeDays, setTimeDays] = useState<TimeLearnedDay[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedPractice[]>([]);
  const [recommendError, setRecommendError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getDashboardCurrentLesson(1, 5)
      .then((data) => {
        if (cancelled) return;
        setHasRecent(data.has_recent);
        setLesson(data.lesson ?? null);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load dashboard.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    getGlobalStats()
      .then((data) => !cancelled && setStats(data))
      .catch(() => {
        // Stats are a secondary widget — a failure here shouldn't block the
        // rest of the dashboard, matching the legacy page's soft-fail.
      });

    getLearnedWordsLast3Days()
      .then((days) => !cancelled && setWordsDays(days))
      .catch(() => !cancelled && setWordsDays([]));

    getTimeLearnedLast3Days()
      .then((days) => !cancelled && setTimeDays(days))
      .catch(() => !cancelled && setTimeDays([]));

    setRecommendError(null);
    getRecommendedPractices(4, "Not start")
      .then((recs) => !cancelled && setRecommendations(recs))
      .catch((e) => {
        if (cancelled) return;
        setRecommendations([]);
        setRecommendError(e instanceof Error ? e.message : "Could not load recommendations.");
      });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, tick]);

  return {
    loading: authLoading || loading,
    signedOut: !authLoading && !user,
    hasRecent,
    lesson,
    stats,
    wordsDays,
    timeDays,
    recommendations,
    recommendError,
    error,
    refresh,
  };
}
