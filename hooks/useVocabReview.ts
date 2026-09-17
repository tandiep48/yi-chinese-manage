"use client";

// hooks/useVocabReview.ts
// State machine for the saved-word review page. Ports the module-level state of
// Learning/web_app/static/vocab/vocab_review.js: one combined, priority-ordered
// list from /api/vocab/review that grows page by page via "Load more", a
// selection set that survives those appends, and a select-all checkbox that
// spans only the rows loaded so far.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getVocabReview } from "@/lib/api/learnerVocab";
import type { VocabRow } from "@/lib/types/vocab";

export const REVIEW_PAGE_SIZE = 100;

export type ReviewStatus = "loading" | "ready" | "error";

function wordKey(row: VocabRow): string {
  return row.word || row.cn || "";
}

// The API can return rows without a word for malformed vocabulary entries; the
// legacy page skipped them when appending, so they never reach the trainer.
function usableRows(rows: VocabRow[] | undefined): VocabRow[] {
  return (rows ?? []).filter((row) => wordKey(row));
}

export function useVocabReview() {
  const [status, setStatus] = useState<ReviewStatus>("loading");
  const [rows, setRows] = useState<VocabRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState<Map<string, VocabRow>>(
    () => new Map()
  );

  // Only the newest first-page load may write state — React StrictMode
  // double-invokes the mount effect in dev, and page 1 replaces the list.
  const requestSeq = useRef(0);

  useEffect(() => {
    const seq = ++requestSeq.current;
    getVocabReview(1, REVIEW_PAGE_SIZE)
      .then((data) => {
        if (seq !== requestSeq.current) return;
        setRows(usableRows(data.rows));
        setPage(data.page ?? 1);
        setTotalPages(data.total_pages ?? 1);
        setStatus("ready");
      })
      .catch(() => {
        if (seq !== requestSeq.current) return;
        setStatus("error");
      });
  }, []);

  const canLoadMore = status === "ready" && page < totalPages;

  const loadMore = useCallback(async () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    try {
      const data = await getVocabReview(page + 1, REVIEW_PAGE_SIZE);
      setRows((prev) => [...prev, ...usableRows(data.rows)]);
      setPage(data.page ?? page + 1);
      setTotalPages(data.total_pages ?? totalPages);
    } catch {
      // Leave the button in place for a retry, like the legacy page.
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, page, totalPages]);

  // ── Selection ──────────────────────────────────────────────────────────────
  const toggleWord = useCallback((row: VocabRow, checked: boolean) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (checked) next.set(wordKey(row), row);
      else next.delete(wordKey(row));
      return next;
    });
  }, []);

  // Select-all covers the loaded rows only; words from earlier pages stay
  // selected when a later page is appended and then deselected.
  const toggleAll = useCallback(
    (checked: boolean) => {
      setSelected((prev) => {
        const next = new Map(prev);
        rows.forEach((row) => {
          if (checked) next.set(wordKey(row), row);
          else next.delete(wordKey(row));
        });
        return next;
      });
    },
    [rows]
  );

  const selectedLoadedCount = useMemo(
    () => rows.filter((row) => selected.has(wordKey(row))).length,
    [rows, selected]
  );

  const isSelected = useCallback(
    (row: VocabRow) => selected.has(wordKey(row)),
    [selected]
  );

  const selectedWords = useMemo(() => Array.from(selected.keys()), [selected]);

  return {
    status,
    rows,
    loadingMore,
    canLoadMore,
    loadMore,
    // selection
    isSelected,
    toggleWord,
    toggleAll,
    allSelected: rows.length > 0 && selectedLoadedCount === rows.length,
    someSelected:
      selectedLoadedCount > 0 && selectedLoadedCount < rows.length,
    selectedCount: selected.size,
    selectedWords,
  };
}
