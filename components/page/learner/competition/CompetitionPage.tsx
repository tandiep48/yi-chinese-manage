"use client";

// components/page/learner/competition/CompetitionPage.tsx
// Learn Together — the real-time vocabulary competition, ported from
// Learning/web_app/templates/competition/learn_together.html +
// static/competition/competition.js. The room state machine lives in
// useCompetitionRoom (socket + screens) and the create/edit form in
// useCompetitionSetup; this component only wires them to the five screens.
//
// The page needs a signed-in user (the Flask page is @login_required, and every
// socket handler rejects an anonymous connection), so it redirects to /login.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCompetitionRoom } from "@/hooks/useCompetitionRoom";
import { useCompetitionSetup } from "@/hooks/useCompetitionSetup";
import { SetupScreen } from "./SetupScreen";
import { LobbyScreen } from "./LobbyScreen";
import { SectionScreen } from "./SectionScreen";
import { WaitingScreen } from "./WaitingScreen";
import { RankingScreen } from "./RankingScreen";
import "./competition-shell.css";

export function CompetitionPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const room = useCompetitionRoom();
  const setup = useCompetitionSetup();

  useEffect(() => {
    if (!loading && !user) router.replace("/learner/login");
  }, [loading, user, router]);

  // Create a room, or save the settings of the one being edited.
  function submitRoom() {
    const settings = setup.buildSettings();
    if (!settings) return;
    if (room.editing) room.saveSettings(settings);
    else void room.createRoom(settings);
  }

  function editRoomSettings() {
    if (!room.room) return;
    room.beginEdit();
    void setup.prefillFromRoom(room.room);
  }

  if (!user) return null;

  // The setup form owns its own error line; every other screen shows the room errors.
  const setupError = setup.error || room.error;

  return (
    <main className="competition-shell">
      {room.screen === "setup" && (
        <SetupScreen
          setup={setup}
          editing={room.editing}
          error={setupError}
          onSubmit={submitRoom}
          onCancelEdit={room.cancelEdit}
          onJoin={room.joinRoom}
        />
      )}

      {room.screen === "lobby" && room.room && (
        <LobbyScreen
          room={room.room}
          chat={room.chat}
          userId={user.id}
          error={room.error}
          onLeave={room.leaveRoom}
          onEdit={editRoomSettings}
          onStart={room.startSession}
          onSendChat={room.sendChat}
        />
      )}

      {room.screen === "section" && (
        <SectionScreen
          room={room.room}
          session={room.session}
          scores={room.scores}
          userId={user.id}
          onVocabAnswer={room.sendVocabAnswer}
          onLessonAnswer={room.sendLessonAnswer}
          onFinish={room.finishTrainer}
        />
      )}

      {room.screen === "waiting" && (
        <WaitingScreen waitingUsers={room.waitingUsers} scores={room.scores} />
      )}

      {room.screen === "ranking" && (
        <RankingScreen scores={room.scores} onBackToLobby={room.returnToLobby} />
      )}
    </main>
  );
}
