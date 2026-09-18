// lib/api/competition.ts
// Learn Together REST, mirroring Learning/web_app/routes/competition/
// competition_routes.py. Room creation and the two book-mode lookups go over HTTP —
// everything else about a live room flows over the socket (see
// lib/competition/socket.ts). Login-required and non-enveloped, so legacyApiFetch.

import type { CompetitionRoom, CompetitionRoomSettings } from "@/lib/types/competition";
import type { VocabRow } from "@/lib/types/vocab";
import type { SourcePassage } from "@/lib/competition/roomLogic";
import { legacyApiFetch } from "../client";

// POST /api/competition/rooms -> { room }. The server normalizes a full activity_type
// selection back to "all" and answers 404 when the picked parts have no material.
export function createCompetitionRoom(
  settings: CompetitionRoomSettings
): Promise<CompetitionRoom> {
  return legacyApiFetch<{ room: CompetitionRoom }>(`/api/competition/rooms`, {
    method: "POST",
    body: JSON.stringify(settings),
  }).then((r) => r.room);
}

// GET /api/competition/book-passages?book_code=XXX -> { passages: [{ passage_id }] }
// The parts of that book the signed-in user has saved words in. This one REJECTS on a
// failed request rather than soft-failing to []: the caller must be able to tell "the
// lookup broke" from "this book has no saved parts", which are different messages.
export function getBookPassages(bookCode: string): Promise<SourcePassage[]> {
  return legacyApiFetch<{ passages: SourcePassage[] }>(
    `/api/competition/book-passages?book_code=${encodeURIComponent(bookCode)}`
  ).then((r) => (Array.isArray(r.passages) ? r.passages : []));
}

// GET /api/competition/sessions/<id>/book-words -> { words: [...] }. The book room's
// shared pool, frozen server-side from the scored-participant set at session start —
// every player must fetch it rather than resolve words locally, so all lists match.
export function getSessionBookWords(sessionId: number): Promise<VocabRow[]> {
  return legacyApiFetch<{ words: VocabRow[] }>(
    `/api/competition/sessions/${sessionId}/book-words`
  )
    .then((r) => (Array.isArray(r.words) ? r.words.filter((w) => w && w.word) : []))
    .catch(() => []);
}
