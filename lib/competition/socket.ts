// lib/competition/socket.ts
// Typed socket.io client for Learn Together, mirroring the handlers in
// Learning/web_app/service/competition_socket.py. The legacy page called a
// same-origin `io()`; from Next the connection is cross-origin, so it carries
// `withCredentials` to send the Flask-Login session cookie the handlers
// authenticate with (they reject with `competition_error: "Login required"`).
//
// The socket is created disconnected — the owning hook calls `connect()` in an
// effect and `disconnect()` in its cleanup, so React StrictMode's double-invoked
// mount in dev never leaves a stray connection behind.

import { io, type Socket } from "socket.io-client";
import { API_CONSTANTS } from "@/lib/api/constants";
import type {
  CompetitionChatMessage,
  CompetitionRoom,
  CompetitionRoomSettings,
  CompetitionScore,
  CompetitionSession,
} from "@/lib/types/types";

// Server -> client. `joined_room` / `room_settings_saved` are sent to the caller
// only; the rest are broadcast to everyone in the room.
export interface CompetitionServerEvents {
  competition_error: (payload: { error?: string }) => void;
  joined_room: (payload: { room: CompetitionRoom }) => void;
  room_state: (payload: { room: CompetitionRoom }) => void;
  room_settings_saved: (payload: { room: CompetitionRoom }) => void;
  chat_message: (message: CompetitionChatMessage) => void;
  session_started: (payload: { session: CompetitionSession }) => void;
  score_update: (payload: { scores: CompetitionScore[] }) => void;
  participant_waiting: (payload: { user_id: number; username: string }) => void;
  session_finished: (payload: { session: CompetitionSession; scores?: CompetitionScore[] }) => void;
  ranking_update: (payload: { scores: CompetitionScore[] }) => void;
  return_to_lobby: () => void;
}

export interface VocabAnswerPayload {
  room_code: string;
  session_id: number;
  word: string;
  activity_type: string;
  is_correct: boolean;
  response_time_ms: number;
  wrong_attempts: number;
}

export interface LessonAnswerPayload {
  room_code: string;
  session_id: number;
  item_key: string;
  task_type: string;
  is_correct: boolean;
  response_time_ms: number;
}

// Client -> server.
export interface CompetitionClientEvents {
  join_room: (payload: { room_code: string }) => void;
  leave_room: (payload: { room_code: string }) => void;
  chat_message: (payload: { room_code: string; message: string }) => void;
  host_edit_room: (payload: { room_code: string } & CompetitionRoomSettings) => void;
  host_start_session: (payload: { room_code: string }) => void;
  vocab_answer: (payload: VocabAnswerPayload) => void;
  lesson_answer: (payload: LessonAnswerPayload) => void;
  participant_finished: (payload: { room_code: string; session_id: number }) => void;
  return_to_lobby: (payload: { room_code: string }) => void;
}

export type CompetitionSocket = Socket<CompetitionServerEvents, CompetitionClientEvents>;

export function createCompetitionSocket(): CompetitionSocket {
  return io(API_CONSTANTS.BASE_URL, {
    // Flask-SocketIO runs in threading mode by default, where the websocket
    // upgrade needs simple-websocket installed. Leaving the default transport
    // list keeps the connection working over long-polling when it is not.
    withCredentials: true,
    autoConnect: false,
  });
}
