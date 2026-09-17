// lib/api/profile.ts
// Learner profile self-service endpoints (Learning/web_app profile.js): the HSK
// level/avatar summary, avatar upload, and change-password. All login-required
// and pre-envelope (raw JSON), so they mirror legacyApiFetch's conventions.
// Avatar upload can't use legacyApiFetch: it posts multipart/form-data, and the
// browser must set the multipart boundary itself — so no Content-Type header.

import type { ProfileSummaryUser } from "@/lib/types/user";
import { API_CONSTANTS } from "./constants";
import { legacyApiFetch, UnauthenticatedError } from "./client";

const BASE = API_CONSTANTS.BASE_URL;

// GET /api/user/profile-summary — refreshes avatar + HSK level (recomputed
// server-side) on view. We only consume `user`; the time-tracking stats the
// legacy page ignores are left unmodelled.
export function getProfileSummary(): Promise<{ user: ProfileSummaryUser }> {
  return legacyApiFetch(`/api/user/profile-summary`);
}

// POST /api/user/change-password — { status: "success" } or { error } (400/500).
export function changePassword(
  newPassword: string,
  confirmPassword: string
): Promise<{ status: string }> {
  return legacyApiFetch(`/api/user/change-password`, {
    method: "POST",
    body: JSON.stringify({
      new_password: newPassword,
      confirm_password: confirmPassword,
    }),
  });
}

export interface AvatarUploadResponse {
  status: string;
  avatar_path: string;
  avatar_url: string | null;
}

// POST /api/user/avatar (multipart). Bespoke fetch so the browser owns the
// Content-Type boundary; still sends the session cookie and surfaces the same
// UnauthenticatedError / error-body behaviour as legacyApiFetch.
export async function uploadAvatar(file: File): Promise<AvatarUploadResponse> {
  const form = new FormData();
  form.append("avatar", file);

  const res = await fetch(`${BASE}/api/user/avatar`, {
    method: "POST",
    credentials: "include",
    body: form,
  });

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new UnauthenticatedError();
  }

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.error || `API error ${res.status}`);
  }
  return body as AvatarUploadResponse;
}
