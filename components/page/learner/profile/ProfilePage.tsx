"use client";

// components/page/learner/profile/ProfilePage.tsx
// Learner profile page, ported from Learning/web_app/templates/profile/profile.html
// (+ profile.js / profile.css) and the embedded review panel (review.js). Root
// carries `.profile-page` so the ported CSS in globals.css is scoped to it.

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { useProfile } from "@/hooks/useProfile";
import { badgeUrl } from "@/lib/gcs";
import { AvatarModal } from "./AvatarModal";
import { PasswordForm } from "./PasswordForm";
import { ReviewPanel } from "./ReviewPanel";
import "./profile-page.css";

export function ProfilePage() {
  const { t } = useT();
  const p = useProfile();

  const badge = badgeUrl(p.level);
  const initial = p.username ? p.username[0].toUpperCase() : "";

  return (
    <main className="profile-page">
      <div className="profile-topbar">
        <Link href="/" className="profile-link">
          &larr; {t("profile.dashboard")}
        </Link>
      </div>

      <section className="profile-header">
        <div className="profile-header-main">
          <button
            type="button"
            className="profile-avatar-wrap"
            title={t("profile.upload_avatar")}
            onClick={p.openModal}
          >
            {p.avatarUrl ? (
              <img className="profile-avatar-img" src={p.avatarUrl} alt="" />
            ) : (
              <div className="profile-avatar-fallback">{initial}</div>
            )}
            <span className="profile-avatar-overlay">
              <FontAwesomeIcon icon={faCamera} aria-hidden />
            </span>
          </button>
          <div className="profile-heading">
            <h1>{p.username}</h1>
            <p>{p.email}</p>
          </div>
        </div>
        {badge && (
          <div className="profile-badge-col">
            <img
              className="profile-badge-img"
              src={badge}
              alt={`${t("profile.badge")} HSK ${p.level}`}
            />
          </div>
        )}
      </section>

      <AvatarModal
        open={p.modalOpen}
        message={p.avatarMsg}
        uploading={p.uploading}
        onClose={p.closeModal}
        onSubmit={p.submitAvatar}
      />

      <section className="profile-section">
        <h2>{t("profile.review_practices")}</h2>
        <ReviewPanel />
      </section>

      <section className="profile-section">
        <h2>{t("profile.change_password")}</h2>
        <PasswordForm
          message={p.passwordMsg}
          changing={p.changing}
          onSubmit={p.submitPassword}
        />
      </section>
    </main>
  );
}
