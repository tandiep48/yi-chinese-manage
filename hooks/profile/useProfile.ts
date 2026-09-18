"use client";

// hooks/useProfile.ts
// Profile header state machine (Learning/web_app/static/profile/profile.js):
// avatar display + upload modal, and the change-password form. Seeds from the
// authed user, then refreshes the avatar + HSK level from profile-summary on
// mount (which also backfills the level server-side).

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useT } from "@/components/i18n/I18nProvider";
import {
  getProfileSummary,
  uploadAvatar,
  changePassword,
} from "@/lib/api/learner/profile";

export type MessageType = "" | "success" | "error";
export interface StatusMessage {
  text: string;
  type: MessageType;
}

const EMPTY: StatusMessage = { text: "", type: "" };

export function useProfile() {
  const { user, patchUser } = useAuth();
  const { t } = useT();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [level, setLevel] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [changing, setChanging] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState<StatusMessage>(EMPTY);
  const [passwordMsg, setPasswordMsg] = useState<StatusMessage>(EMPTY);

  // Seed from the auth user as soon as it resolves.
  useEffect(() => {
    setAvatarUrl(user?.avatar_url ?? null);
    setLevel(user?.level ?? null);
  }, [user]);

  // Refresh avatar + level from the server on mount (soft-fails signed out).
  useEffect(() => {
    let cancelled = false;
    getProfileSummary()
      .then((data) => {
        if (cancelled) return;
        setAvatarUrl(data.user?.avatar_url ?? null);
        if (typeof data.user?.level === "number") setLevel(data.user.level);
      })
      .catch(() => {
        /* not signed in / backend down — keep the auth-seeded values */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openModal = useCallback(() => {
    setAvatarMsg(EMPTY);
    setModalOpen(true);
  }, []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  const submitAvatar = useCallback(
    async (file: File | null) => {
      if (!file) {
        setAvatarMsg({ text: t("profile.choose_avatar_first"), type: "error" });
        return;
      }
      setUploading(true);
      setAvatarMsg({ text: t("profile.uploading"), type: "" });
      try {
        const data = await uploadAvatar(file);
        setAvatarUrl(data.avatar_url ?? null);
        // Push it into the shared user so the nav avatar updates without a reload
        // (legacy updateNavAvatar()).
        patchUser({ avatar_url: data.avatar_url ?? null, avatar_path: data.avatar_path });
        setAvatarMsg({ text: t("profile.avatar_updated"), type: "success" });
        setTimeout(() => setModalOpen(false), 800);
      } catch (e) {
        setAvatarMsg({
          text: (e as Error).message || t("profile.upload_failed"),
          type: "error",
        });
      } finally {
        setUploading(false);
      }
    },
    [t, patchUser]
  );

  const submitPassword = useCallback(
    async (newPassword: string, confirmPassword: string) => {
      if (!newPassword || !confirmPassword) {
        setPasswordMsg({ text: t("profile.new_password_required"), type: "error" });
        return false;
      }
      if (newPassword !== confirmPassword) {
        setPasswordMsg({ text: t("profile.passwords_do_not_match"), type: "error" });
        return false;
      }
      setChanging(true);
      setPasswordMsg({ text: t("profile.updating_password"), type: "" });
      try {
        await changePassword(newPassword, confirmPassword);
        setPasswordMsg({ text: t("profile.password_updated"), type: "success" });
        return true;
      } catch (e) {
        setPasswordMsg({
          text: (e as Error).message || t("profile.could_not_update_password"),
          type: "error",
        });
        return false;
      } finally {
        setChanging(false);
      }
    },
    [t]
  );

  return {
    username: user?.username ?? "",
    email: user?.email ?? "",
    avatarUrl,
    level,
    modalOpen,
    uploading,
    changing,
    avatarMsg,
    passwordMsg,
    openModal,
    closeModal,
    submitAvatar,
    submitPassword,
  };
}
