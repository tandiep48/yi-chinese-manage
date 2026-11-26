"use client";

// hooks/manage/useVocab.ts
// All state and CRUD logic for the Vocabulary management page.

import { useState, useCallback, useEffect, useRef } from "react";
import type { Vocab, VocabFormData } from "@/lib/types/vocab";
import {
  listVocab,
  createVocab,
  updateVocab,
  deleteVocab,
} from "@/lib/api/manage/vocab";

interface UseVocabReturn {
  items: Vocab[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
  hskFilter: string;
  search: string;
  loading: boolean;
  error: string | null;
  setPage: (p: number) => void;
  setPageSize: (s: number) => void;
  setHskFilter: (level: string) => void;
  setSearch: (term: string) => void;
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
  const [search, setSearchState] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only the newest request may write state: a slow broad search must not land
  // on top of the narrower one typed after it.
  const latestRequest = useRef(0);

  const fetch = useCallback(
    async (p = page, ps = pageSize, hsk = hskFilter) => {
      const request = ++latestRequest.current;
      setLoading(true);
      setError(null);
      try {
        const res = await listVocab(p, ps, hsk || undefined, search || undefined);
        if (request !== latestRequest.current) return;
        setItems(res.items);
        setTotal(res.total);
        setTotalPages(res.total_pages);
      } catch (e) {
        if (request !== latestRequest.current) return;
        setError(e instanceof Error ? e.message : "Failed to load vocabulary");
      } finally {
        if (request === latestRequest.current) setLoading(false);
      }
    },
    [page, pageSize, hskFilter, search]
  );

  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, hskFilter, search]);

  const setPage = useCallback((p: number) => setPageState(p), []);

  const setPageSize = useCallback((s: number) => {
    setPageSizeState(s);
    setPageState(1);
  }, []);

  const setHskFilter = useCallback((level: string) => {
    setHskFilterState(level);
    setPageState(1);
  }, []);

  const setSearch = useCallback((term: string) => {
    setSearchState(term);
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
    search,
    loading,
    error,
    setPage,
    setPageSize,
    setHskFilter,
    setSearch,
    refresh,
    createItem,
    updateItem,
    deleteItem,
  };
}
