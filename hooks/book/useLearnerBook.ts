"use client";

// hooks/useLearnerBook.ts
// One book's lessons + parts for the Books tab. Ported from openBook() in
// Learning/web_app/static/learning/learning.js.

import { useEffect, useState } from "react";
import { getLearnerBook } from "@/lib/api/learner/learnerBooks";
import type { LearnerBookDetail } from "@/lib/types/book";

interface UseLearnerBookReturn {
  loading: boolean;
  error: string | null;
  book: LearnerBookDetail | null;
}

export function useLearnerBook(bookCode: string): UseLearnerBookReturn {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [book, setBook] = useState<LearnerBookDetail | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getLearnerBook(bookCode)
      .then((data) => !cancelled && setBook(data))
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load book.");
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [bookCode]);

  return { loading, error, book };
}
