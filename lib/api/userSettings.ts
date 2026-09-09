// lib/api/userSettings.ts
// Learner self-service settings — the authenticated user's own display prefs.
// These predate the { success, data } envelope (see user_routes.py, they return
// raw { status, hanzi_* } / { error }), so they use legacyApiFetch. Distinct
// from lib/api/user.ts, which is the admin User CRUD over the enveloped
// /api/admin/user endpoints.

import { legacyApiFetch } from "./client";

interface HanziScriptResponse {
  status?: string;
  hanzi_script?: string;
  error?: string;
}

interface HanziFontResponse {
  status?: string;
  hanzi_font?: string;
  error?: string;
}

// POST the chosen script; the initial value comes from GET /api/auth/me
// (AuthUser.hanzi_script), so there's no separate load here.
export function saveHanziScript(script: string): Promise<HanziScriptResponse> {
  return legacyApiFetch<HanziScriptResponse>("/api/user/hanzi-script", {
    method: "POST",
    body: JSON.stringify({ hanzi_script: script }),
  });
}

export function saveHanziFont(font: string): Promise<HanziFontResponse> {
  return legacyApiFetch<HanziFontResponse>("/api/user/hanzi-font", {
    method: "POST",
    body: JSON.stringify({ hanzi_font: font }),
  });
}
