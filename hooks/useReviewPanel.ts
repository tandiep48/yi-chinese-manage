"use client";

// hooks/useReviewPanel.ts
// Review-panel state machine (Learning/web_app/static/review/review.js): the
// session-list view with backend filters + paging, and the per-session detail
// view with its own result/skill filters. Data is login-required raw JSON.

import { useState, useEffect, useCallback } from "react";
import {
  getPracticeHistory,
  getPracticeHistoryDetail,
} from "@/lib/api/practice";
import { UnauthenticatedError } from "@/lib/api/client";
import { useT } from "@/components/i18n/I18nProvider";
import type {
  ReviewHistoryFilters,
  ReviewSessionSummary,
  ReviewSessionDetail,
} from "@/lib/types/types";
import type { ResultFilter, SkillFilter } from "@/lib/review/reviewLogic";

export function useReviewPanel() {
  const { t } = useT();

  const [filters, setFilters] = useState<ReviewHistoryFilters>(() => ({
    level: "all",
    category: "all",
    sort: "recent",
    page: 1,
  }));
  const [sessions, setSessions] = useState<ReviewSessionSummary[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [view, setView] = useState<"list" | "detail">("list");
  const [detail, setDetail] = useState<ReviewSessionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const [skillFilter, setSkillFilter] = useState<SkillFilter>("all");

  // (Re)load the session list whenever the backend filters change.
  useEffect(() => {
    let cancelled = false;
    setListLoading(true);
    setListError(null);
    getPracticeHistory(filters)
      .then((data) => {
        if (cancelled) return;
        setSessions(data.sessions || []);
        setHasMore(!!data.has_more);
      })
      .catch((e) => {
        if (cancelled) return;
        setSessions([]);
        setHasMore(false);
        setListError(
          e instanceof UnauthenticatedError
            ? t("review.failed_load")
            : t("review.connect_failed")
        );
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters, t]);

  // Patch the list filters and reset to page 1 (any filter change restarts paging).
  const setFilter = useCallback(
    (patch: Partial<Omit<ReviewHistoryFilters, "page">>) => {
      setFilters((f) => ({ ...f, ...patch, page: 1 }));
    },
    []
  );

  const changePage = useCallback(
    (delta: number) => {
      setFilters((f) => {
        const next = f.page + delta;
        if (next < 1 || (delta > 0 && !hasMore)) return f;
        return { ...f, page: next };
      });
    },
    [hasMore]
  );

  const openSession = useCallback(
    async (sessionId: number) => {
      setView("detail");
      setDetail(null);
      setResultFilter("all");
      setSkillFilter("all");
      setDetailLoading(true);
      setDetailError(null);
      try {
        const data = await getPracticeHistoryDetail(sessionId);
        setDetail(data);
      } catch (e) {
        setDetailError(
          e instanceof UnauthenticatedError
            ? t("review.failed_load")
            : t("review.connect_failed")
        );
      } finally {
        setDetailLoading(false);
      }
    },
    [t]
  );

  const backToList = useCallback(() => setView("list"), []);

  return {
    filters,
    sessions,
    hasMore,
    listLoading,
    listError,
    view,
    detail,
    detailLoading,
    detailError,
    resultFilter,
    skillFilter,
    setFilter,
    changePage,
    openSession,
    backToList,
    setResultFilter,
    setSkillFilter,
  };
}
