"use client";

// hooks/useGrammarRule.ts
// All state and CRUD logic for the Grammar Rule management page.

import { useState, useCallback, useEffect } from "react";
import type { GrammarRule, GrammarRuleFormData } from "@/lib/types/grammar";
import {
  listGrammarRules,
  createGrammarRule,
  updateGrammarRule,
  deleteGrammarRule,
} from "@/lib/api/grammar_rule";

interface UseGrammarRuleReturn {
  items: GrammarRule[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
  grammarIdFilter: string;
  typeFilter: number | undefined;
  loading: boolean;
  error: string | null;
  setPage: (p: number) => void;
  setPageSize: (s: number) => void;
  setGrammarIdFilter: (grammarId: string) => void;
  setTypeFilter: (type: number | undefined) => void;
  refresh: () => Promise<void>;
  createItem: (data: GrammarRuleFormData) => Promise<void>;
  updateItem: (id: number, data: Partial<GrammarRuleFormData>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
}

export function useGrammarRule(): UseGrammarRuleReturn {
  const [items, setItems] = useState<GrammarRule[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPageState] = useState(1);
  const [pageSize, setPageSizeState] = useState(20);
  const [grammarIdFilter, setGrammarIdFilterState] = useState("");
  const [typeFilter, setTypeFilterState] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(
    async (p = page, ps = pageSize, grammarId = grammarIdFilter, type = typeFilter) => {
      setLoading(true);
      setError(null);
      try {
        const res = await listGrammarRules(p, ps, grammarId || undefined, type);
        setItems(res.items);
        setTotal(res.total);
        setTotalPages(res.total_pages);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load grammar rules");
      } finally {
        setLoading(false);
      }
    },
    [page, pageSize, grammarIdFilter, typeFilter]
  );

  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, grammarIdFilter, typeFilter]);

  const setPage = useCallback((p: number) => setPageState(p), []);

  const setPageSize = useCallback((s: number) => {
    setPageSizeState(s);
    setPageState(1);
  }, []);

  const setGrammarIdFilter = useCallback((grammarId: string) => {
    setGrammarIdFilterState(grammarId);
    setPageState(1);
  }, []);

  const setTypeFilter = useCallback((type: number | undefined) => {
    setTypeFilterState(type);
    setPageState(1);
  }, []);

  const refresh = useCallback(
    () => fetch(page, pageSize, grammarIdFilter, typeFilter),
    [fetch, page, pageSize, grammarIdFilter, typeFilter]
  );

  const createItem = useCallback(
    async (data: GrammarRuleFormData) => {
      await createGrammarRule(data);
      await fetch(1, pageSize, grammarIdFilter, typeFilter);
      setPageState(1);
    },
    [fetch, pageSize, grammarIdFilter, typeFilter]
  );

  const updateItem = useCallback(
    async (id: number, data: Partial<GrammarRuleFormData>) => {
      await updateGrammarRule(id, data);
      await fetch(page, pageSize, grammarIdFilter, typeFilter);
    },
    [fetch, page, pageSize, grammarIdFilter, typeFilter]
  );

  const deleteItem = useCallback(
    async (id: number) => {
      await deleteGrammarRule(id);
      await fetch(page, pageSize, grammarIdFilter, typeFilter);
    },
    [fetch, page, pageSize, grammarIdFilter, typeFilter]
  );

  return {
    items,
    total,
    totalPages,
    page,
    pageSize,
    grammarIdFilter,
    typeFilter,
    loading,
    error,
    setPage,
    setPageSize,
    setGrammarIdFilter,
    setTypeFilter,
    refresh,
    createItem,
    updateItem,
    deleteItem,
  };
}
