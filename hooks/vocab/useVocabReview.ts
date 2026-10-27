"use client";

// hooks/vocab/useVocabReview.ts
// State machine for the saved-word review page. The page is watch-only (no
// selection, no trainer hand-off): it just browses words a page at a time across
// two sources the learner toggles between —
//
//   "recent"  the words mastered most recently (GET /api/user/learned-vocab/query)
//   "review"  unlearned ∪ unsure words, most recently practised first
//             (POST /api/vocab/review-recent/query)
//
// Each source is capped at REVIEW_WORD_CAP words and browsed 50 per page (so at
// most two pages). The "recent" endpoint paginates the learner's whole mastered
// set, so the cap is applied here; the "review" endpoint caps server-side.
//
// Both reads are per-session cached per (source, page): re-opening a page the
// learner already visited — including flipping back to a tab — is instant. The
// list only changes when a trainer records new progress, so a finished run drops
// every cached page via invalidateVocabReview().

import { useCallback, useEffect, useRef, useState } from "react";
import { getLearnedVocab, getReviewRecent } from "@/lib/api/learner/vocab";
import { cachedRead, invalidateRead } from "@/lib/api/readCache";
import type { VocabRow, VocabTableResponse } from "@/lib/types/vocab";

export const REVIEW_PAGE_SIZE = 50;
// Each tab shows at most this many words (the backend caps "review" to match).
export const REVIEW_WORD_CAP = 100;

export type ReviewSource = "recent" | "review";
export type ReviewStatus = "loading" | "ready" | "error";

// Prefix (trailing ":") so invalidation clears every cached page of both tabs.
const REVIEW_CACHE_PREFIX = "vocab-review:";

export function invalidateVocabReview(): void {
  invalidateRead(REVIEW_CACHE_PREFIX);
}

function pageKey(source: ReviewSource, page: number): string {
  return `${REVIEW_CACHE_PREFIX}${source}:${page}`;
}

const FETCHERS: Record<
  ReviewSource,
  (page: number, pageSize: number) => Promise<VocabTableResponse>
> = {
  recent: getLearnedVocab,
  review: getReviewRecent,
};

function wordKey(row: VocabRow): string {
  return row.word || row.cn || "";
}

// The API can return rows without a word for malformed vocabulary entries; drop
// them so they never reach the table.
function usableRows(rows: VocabRow[] | undefined): VocabRow[] {
  return (rows ?? []).filter((row) => wordKey(row));
}

export function useVocabReview(initialSource: ReviewSource = "recent") {
  const [source, setSourceState] = useState<ReviewSource>(initialSource);
  const [status, setStatus] = useState<ReviewStatus>("loading");
  const [rows, setRows] = useState<VocabRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [navigating, setNavigating] = useState(false);

  // Only the newest request may write state — React StrictMode double-invokes the
  // mount effect in dev, a tab switch starts a new read, and a slow page can
  // resolve after a newer one.
  const requestSeq = useRef(0);

  // Starts a read and writes state only from its async resolution, so the mount
  // effect below never calls setState synchronously. `initial` only decides
  // whether a failure surfaces as the page's error state.
  const load = useCallback((src: ReviewSource, target: number, initial: boolean) => {
    const seq = ++requestSeq.current;
    cachedRead(pageKey(src, target), () => FETCHERS[src](target, REVIEW_PAGE_SIZE))
      .then((data) => {
        if (seq !== requestSeq.current) return;
        // The "recent" source paginates the whole mastered set; clamp the display
        // to the cap so both tabs show at most REVIEW_WORD_CAP words.
        const cappedTotal = Math.min(data.total ?? 0, REVIEW_WORD_CAP);
        const pages = Math.max(1, Math.ceil(cappedTotal / REVIEW_PAGE_SIZE));
        setRows(usableRows(data.rows));
        setPage(Math.min(data.page ?? target, pages));
        setTotalPages(pages);
        setTotalItems(cappedTotal);
        setStatus("ready");
        setNavigating(false);
      })
      .catch(() => {
        if (seq !== requestSeq.current) return;
        if (initial) setStatus("error");
        setNavigating(false);
      });
  }, []);

  // Mount and every source change load page 1. status is reset to "loading" by
  // setSource (an event), so the effect never calls setState synchronously.
  useEffect(() => {
    load(source, 1, true);
  }, [load, source]);

  // Switching tabs resets to the new source's first page and shows loading until
  // it resolves. Done here (an event handler) rather than in the effect to avoid a
  // synchronous setState-in-effect cascade.
  const setSource = useCallback(
    (next: ReviewSource) => {
      if (next === source) return;
      setSourceState(next);
      setStatus("loading");
      setRows([]);
      setPage(1);
      setTotalPages(1);
      setTotalItems(0);
      setNavigating(false);
    },
    [source]
  );

  const goToPage = useCallback(
    (target: number) => {
      const clamped = Math.min(Math.max(1, target), totalPages);
      if (clamped === page || navigating) return;
      setNavigating(true);
      load(source, clamped, false);
    },
    [load, source, page, totalPages, navigating]
  );

  return {
    source,
    setSource,
    status,
    rows,
    page,
    totalPages,
    totalItems,
    navigating,
    goToPage,
  };
}
