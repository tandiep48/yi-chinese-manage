"use client";

// hooks/vocab/useVocabReview.ts
// State machine for the saved-word review page. One combined, priority-ordered
// list from /api/vocab/review, navigated a page at a time (prev / numbered /
// next), with a selection set that survives page changes and a select-all that
// spans the current page only.
//
// /api/vocab/review paginates in Python *after* loading the whole vocabulary
// table (uncached), so every page costs the same ~1.6s (§4). Each page is
// therefore cached for the session: re-opening a page the learner already
// visited — including coming back to page 1 after a tab switch — is instant.
// Training words changes the list, so a finished run drops every cached page.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getVocabReview } from "@/lib/api/learner/vocab";
import { cachedRead, invalidateRead } from "@/lib/api/readCache";
import type { VocabRow } from "@/lib/types/vocab";

export const REVIEW_PAGE_SIZE = 50;

// Prefix (trailing ":") so invalidation clears every cached page at once.
const REVIEW_CACHE_PREFIX = "vocab-review:page:";

export function invalidateVocabReview(): void {
  invalidateRead(REVIEW_CACHE_PREFIX);
}

function pageKey(page: number): string {
  return `${REVIEW_CACHE_PREFIX}${page}`;
}

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
  const [totalItems, setTotalItems] = useState(0);
  const [navigating, setNavigating] = useState(false);
  const [selected, setSelected] = useState<Map<string, VocabRow>>(
    () => new Map()
  );

  // Only the newest request may write state — React StrictMode double-invokes
  // the mount effect in dev, and a slow page can resolve after a newer one.
  const requestSeq = useRef(0);

  // Starts a read and writes state only from its async resolution, so the mount
  // effect below never calls setState synchronously. `initial` only decides
  // whether a failure surfaces as the page's error state (mount) or leaves the
  // learner on the current page (a page change).
  const load = useCallback((target: number, initial: boolean) => {
    const seq = ++requestSeq.current;
    cachedRead(pageKey(target), () => getVocabReview(target, REVIEW_PAGE_SIZE))
      .then((data) => {
        if (seq !== requestSeq.current) return;
        setRows(usableRows(data.rows));
        setPage(data.page ?? target);
        setTotalPages(data.total_pages ?? 1);
        setTotalItems(data.total ?? 0);
        setStatus("ready");
        setNavigating(false);
      })
      .catch(() => {
        if (seq !== requestSeq.current) return;
        if (initial) setStatus("error");
        setNavigating(false);
      });
  }, []);

  // status already defaults to "loading", so the mount read sets no state here.
  useEffect(() => {
    load(1, true);
  }, [load]);

  const goToPage = useCallback(
    (target: number) => {
      const clamped = Math.min(Math.max(1, target), totalPages);
      if (clamped === page || navigating) return;
      setNavigating(true);
      load(clamped, false);
    },
    [load, page, totalPages, navigating]
  );

  // ── Selection ──────────────────────────────────────────────────────────────
  // The Map is keyed by word and is never reset on a page change, so picks made
  // on one page stay picked while the learner browses others.
  const toggleWord = useCallback((row: VocabRow, checked: boolean) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (checked) next.set(wordKey(row), row);
      else next.delete(wordKey(row));
      return next;
    });
  }, []);

  // Select-all covers the current page's rows only — "select the visible rows".
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

  const selectedOnPageCount = useMemo(
    () => rows.filter((row) => selected.has(wordKey(row))).length,
    [rows, selected]
  );

  const isSelected = useCallback(
    (row: VocabRow) => selected.has(wordKey(row)),
    [selected]
  );

  const selectedWords = useMemo(() => Array.from(selected.keys()), [selected]);

  // The full rows behind the selection. /api/vocab/review and /api/vocab/words both
  // return normalize_vocab_row() output (vocab_routes.py:508 and :528), so these are
  // already trainer rows: an embedded run can start from them without asking the
  // server to resolve the same words a second time.
  const selectedRows = useMemo(() => Array.from(selected.values()), [selected]);

  return {
    status,
    rows,
    page,
    totalPages,
    totalItems,
    navigating,
    goToPage,
    // selection
    isSelected,
    toggleWord,
    toggleAll,
    allSelected: rows.length > 0 && selectedOnPageCount === rows.length,
    someSelected:
      selectedOnPageCount > 0 && selectedOnPageCount < rows.length,
    selectedCount: selected.size,
    selectedWords,
    selectedRows,
  };
}
