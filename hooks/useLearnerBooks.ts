"use client";

// hooks/useLearnerBooks.ts
// Book cover grid for the Books tab. Ported from loadBooks() in
// Learning/web_app/static/learning/learning.js.

import { useEffect, useState } from "react";
import { getLearnerBooks } from "@/lib/api/learnerBooks";
import type { LearnerBookSummary } from "@/lib/types/book";

interface UseLearnerBooksReturn {
  loading: boolean;
  error: string | null;
  books: LearnerBookSummary[];
}

export function useLearnerBooks(): UseLearnerBooksReturn {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [books, setBooks] = useState<LearnerBookSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getLearnerBooks()
      .then((data) => !cancelled && setBooks(data))
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load books.");
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  return { loading, error, books };
}
