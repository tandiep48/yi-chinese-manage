// lib/api/learnerVocab.ts
// Learner-facing vocab endpoints for the Lesson Summary word popup — the batch
// word lookup and the personal saved-word list. Mirrors Learning/web_app/routes/
// vocab/vocab_routes.py (/api/vocab/lookup-batch, /api/vocab/saved). Raw
// (non-enveloped) JSON, login-required — use legacyApiFetch. Distinct from the
// admin vocab CRUD in lib/api/vocab.ts.

import type {
  VocabLookupMap,
  VocabMode,
  VocabTableResponse,
} from "@/lib/types/types";
import { legacyApiFetch } from "./client";

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

// ── Vocab selection table (the training-selection page) ─────────────────────

export interface VocabTableParams {
  mode: VocabMode;
  hskLevel?: string;
  // Standard mode: the selected passage_ids (H<level>_<lesson>_<part>).
  passages?: string[];
  page: number;
  pageSize: number;
}

// Loads a page of the vocab table for the free / standard / unsure / unlearn
// modes. `recent` is served by getLearnedVocab instead — it lives on a different
// route and the /table endpoint rejects it. Mirrors loadVocabTable() in
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
  return legacyApiFetch<VocabTableResponse>(
    `/api/vocab/table?${query.toString()}`
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
