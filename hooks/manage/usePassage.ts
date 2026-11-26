"use client";

// hooks/manage/usePassage.ts
// Paging and filters for the passage list.

import { useState, useCallback, useEffect, useRef } from "react";
import type { LessonPassage } from "@/lib/types/lesson";
import { listPassages, type PassageFilters } from "@/lib/api/manage/passage";

const PAGE_SIZE = 20;

export function usePassage() {
  const [items, setItems] = useState<LessonPassage[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<PassageFilters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Only the newest request may write state.
  const latestRequest = useRef(0);

  const fetchList = useCallback(async () => {
    const request = ++latestRequest.current;
    setLoading(true);
    setError(null);
    try {
      const res = await listPassages(page, PAGE_SIZE, filters);
      if (request !== latestRequest.current) return;
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e) {
      if (request !== latestRequest.current) return;
      setError(e instanceof Error ? e.message : "Failed to load passages");
    } finally {
      if (request === latestRequest.current) setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchList();
  }, [fetchList]);

  const setFilter = useCallback((patch: PassageFilters) => {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  }, []);

  return {
    items,
    total,
    totalPages,
    page,
    pageSize: PAGE_SIZE,
    filters,
    loading,
    error,
    setPage,
    setFilter,
  };
}
