"use client";

// hooks/usePassage.ts
// All state and CRUD logic for the Passage management page.

import { useState, useCallback, useEffect } from "react";
import type { LessonPassage, PassageFormData } from "@/lib/types";
import {
  listPassages,
  createPassage,
  updatePassage,
  deletePassage,
  getPassage,
} from "@/lib/api";

interface UsePassageReturn {
  items: LessonPassage[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
  hskFilter: string;
  loading: boolean;
  error: string | null;
  expandedPassage: LessonPassage | null;
  expandLoading: boolean;
  setPage: (p: number) => void;
  setPageSize: (s: number) => void;
  setHskFilter: (level: string) => void;
  refresh: () => Promise<void>;
  expandPassage: (passageId: string) => Promise<void>;
  collapsePassage: () => void;
  createItem: (data: PassageFormData) => Promise<void>;
  updateItem: (passageId: string, data: Partial<PassageFormData>) => Promise<void>;
  deleteItem: (passageId: string) => Promise<void>;
}

export function usePassage(): UsePassageReturn {
  const [items, setItems] = useState<LessonPassage[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPageState] = useState(1);
  const [pageSize, setPageSizeState] = useState(20);
  const [hskFilter, setHskFilterState] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPassage, setExpandedPassage] = useState<LessonPassage | null>(null);
  const [expandLoading, setExpandLoading] = useState(false);

  const fetchList = useCallback(
    async (p = page, ps = pageSize, hsk = hskFilter) => {
      setLoading(true);
      setError(null);
      try {
        const res = await listPassages(p, ps, hsk || undefined);
        setItems(res.items);
        setTotal(res.total);
        setTotalPages(res.total_pages);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load passages");
      } finally {
        setLoading(false);
      }
    },
    [page, pageSize, hskFilter]
  );

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, hskFilter]);

  const setPage = useCallback((p: number) => setPageState(p), []);

  const setPageSize = useCallback((s: number) => {
    setPageSizeState(s);
    setPageState(1);
  }, []);

  const setHskFilter = useCallback((level: string) => {
    setHskFilterState(level);
    setPageState(1);
  }, []);

  const refresh = useCallback(
    () => fetchList(page, pageSize, hskFilter),
    [fetchList, page, pageSize, hskFilter]
  );

  const expandPassage = useCallback(async (passageId: string) => {
    // Toggle off if same passage clicked again
    if (expandedPassage?.passage_id === passageId) {
      setExpandedPassage(null);
      return;
    }
    setExpandLoading(true);
    try {
      const full = await getPassage(passageId);
      setExpandedPassage(full);
    } catch {
      setExpandedPassage(null);
    } finally {
      setExpandLoading(false);
    }
  }, [expandedPassage]);

  const collapsePassage = useCallback(() => setExpandedPassage(null), []);

  const createItem = useCallback(
    async (data: PassageFormData) => {
      await createPassage(data);
      await fetchList(1, pageSize, hskFilter);
      setPageState(1);
    },
    [fetchList, pageSize, hskFilter]
  );

  const updateItem = useCallback(
    async (passageId: string, data: Partial<PassageFormData>) => {
      await updatePassage(passageId, data);
      await fetchList(page, pageSize, hskFilter);
      if (expandedPassage?.passage_id === passageId) {
        const updated = await getPassage(passageId);
        setExpandedPassage(updated);
      }
    },
    [fetchList, page, pageSize, hskFilter, expandedPassage]
  );

  const deleteItem = useCallback(
    async (passageId: string) => {
      await deletePassage(passageId);
      if (expandedPassage?.passage_id === passageId) {
        setExpandedPassage(null);
      }
      await fetchList(page, pageSize, hskFilter);
    },
    [fetchList, page, pageSize, hskFilter, expandedPassage]
  );

  return {
    items,
    total,
    totalPages,
    page,
    pageSize,
    hskFilter,
    loading,
    error,
    expandedPassage,
    expandLoading,
    setPage,
    setPageSize,
    setHskFilter,
    refresh,
    expandPassage,
    collapsePassage,
    createItem,
    updateItem,
    deleteItem,
  };
}
