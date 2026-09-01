// lib/api/learnerVocab.ts
// Learner-facing vocab endpoints for the Lesson Summary word popup — the batch
// word lookup and the personal saved-word list. Mirrors Learning/web_app/routes/
// vocab/vocab_routes.py (/api/vocab/lookup-batch, /api/vocab/saved). Raw
// (non-enveloped) JSON, login-required — use legacyApiFetch. Distinct from the
// admin vocab CRUD in lib/api/vocab.ts.

import type { VocabLookupMap } from "@/lib/types/types";
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
