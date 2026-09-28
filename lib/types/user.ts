// lib/types/user.ts
// Accounts: the admin CRUD row, the logged-in learner, and the profile summary.
// Mirrors the JSON shapes served by the Flask app in ../../../Learning.

export interface User {
  id: number;
  username: string;
  email: string;
  level: number | null;
}

// The logged-in learner's session user — returned by /api/auth/*.
// Superset of the admin User shape above (profile/preference fields the
// admin CRUD table doesn't need).
export interface AuthUser {
  id: number;
  username: string;
  email: string;
  level: number | null;
  avatar_path: string | null;
  avatar_url: string | null;
  hanzi_font: string | null;
  hanzi_script: string | null;
  ui_language: string | null;
}

export type UserFormData = {
  username: string;
  email: string;
  password?: string;
  level?: number;
};

// ─── Profile / review history ─────────────────────────────────────────────
// Backs the ported profile page (Learning/web_app profile.js + review.js).

// GET /api/user/profile-summary → serialize_current_user() under `user`.
// The legacy page uses this only to refresh the avatar + level on view (the
// summary also recomputes/backfills the stored HSK level server-side).
export interface ProfileSummaryUser {
  id: number;
  username: string;
  email: string;
  level: number | null;
  avatar_path: string | null;
  avatar_url: string | null;
  hanzi_font: string | null;
  hanzi_script: string | null;
  ui_language: string | null;
}
