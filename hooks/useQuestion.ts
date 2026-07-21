"use client";

// hooks/useQuestion.ts
// All state and CRUD logic for the Question Bank management page.

import { useState, useCallback, useEffect } from "react";
import type { Question, QuestionFormData } from "@/lib/types";
import {
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  type QuestionFilters,
} from "@/lib/api";

interface UseQuestionReturn {
  items: Question[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
  filters: QuestionFilters;
  loading: boolean;
  error: string | null;
  setPage: (p: number) => void;
  setFilters: (patch: QuestionFilters) => void;
  refresh: () => Promise<void>;
  createItem: (data: QuestionFormData) => Promise<void>;
  updateItem: (id: number, data: Partial<QuestionFormData>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
}

export function useQuestion(): UseQuestionReturn {
  const [items, setItems] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPageState] = useState(1);
  const [pageSize] = useState(20);
  const [filters, setFiltersState] = useState<QuestionFilters>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(
    async (p = page, f = filters) => {
      setLoading(true);
      setError(null);
      try {
        const res = await listQuestions(p, pageSize, f);
        setItems(res.items);
        setTotal(res.total);
        setTotalPages(res.total_pages);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load questions");
      } finally {
        setLoading(false);
      }
    },
    [page, pageSize, filters]
  );

  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  const setPage = useCallback((p: number) => setPageState(p), []);

  const setFilters = useCallback((patch: QuestionFilters) => {
    setFiltersState((prev) => ({ ...prev, ...patch }));
    setPageState(1);
  }, []);

  const refresh = useCallback(() => fetch(page, filters), [fetch, page, filters]);

  const createItem = useCallback(
    async (data: QuestionFormData) => {
      await createQuestion(data);
      await fetch(1, filters);
      setPageState(1);
    },
    [fetch, filters]
  );

  const updateItem = useCallback(
    async (id: number, data: Partial<QuestionFormData>) => {
      await updateQuestion(id, data);
      await fetch(page, filters);
    },
    [fetch, page, filters]
  );

  const deleteItem = useCallback(
    async (id: number) => {
      await deleteQuestion(id);
      await fetch(page, filters);
    },
    [fetch, page, filters]
  );

  return {
    items,
    total,
    totalPages,
    page,
    pageSize,
    filters,
    loading,
    error,
    setPage,
    setFilters,
    refresh,
    createItem,
    updateItem,
    deleteItem,
  };
}
