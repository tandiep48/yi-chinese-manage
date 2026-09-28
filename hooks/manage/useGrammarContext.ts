"use client";

// hooks/manage/useGrammarContext.ts
// All state and CRUD logic for the Grammar Context management page.

import { useState, useCallback, useEffect } from "react";
import type { GrammarContext, GrammarContextFormData } from "@/lib/types/grammar";
import {
  listGrammarContexts,
  createGrammarContext,
  updateGrammarContext,
  deleteGrammarContext,
} from "@/lib/api/manage/grammar_context";

interface UseGrammarContextReturn {
  items: GrammarContext[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
  grammarIdFilter: string;
  loading: boolean;
  error: string | null;
  setPage: (p: number) => void;
  setPageSize: (s: number) => void;
  setGrammarIdFilter: (grammarId: string) => void;
  refresh: () => Promise<void>;
  createItem: (data: GrammarContextFormData) => Promise<void>;
  updateItem: (id: number, data: Partial<GrammarContextFormData>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
}

export function useGrammarContext(): UseGrammarContextReturn {
  const [items, setItems] = useState<GrammarContext[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPageState] = useState(1);
  const [pageSize, setPageSizeState] = useState(20);
  const [grammarIdFilter, setGrammarIdFilterState] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(
    async (p = page, ps = pageSize, grammarId = grammarIdFilter) => {
      setLoading(true);
      setError(null);
      try {
        const res = await listGrammarContexts(p, ps, grammarId || undefined);
        setItems(res.items);
        setTotal(res.total);
        setTotalPages(res.total_pages);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load grammar contexts");
      } finally {
        setLoading(false);
      }
    },
    [page, pageSize, grammarIdFilter]
  );

  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, grammarIdFilter]);

  const setPage = useCallback((p: number) => setPageState(p), []);

  const setPageSize = useCallback((s: number) => {
    setPageSizeState(s);
    setPageState(1);
  }, []);

  const setGrammarIdFilter = useCallback((grammarId: string) => {
    setGrammarIdFilterState(grammarId);
    setPageState(1);
  }, []);

  const refresh = useCallback(
    () => fetch(page, pageSize, grammarIdFilter),
    [fetch, page, pageSize, grammarIdFilter]
  );

  const createItem = useCallback(
    async (data: GrammarContextFormData) => {
      await createGrammarContext(data);
      await fetch(1, pageSize, grammarIdFilter);
      setPageState(1);
    },
    [fetch, pageSize, grammarIdFilter]
  );

  const updateItem = useCallback(
    async (id: number, data: Partial<GrammarContextFormData>) => {
      await updateGrammarContext(id, data);
      await fetch(page, pageSize, grammarIdFilter);
    },
    [fetch, page, pageSize, grammarIdFilter]
  );

  const deleteItem = useCallback(
    async (id: number) => {
      await deleteGrammarContext(id);
      await fetch(page, pageSize, grammarIdFilter);
    },
    [fetch, page, pageSize, grammarIdFilter]
  );

  return {
    items,
    total,
    totalPages,
    page,
    pageSize,
    grammarIdFilter,
    loading,
    error,
    setPage,
    setPageSize,
    setGrammarIdFilter,
    refresh,
    createItem,
    updateItem,
    deleteItem,
  };
}
