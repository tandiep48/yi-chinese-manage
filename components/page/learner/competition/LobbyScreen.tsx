"use client";

// components/page/learner/competition/LobbyScreen.tsx
// The room lobby: the room-code bar, the settings summary + member list with the
// host's Edit / Start controls, and the chat panel. Ported from the #screen-lobby
// section of learn_together.html plus renderRoom() / appendChat() in competition.js
// (the innerHTML builders become plain JSX, so no escaping is needed).

import { useEffect, useRef, useState } from "react";
import { useT } from "@/components/i18n/I18nProvider";
import { canManageRoom, roomSummary } from "@/lib/competition/roomLogic";
import type { CompetitionChatMessage, CompetitionRoom } from "@/lib/types/types";

export function LobbyScreen({
  room,
  chat,
  userId,
  error,
  onLeave,
  onEdit,
  onStart,
  onSendChat,
}: {
  room: CompetitionRoom;
  chat: CompetitionChatMessage[];
  userId: number | null;
  error: string;
  onLeave: () => void;
  onEdit: () => void;
  onStart: () => void;
  onSendChat: (message: string) => void;
}) {
  const { t } = useT();
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const summary = roomSummary(room);
  const canManage = canManageRoom(room, userId);

  // Keep the newest message in view, like the legacy appendChat().
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [chat]);

  function send() {
    if (!draft.trim()) return;
    onSendChat(draft);
    setDraft("");
  }

  const typeLabel = summary.allTypes
    ? t("competition.type_all")
    : summary.typeKeys.map((key) => t(key)).join(", ");

  return (
    <section className="competition-screen active">
      <div className="competition-room-bar">
        <div>
          <span className="competition-label">{t("competition.room_label")}</span>
          <strong>{room.room_code}</strong>
        </div>
        <button type="button" className="btn secondary" onClick={onLeave}>
          {t("competition.leave")}
        </button>
      </div>

      <div className="competition-lobby-grid">
        <section className="competition-panel">
          <h2>{t("competition.room_setup")}</h2>
          <div className="competition-summary">
            <div>
              <strong>{summary.sourceLabel || t(summary.modeKey)}</strong>
            </div>
            <div>{`${t(summary.modeKey)} · ${typeLabel}`}</div>
            <div>
              {t("competition.lessons_parts_count", {
                lessons: summary.lessonCount,
                parts: summary.partCount,
              })}
            </div>
            {/* A book room's pool is only known once the session starts, so it shows a
                note where the other modes show their count. */}
            <div>{t(summary.countKey, { count: summary.count })}</div>
            <div>
              {t("competition.users_count", {
                count: summary.memberCount,
                max: summary.maxUsers,
              })}
            </div>
            <div>{t("competition.time_limit_value", { n: summary.minutes })}</div>
          </div>

          <div className="member-list">
            {(room.members || []).map((member) => (
              <div className="member-row" key={member.user_id}>
                <strong>{member.username}</strong>
                <span className="member-role">{member.role}</span>
              </div>
            ))}
          </div>

          {error && <p className="competition-error">{error}</p>}

          {canManage && (
            <div className="competition-lobby-actions">
              <button type="button" className="btn secondary" onClick={onEdit}>
                {t("competition.edit_settings")}
              </button>
              <button
                type="button"
                className="btn primary competition-start-btn"
                onClick={onStart}
              >
                {t("competition.start_session")}
              </button>
            </div>
          )}
        </section>

        <section className="competition-panel chat-panel">
          <h2>{t("competition.chat")}</h2>
          <div className="chat-list" ref={listRef}>
            {chat.map((message) => (
              <div className="chat-message" key={message.id}>
                <strong>{message.username || t("competition.user_fallback")}</strong>
                <span>{message.message}</span>
              </div>
            ))}
          </div>
          <div className="chat-input-row">
            <input
              type="text"
              maxLength={1000}
              placeholder={t("competition.message_placeholder")}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
            />
            <button type="button" className="btn primary" onClick={send}>
              {t("competition.send")}
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}
