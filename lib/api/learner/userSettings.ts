// lib/api/learner/userSettings.ts
// Learner self-service settings — the authenticated user's own display prefs.
// These predate the { success, data } envelope (see user_routes.py, they return
// raw { status, hanzi_* } / { error }), so they use legacyApiFetch. Distinct
// from lib/api/user.ts, which is the admin User CRUD over the enveloped
// /api/admin/user endpoints.

import { legacyApiFetch } from "../client";

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

// The signed-in account's saved UI language. This is the source of truth the Flask
// app reads (get_current_lang) when it builds server-side content such as the
// lesson-trainer meaning options, so the Next frontend must keep it in sync with
// the language switcher — otherwise the UI can say EN while the server still serves
// the account's old language.
export function saveUiLanguage(lang: string): Promise<{ status?: string; ui_language?: string; error?: string }> {
  return legacyApiFetch("/api/user/ui-language", {
    method: "POST",
    body: JSON.stringify({ ui_language: lang }),
  });
}

// GET the account's saved UI language, or null when signed out / unavailable.
export function loadUiLanguage(): Promise<string | null> {
  return legacyApiFetch<{ ui_language?: string }>("/api/user/ui-language")
    .then((r) => r.ui_language ?? null)
    .catch(() => null);
}
