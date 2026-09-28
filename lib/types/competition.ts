// lib/types/competition.ts
// Learn Together: rooms, members, chat, scores and session settings
// carried over the socket.
// Mirrors the JSON shapes served by the Flask app in ../../../Learning.

import type { LessonTask } from "./lesson";

// ── Learn Together (competition) ────────────────────────────────────────────────
// Mirrors entity/competition/service.py. A room is created over REST
// (POST /api/competition/rooms) and everything after that flows over socket.io
// (service/competition_socket.py).

// A "book" room's word pool is the deduped union of every participant's saved
// vocabulary inside the picked book parts, resolved server-side at session start.
export type CompetitionCategory = "vocab" | "lesson" | "book";

export interface CompetitionMember {
  user_id: number;
  username: string;
  role: string; // "host" | "member"
  status: string;
  joined_at: string | null;
}

export interface CompetitionChatMessage {
  id: number;
  user_id: number;
  username: string;
  message: string;
  created_at: string | null;
}

// The session summary embedded in a room state (no tasks / scores).
export interface CompetitionRoomSession {
  id: number;
  status: string; // "running" | "ranked"
  current_section: number;
  section_started_at: string | null;
  section_ends_at: string | null;
  started_at: string | null;
  finished_at: string | null;
}

export interface CompetitionRoom {
  id: number;
  room_code: string;
  host_user_id: number;
  level: number;
  passage_ids: string[];
  word_count: number;
  max_users: number;
  section_timeout_minutes: number;
  status: string; // "waiting" | "running" | ...
  created_at: string | null;
  updated_at: string | null;
  category: CompetitionCategory;
  // "all" or a CSV of the room's selected skill types.
  activity_type: string;
  members: CompetitionMember[];
  chat: CompetitionChatMessage[];
  session: CompetitionRoomSession | null;
}

export interface CompetitionScore {
  user_id: number;
  username: string;
  listening_points: number;
  reading_points: number;
  total_points: number;
  total_response_time_ms: number;
  rank: number;
  finished_at: string | null;
}

// The full session state pushed on session_started / session_finished.
export interface CompetitionSession extends CompetitionRoomSession {
  room_id: number;
  room_code: string;
  category: CompetitionCategory;
  activity_type: string;
  lesson_tasks: LessonTask[];
  scores: CompetitionScore[];
}

// Create/edit payload for a room (POST /api/competition/rooms, host_edit_room).
export interface CompetitionRoomSettings {
  category: CompetitionCategory;
  activity_type: string;
  level: number;
  passage_ids: string[];
  max_users: number;
  section_timeout_minutes: number;
}
