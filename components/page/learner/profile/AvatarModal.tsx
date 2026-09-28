"use client";

// components/page/learner/profile/AvatarModal.tsx
// Avatar upload dialog (profile.html #avatar-modal + profile.js). Picks one
// image file and posts it; Escape / backdrop / close button dismiss it.

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import type { StatusMessage } from "@/hooks/profile/useProfile";

interface Props {
  open: boolean;
  message: StatusMessage;
  uploading: boolean;
  onClose: () => void;
  onSubmit: (file: File | null) => void;
}

export function AvatarModal({ open, message, uploading, onClose, onSubmit }: Props) {
  const { t } = useT();
  const [file, setFile] = useState<File | null>(null);

  // Close on Escape while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(file);
  };

  return (
    <div className="profile-modal" hidden={!open}>
      <div className="profile-modal-backdrop" onClick={onClose} />
      <div
        className="profile-modal-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-modal-title"
      >
        <div className="profile-modal-head">
          <h2 id="avatar-modal-title">{t("profile.upload_avatar")}</h2>
          <button
            type="button"
            className="profile-modal-close"
            onClick={onClose}
            aria-label={t("widgets.close")}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        <form className="avatar-form" onSubmit={submit}>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <button className="btn primary avatar-submit" type="submit" disabled={uploading}>
            {t("profile.upload_avatar")}
          </button>
        </form>
        <div className={`profile-message ${message.type}`}>{message.text}</div>
      </div>
    </div>
  );
}
