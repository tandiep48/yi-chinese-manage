"use client";

// hooks/useUser.ts
// All state and CRUD logic for the Users management page.

import { useState, useCallback, useEffect } from "react";
import type { User, UserFormData } from "@/lib/types/types";
import { listUsers, createUser, updateUser, deleteUser } from "@/lib/api/user";

interface UseUserReturn {
  items: User[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
  search: string;
  loading: boolean;
  error: string | null;
  setPage: (p: number) => void;
  setSearch: (q: string) => void;
  refresh: () => Promise<void>;
  createItem: (data: UserFormData) => Promise<void>;
  updateItem: (id: number, data: Partial<UserFormData>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
}

export function useUser(): UseUserReturn {
  const [items, setItems] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPageState] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearchState] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(
    async (p = page, ps = pageSize, q = search) => {
      setLoading(true);
      setError(null);
      try {
        const res = await listUsers(p, ps, q || undefined);
        setItems(res.items);
        setTotal(res.total);
        setTotalPages(res.total_pages);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load users");
      } finally {
        setLoading(false);
      }
    },
    [page, pageSize, search]
  );

  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, search]);

  const setPage = useCallback((p: number) => setPageState(p), []);

  const setSearch = useCallback((q: string) => {
    setSearchState(q);
    setPageState(1);
  }, []);

  const refresh = useCallback(
    () => fetch(page, pageSize, search),
    [fetch, page, pageSize, search]
  );

  const createItem = useCallback(
    async (data: UserFormData) => {
      await createUser(data);
      await fetch(1, pageSize, search);
      setPageState(1);
    },
    [fetch, pageSize, search]
  );

  const updateItem = useCallback(
    async (id: number, data: Partial<UserFormData>) => {
      await updateUser(id, data);
      await fetch(page, pageSize, search);
    },
    [fetch, page, pageSize, search]
  );

  const deleteItem = useCallback(
    async (id: number) => {
      await deleteUser(id);
      await fetch(page, pageSize, search);
    },
    [fetch, page, pageSize, search]
  );

  return {
    items,
    total,
    totalPages,
    page,
    pageSize,
    search,
    loading,
    error,
    setPage,
    setSearch,
    refresh,
    createItem,
    updateItem,
    deleteItem,
  };
}
