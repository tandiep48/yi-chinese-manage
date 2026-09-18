"use client";

// hooks/competition/useCompetitionRoom.ts
// The Learn Together room state machine: the socket connection plus the five screens
// of Learning/web_app/static/competition/competition.js (setup / lobby / section /
// waiting / ranking) and every room action the page can take. The legacy module
// globals (currentRoom, currentSession, waitingUsers, editing) become state here, and
// `showScreen()` becomes the `screen` field.

import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/components/i18n/I18nProvider";
import { createCompetitionRoom } from "@/lib/api/learner/competition";
import { createCompetitionSocket, type CompetitionSocket } from "@/lib/competition/socket";
import type { CompetitionChatMessage, CompetitionRoom, CompetitionRoomSettings, CompetitionScore, CompetitionSession } from "@/lib/types/competition";

export type CompetitionScreen = "setup" | "lobby" | "section" | "waiting" | "ranking";

export function useCompetitionRoom() {
  const { t } = useT();

  const [screen, setScreen] = useState<CompetitionScreen>("setup");
  const [room, setRoom] = useState<CompetitionRoom | null>(null);
  const [session, setSession] = useState<CompetitionSession | null>(null);
  const [scores, setScores] = useState<CompetitionScore[]>([]);
  const [chat, setChat] = useState<CompetitionChatMessage[]>([]);
  const [waitingUsers, setWaitingUsers] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  const socketRef = useRef<CompetitionSocket | null>(null);
  // The room code the emitters need, mirrored so the callbacks never close over a
  // stale room object.
  const roomCodeRef = useRef<string | null>(null);
  // Translations reach the handlers without re-binding them on a language change.
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    const socket = createCompetitionSocket();
    socketRef.current = socket;

    socket.on("connect", () => setError(""));
    socket.on("connect_error", () => setError(tRef.current("competition.server_connect_failed")));
    // The legacy page alert()ed these; they go to the page's error line instead.
    socket.on("competition_error", (payload) =>
      setError(payload?.error || tRef.current("competition.error_fallback"))
    );

    socket.on("joined_room", ({ room: joined }) => {
      setRoom(joined);
      roomCodeRef.current = joined.room_code;
      setChat(joined.chat || []);
      setScreen("lobby");
    });

    socket.on("room_state", ({ room: state }) => {
      if (!state) return;
      setRoom(state);
      roomCodeRef.current = state.room_code;
      setChat(state.chat || []);
    });

    socket.on("room_settings_saved", ({ room: saved }) => {
      if (saved) setRoom(saved);
      setEditing(false);
      setScreen("lobby");
    });

    socket.on("chat_message", (message) => setChat((prev) => [...prev, message]));

    socket.on("session_started", ({ session: started }) => {
      setSession(started);
      setWaitingUsers([]);
      setScores(started.scores || []);
      setScreen("section");
    });

    socket.on("score_update", ({ scores: next }) => setScores(next || []));

    socket.on("participant_waiting", ({ username }) => {
      if (!username) return;
      setWaitingUsers((prev) => (prev.includes(username) ? prev : [...prev, username]));
    });

    socket.on("session_finished", (payload) => {
      setScores(payload?.scores || payload?.session?.scores || []);
      setScreen("ranking");
    });

    socket.on("ranking_update", ({ scores: next }) => setScores(next || []));

    socket.on("return_to_lobby", () => setScreen("lobby"));

    socket.connect();
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const createRoom = useCallback(
    async (settings: CompetitionRoomSettings) => {
      try {
        const created = await createCompetitionRoom(settings);
        socketRef.current?.emit("join_room", { room_code: created.room_code });
      } catch (e) {
        setError(e instanceof Error ? e.message : t("competition.could_not_create_room"));
      }
    },
    [t]
  );

  const joinRoom = useCallback((code: string) => {
    const roomCode = code.trim().toUpperCase();
    if (!roomCode) return;
    socketRef.current?.emit("join_room", { room_code: roomCode });
  }, []);

  const leaveRoom = useCallback(() => {
    const roomCode = roomCodeRef.current;
    if (!roomCode) return;
    socketRef.current?.emit("leave_room", { room_code: roomCode });
    roomCodeRef.current = null;
    setRoom(null);
    setSession(null);
    setChat([]);
    setEditing(false);
    setScreen("setup");
  }, []);

  const sendChat = useCallback((message: string) => {
    const roomCode = roomCodeRef.current;
    const text = message.trim();
    if (!text || !roomCode) return;
    socketRef.current?.emit("chat_message", { room_code: roomCode, message: text });
  }, []);

  const startSession = useCallback(() => {
    const roomCode = roomCodeRef.current;
    if (!roomCode) return;
    socketRef.current?.emit("host_start_session", { room_code: roomCode });
  }, []);

  const saveSettings = useCallback((settings: CompetitionRoomSettings) => {
    const roomCode = roomCodeRef.current;
    if (!roomCode) return;
    socketRef.current?.emit("host_edit_room", { room_code: roomCode, ...settings });
  }, []);

  const beginEdit = useCallback(() => {
    setEditing(true);
    setError("");
    setScreen("setup");
  }, []);

  const cancelEdit = useCallback(() => {
    setEditing(false);
    setScreen("lobby");
  }, []);

  // The learner reached the end of the trainer: report it and wait for the others.
  const finishTrainer = useCallback(() => {
    const roomCode = roomCodeRef.current;
    if (roomCode && session) {
      socketRef.current?.emit("participant_finished", {
        room_code: roomCode,
        session_id: session.id,
      });
    }
    setScreen("waiting");
  }, [session]);

  const returnToLobby = useCallback(() => {
    const roomCode = roomCodeRef.current;
    if (!roomCode) return;
    socketRef.current?.emit("return_to_lobby", { room_code: roomCode });
    setScreen("lobby");
  }, []);

  // Answer reporting for the in-room trainer.
  const sendVocabAnswer = useCallback(
    (
      word: string,
      activityType: string,
      isCorrect: boolean,
      responseMs: number,
      wrongAttempts: number
    ) => {
      const roomCode = roomCodeRef.current;
      if (!roomCode || !session) return;
      socketRef.current?.emit("vocab_answer", {
        room_code: roomCode,
        session_id: session.id,
        word,
        activity_type: activityType,
        is_correct: isCorrect,
        response_time_ms: responseMs,
        wrong_attempts: wrongAttempts,
      });
    },
    [session]
  );

  // Lesson rooms play a shared, server-generated task set; each task is reported under
  // its passage:line key so the server can score it once per participant.
  const sendLessonAnswer = useCallback(
    (itemKey: string, taskType: string, isCorrect: boolean, responseMs: number) => {
      const roomCode = roomCodeRef.current;
      if (!roomCode || !session) return;
      socketRef.current?.emit("lesson_answer", {
        room_code: roomCode,
        session_id: session.id,
        item_key: itemKey,
        task_type: taskType,
        is_correct: isCorrect,
        response_time_ms: responseMs,
      });
    },
    [session]
  );

  return {
    screen,
    room,
    session,
    scores,
    chat,
    waitingUsers,
    editing,
    error,
    setError,
    createRoom,
    joinRoom,
    leaveRoom,
    sendChat,
    startSession,
    saveSettings,
    beginEdit,
    cancelEdit,
    finishTrainer,
    returnToLobby,
    sendVocabAnswer,
    sendLessonAnswer,
  };
}

export type CompetitionRoomState = ReturnType<typeof useCompetitionRoom>;
