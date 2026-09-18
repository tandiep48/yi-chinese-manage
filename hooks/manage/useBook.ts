"use client";

// hooks/useBook.ts
// All state and CRUD logic for the Books management page.

import { useState, useCallback, useEffect } from "react";
import type { Book, BookFormData } from "@/lib/types/book";
import {
  listBooks,
  createBook,
  updateBook,
  deleteBook,
} from "@/lib/api/manage/book";

interface UseBookReturn {
  items: Book[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createItem: (data: BookFormData) => Promise<void>;
  updateItem: (bookCode: string, data: Partial<BookFormData>) => Promise<void>;
  deleteItem: (bookCode: string) => Promise<void>;
}

export function useBook(): UseBookReturn {
  const [items, setItems] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listBooks();
      setItems(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load books");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const refresh = useCallback(() => fetch(), [fetch]);

  const createItem = useCallback(
    async (data: BookFormData) => {
      await createBook(data);
      await fetch();
    },
    [fetch]
  );

  const updateItem = useCallback(
    async (bookCode: string, data: Partial<BookFormData>) => {
      await updateBook(bookCode, data);
      await fetch();
    },
    [fetch]
  );

  const deleteItem = useCallback(
    async (bookCode: string) => {
      await deleteBook(bookCode);
      await fetch();
    },
    [fetch]
  );

  return {
    items,
    loading,
    error,
    refresh,
    createItem,
    updateItem,
    deleteItem,
  };
}
