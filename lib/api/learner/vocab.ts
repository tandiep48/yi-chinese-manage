// lib/api/learner/vocab.ts
// Learner-facing vocab endpoints for the Lesson Summary word popup — the batch
// word lookup and the personal saved-word list. Mirrors Learning/web_app/routes/
// vocab/vocab_routes.py (/api/vocab/lookup-batch, /api/vocab/saved). Raw
// (non-enveloped) JSON, login-required — use legacyApiFetch. Distinct from the
// admin vocab CRUD in lib/api/vocab.ts.

import type { SavedBook, VocabLookupMap, VocabMode, VocabTableResponse } from "@/lib/types/vocab";
import { legacyApiFetch } from "../client";

// Books the current user has saved words in (populates the "Book" mode picker).
// Login-required; soft-fails to [] when signed out, like the legacy loadSavedBooks().
export function getSavedBooks(): Promise<SavedBook[]> {
  return legacyApiFetch<{ books: SavedBook[] }>(`/api/vocab/saved-books`)
    .then((r) => r.books ?? [])
    .catch(() => []);
}

// Batch-resolve words to { pinyin, meaning_vn, meaning_en, audio_key }. Words not
// in the vocabulary are omitted from the map. The backend caps the query at 80
// words, so callers should chunk larger sets.
export function lookupWordsBatch(words: string[]): Promise<VocabLookupMap> {
  if (words.length === 0) return Promise.resolve({});
  return legacyApiFetch<VocabLookupMap>(
    `/api/vocab/lookup-batch?words=${encodeURIComponent(words.join(","))}`
  );
}

export function getSavedWords(passageId: string): Promise<string[]> {
  return legacyApiFetch<{ passage_id: string; words: string[] }>(
    `/api/vocab/saved?passage_id=${encodeURIComponent(passageId)}`
  ).then((r) => r.words ?? []);
}

export function addSavedWord(passageId: string, cn: string): Promise<void> {
  return legacyApiFetch<unknown>(`/api/vocab/saved`, {
    method: "POST",
    body: JSON.stringify({ passage_id: passageId, cn }),
  }).then(() => undefined);
}

export function removeSavedWord(passageId: string, cn: string): Promise<void> {
  return legacyApiFetch<unknown>(`/api/vocab/saved`, {
    method: "DELETE",
    body: JSON.stringify({ passage_id: passageId, cn }),
  }).then(() => undefined);
}

// GET /api/vocab/has_history — whether the user has any vocab-practice history.
// The Recommend page uses it to show the "new user" welcome instead of the plain
// empty state when there are zero recommendations. Soft-fails to true so a broken
// call falls back to the regular empty state (matches the legacy try/catch).
export function getVocabHasHistory(): Promise<boolean> {
  return legacyApiFetch<{ has_history: boolean }>(`/api/vocab/has_history`)
    .then((r) => Boolean(r.has_history))
    .catch(() => true);
}

// ── Vocab selection table (the training-selection page) ─────────────────────

export interface VocabTableParams {
  mode: VocabMode;
  hskLevel?: string;
  // Standard mode: the selected passage_ids (H<level>_<lesson>_<part>).
  passages?: string[];
  // Book mode: the selected book code.
  bookCode?: string;
  page: number;
  pageSize: number;
}

// Loads a page of the vocab table for the free / standard / book / unsure /
// unlearn modes. `recent` is served by getLearnedVocab instead — it lives on a
// different route and the /table endpoint rejects it. Mirrors loadVocabTable() in
// Learning/web_app/static/vocab/vocab_select.js.
export function getVocabTable(
  params: VocabTableParams
): Promise<VocabTableResponse> {
  const query = new URLSearchParams({
    mode: params.mode,
    hsk_level: params.hskLevel ?? "",
    page: String(params.page),
    page_size: String(params.pageSize),
  });
  if (params.mode === "standard") {
    query.set("passages", (params.passages ?? []).join(","));
  }
  if (params.mode === "book") {
    query.set("book_code", params.bookCode ?? "");
  }
  return legacyApiFetch<VocabTableResponse>(
    `/api/vocab/table?${query.toString()}`
  );
}

// GET /api/vocab/review — the combined, priority-ordered review list behind the
// dashboard's Review card (critical > unsure > incomplete). Same normalized rows
// and pagination envelope as /api/vocab/table. Mirrors get_review_list() in
// Learning/web_app/routes/vocab/vocab_routes.py.
export function getVocabReview(
  page: number,
  pageSize: number
): Promise<VocabTableResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  return legacyApiFetch<VocabTableResponse>(
    `/api/vocab/review?${params.toString()}`
  );
}

// GET /api/vocab/review/count — how many words are waiting in the review list.
// Use this for a count, NEVER getVocabReview with a small page_size: /review
// paginates in Python after loading the whole vocabulary table (uncached), so a
// small page costs exactly as much as a large one. This route skips that load.
export function getVocabReviewCount(): Promise<number> {
  return legacyApiFetch<{ total: number }>("/api/vocab/review/count").then(
    (r) => r.total
  );
}

// The `recent` mode: the user's mastered words, most-recent first.
export function getLearnedVocab(
  page: number,
  pageSize: number
): Promise<VocabTableResponse> {
  return legacyApiFetch<VocabTableResponse>(
    `/api/user/learned-vocab?page=${encodeURIComponent(
      page
    )}&page_size=${encodeURIComponent(pageSize)}`
  );
}

// Debounced vocabulary search across word / pinyin / meanings.
export function searchVocab(
  query: string,
  page: number,
  pageSize: number
): Promise<VocabTableResponse> {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    page_size: String(pageSize),
  });
  return legacyApiFetch<VocabTableResponse>(
    `/api/vocab/search?${params.toString()}`
  );
}
