// lib/api/vocabTrainer.ts
// Batch vocab trainer endpoints, mirroring Learning/web_app/routes/vocab/
// vocab_routes.py (/api/vocab/words, /api/vocab/submit-batch). Both are
// login-required and return raw (non-enveloped) JSON, so they use legacyApiFetch;
// they soft-fail to an empty result when signed out, matching the legacy page.

import type { VocabRow } from "@/lib/types/types";
import { legacyApiFetch } from "./client";

// A selection to resolve into normalized word rows. Any combination of explicit
// words and/or passage ids; the server unions and de-dupes them.
export interface TrainerWordsPayload {
  words?: string[];
  passage_id?: string;
  passage_ids?: string[];
}

// POST /api/vocab/words -> { words: normalized rows }. Returns [] on any failure
// (signed out, backend down) so the page can show its empty state.
export function resolveTrainerWords(payload: TrainerWordsPayload): Promise<VocabRow[]> {
  return legacyApiFetch<{ words: VocabRow[] }>(`/api/vocab/words`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
    .then((r) => (Array.isArray(r.words) ? r.words.filter((w) => w && w.word) : []))
    .catch(() => []);
}

// One buffered answer, matching the record shape submit-batch expects.
export interface VocabTrainerRecord {
  type: string; // "typing" | "listen" | "meaning"
  word: string;
  round_num: number;
  user_answer: string;
  is_correct: boolean;
  response_time_ms: number;
  game_info: Record<string, unknown>;
}

// POST /api/vocab/submit-batch — fire-and-forget batch of a group's answers.
// Never throws; progress logging is best-effort like the legacy trainer.
export function submitVocabBatch(
  sessionId: number,
  records: VocabTrainerRecord[]
): Promise<void> {
  if (!records.length) return Promise.resolve();
  return legacyApiFetch<unknown>(`/api/vocab/submit-batch`, {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId, records }),
  })
    .then(() => undefined)
    .catch(() => undefined);
}
