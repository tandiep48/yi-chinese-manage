"use client";

// hooks/useVocab.ts
// All state and CRUD logic for the Vocabulary management page.

import { useState, useCallback, useEffect } from "react";
import type { Vocab, VocabFormData } from "@/lib/types";
import {
  listVocab,
  createVocab,
  updateVocab,
  deleteVocab,
} from "@/lib/api";

interface UseVocabReturn {
  items: Vocab[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
  hskFilter: string;
  loading: boolean;
  error: string | null;
  setPage: (p: number) => void;
  setPageSize: (s: number) => void;
  setHskFilter: (level: string) => void;
  refresh: () => Promise<void>;
  createItem: (data: VocabFormData) => Promise<void>;
  updateItem: (id: number, data: Partial<VocabFormData>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
}

export function useVocab(): UseVocabReturn {
  const [items, setItems] = useState<Vocab[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPageState] = useState(1);
  const [pageSize, setPageSizeState] = useState(20);
  const [hskFilter, setHskFilterState] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(
    async (p = page, ps = pageSize, hsk = hskFilter) => {
      setLoading(true);
      setError(null);
      try {
        const res = await listVocab(p, ps, hsk || undefined);
        setItems(res.items);
        setTotal(res.total);
        setTotalPages(res.total_pages);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load vocabulary");
      } finally {
        setLoading(false);
      }
    },
    [page, pageSize, hskFilter]
  );

  useEffect(() => {
    fetch();
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
    () => fetch(page, pageSize, hskFilter),
    [fetch, page, pageSize, hskFilter]
  );

  const createItem = useCallback(
    async (data: VocabFormData) => {
      await createVocab(data);
      await fetch(1, pageSize, hskFilter);
      setPageState(1);
    },
    [fetch, pageSize, hskFilter]
  );

  const updateItem = useCallback(
    async (id: number, data: Partial<VocabFormData>) => {
      await updateVocab(id, data);
      await fetch(page, pageSize, hskFilter);
    },
    [fetch, page, pageSize, hskFilter]
  );

  const deleteItem = useCallback(
    async (id: number) => {
      await deleteVocab(id);
      await fetch(page, pageSize, hskFilter);
    },
    [fetch, page, pageSize, hskFilter]
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
    setPage,
    setPageSize,
    setHskFilter,
    refresh,
    createItem,
    updateItem,
    deleteItem,
  };
}
