// lib/api/competition.ts
// Learn Together REST, mirroring Learning/web_app/routes/competition/
// competition_routes.py. Only room creation goes over HTTP — once a room exists the
// page lives entirely on the socket (see lib/competition/socket.ts). Login-required
// and non-enveloped, so it uses legacyApiFetch.

import type { CompetitionRoom, CompetitionRoomSettings } from "@/lib/types/types";
import { legacyApiFetch } from "./client";

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
