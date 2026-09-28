"use client";

// components/page/learner/profile/PasswordForm.tsx
// Change-password form (profile.html #password-form + profile.js). Validation
// and the API call live in useProfile; this clears the fields on success.

import { useState } from "react";
import { useT } from "@/components/i18n/I18nProvider";
import type { StatusMessage } from "@/hooks/profile/useProfile";

interface Props {
  message: StatusMessage;
  changing: boolean;
  onSubmit: (newPassword: string, confirmPassword: string) => Promise<boolean>;
}

export function PasswordForm({ message, changing, onSubmit }: Props) {
  const { t } = useT();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await onSubmit(newPassword, confirmPassword);
    if (ok) {
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <>
      <form className="password-form" onSubmit={submit}>
        <div className="form-group">
          <label htmlFor="new-password">{t("profile.new_password_label")}</label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirm-password">{t("profile.confirm_password_label")}</label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <button className="btn primary password-submit" type="submit" disabled={changing}>
          {t("profile.change_password")}
        </button>
      </form>
      <div className={`profile-message ${message.type}`}>{message.text}</div>
    </>
  );
}
