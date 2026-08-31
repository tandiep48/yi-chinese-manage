"use client";

// hooks/useRecentLearning.ts
// Backs the "Continue where you left off" panel on the learning page. Ported
// from loadRecentLearning() in Learning/web_app/static/learning/learning.js.
// Signed-out or on any failure it resolves to no recent lesson (soft-fail), so
// the picker still renders.

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getRecentLearning } from "@/lib/api/recent";

interface UseRecentLearningReturn {
  loading: boolean;
  passageId: string | null;
}

export function useRecentLearning(): UseRecentLearningReturn {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [passageId, setPassageId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setPassageId(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    getRecentLearning()
      .then((recent) => !cancelled && setPassageId(recent?.passage_id ?? null))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return { loading: authLoading || loading, passageId };
}
