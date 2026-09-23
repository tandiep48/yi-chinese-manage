"use client";

// hooks/practice/useRecommend.ts
// State machine for the Recommend page — ports the module globals of
// Learning/web_app/static/recommend/recommend.js (fetch, the four filter tabs,
// pagination, and the multi-select queue) into a single hook. Components stay
// presentational; pure filtering/paging lives in lib/recommend/recommendLogic.

import { useCallback, useEffect, useMemo, useState } from "react";
import { getRecommendations } from "@/lib/api/learner/practice";
import { getVocabHasHistory } from "@/lib/api/learner/vocab";
import { cachedRead, invalidateRead } from "@/lib/api/readCache";
import { UnauthenticatedError } from "@/lib/api/client";
import type { RecommendedPractice } from "@/lib/types/dashboard";
import type { PracticeMultiItem } from "@/lib/types/practice";
import {
  clampPage,
  filterRecommendations,
  getPageNumbers,
  pageSlice,
  RECOMMEND_PAGE_SIZE,
  recommendationKey,
  toMultiItem,
  type CategoryFilter,
  type LevelFilter,
  type PageToken,
  type RecommendFilters,
  type SkillFilter,
  type StatusFilter,
} from "@/lib/recommend/recommendLogic";

export type RecommendStatusKind =
  | "loading"
  | "ready"
  | "empty"
  | "new-user"
  | "error";

const DEFAULT_FILTERS: RecommendFilters = {
  level: "all",
  skill: "all",
  category: "all",
  status: "Not start",
};

// Re-requested on every return to the Recommend tab, because the learner home
// unmounts the inactive panel. Finishing a practice run changes what is
// recommended, so the run's exit drops the key.
const RECOMMEND_CACHE_KEY = "recommend:list";

export function invalidateRecommendations(): void {
  invalidateRead(RECOMMEND_CACHE_KEY);
}

export interface RecommendOptions {
  // Embedded start path: run the queue in the caller's panel instead of stashing
  // it in sessionStorage and leaving the page for /learner/practice/multi.
  onStartMulti?: (items: PracticeMultiItem[]) => void;
}

export function useRecommend({ onStartMulti }: RecommendOptions = {}) {
  const [status, setStatus] = useState<RecommendStatusKind>("loading");
  const [errorKey, setErrorKey] = useState<string>("recommend.connect_failed");
  const [all, setAll] = useState<RecommendedPractice[]>([]);
  const [filters, setFilters] = useState<RecommendFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<PracticeMultiItem[]>([]);

  useEffect(() => {
    // status already defaults to "loading"; the fetch resolves it. Avoiding a
    // synchronous setState here keeps react-hooks/set-state-in-effect quiet.
    let cancelled = false;
    cachedRead(RECOMMEND_CACHE_KEY, getRecommendations)
      .then(async (recs) => {
        if (cancelled) return;
        if (recs.length === 0) {
          // Distinguish a brand-new learner (no vocab history) from a user who
          // has simply cleared everything, exactly like the legacy fallback.
          const hasHistory = await getVocabHasHistory();
          if (cancelled) return;
          setAll([]);
          setStatus(hasHistory ? "empty" : "new-user");
          return;
        }
        setAll(recs);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorKey(
          err instanceof UnauthenticatedError
            ? "recommend.failed_load"
            : "recommend.connect_failed"
        );
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () => filterRecommendations(all, filters),
    [all, filters]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / RECOMMEND_PAGE_SIZE));
  const safePage = clampPage(page, filtered.length);
  const pageItems = useMemo(
    () => pageSlice(filtered, safePage),
    [filtered, safePage]
  );
  const pageNumbers: PageToken[] = useMemo(
    () => getPageNumbers(safePage, totalPages),
    [safePage, totalPages]
  );

  const selectedKeys = useMemo(
    () => new Set(selected.map(recommendationKey)),
    [selected]
  );
  const isSelected = useCallback(
    (rec: RecommendedPractice) => selectedKeys.has(recommendationKey(rec)),
    [selectedKeys]
  );

  // A filter change resets to page 1 (legacy onFilterChange).
  const setFilter = useCallback(
    <K extends keyof RecommendFilters>(key: K, value: RecommendFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setPage(1);
    },
    []
  );

  const goToPage = useCallback((next: number) => {
    setPage(next);
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }, []);

  const toggleSelect = useCallback((rec: RecommendedPractice) => {
    setSelected((prev) => {
      const key = recommendationKey(rec);
      return prev.some((item) => recommendationKey(item) === key)
        ? prev.filter((item) => recommendationKey(item) !== key)
        : [...prev, toMultiItem(rec)];
    });
  }, []);

  const startSelected = useCallback(() => {
    if (selected.length === 0) return;
    // Embedded: hand the queue to the panel. usePracticeEngine takes it as
    // `items`, so neither handoff key is written and the page never navigates.
    if (onStartMulti) {
      onStartMulti(selected);
      return;
    }
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(
      "multi_practice_queue",
      JSON.stringify(selected)
    );
    window.sessionStorage.setItem("practice_referrer", "recommend");
    window.location.href = "/learner/practice/multi";
  }, [selected, onStartMulti]);

  return {
    status,
    errorKey,
    filters,
    setFilter: setFilter as {
      (key: "level", value: LevelFilter): void;
      (key: "skill", value: SkillFilter): void;
      (key: "category", value: CategoryFilter): void;
      (key: "status", value: StatusFilter): void;
    },
    page: safePage,
    totalPages,
    totalItems: filtered.length,
    pageItems,
    pageNumbers,
    pageSize: RECOMMEND_PAGE_SIZE,
    goToPage,
    isSelected,
    toggleSelect,
    selectedCount: selected.length,
    startSelected,
  };
}
