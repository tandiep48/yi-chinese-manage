"use client";

// components/layout/LearnerSettingsModal.tsx
// Learner display-preferences dialog opened from the sidebar's Settings item.
// Holds the controls that used to sit inline in the top nav: the language
// switcher (shown to everyone) and the per-user hanzi script + font (only when
// signed in). Follows the profile page's hand-rolled modal convention
// (AvatarModal + .profile-modal styles) rather than the admin manager_ui Modal.

import { useEffect } from "react";
import "./learner-nav.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { HanziSettingsControl } from "@/components/han/HanziSettingsControl";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function LearnerSettingsModal({ open, onClose }: Props) {
  const { t } = useT();
  const { user } = useAuth();

  // Close on Escape while open (mirrors AvatarModal).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className="learner-settings-modal" hidden={!open}>
      <div className="learner-settings-backdrop" onClick={onClose} />
      <div
        className="learner-settings-box"
        role="dialog"
        aria-modal="true"
        aria-label={t("settings.title")}
      >
        <div className="learner-settings-head">
          <h2>{t("settings.title")}</h2>
          <button
            type="button"
            className="learner-settings-close"
            onClick={onClose}
            aria-label={t("widgets.close")}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <LanguageSwitcher variant="panel" />
          {user && <HanziSettingsControl variant="panel" />}
        </div>
      </div>
    </div>
  );
}
