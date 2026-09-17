// lib/api/translation.ts
// Learner-facing lesson translation endpoint (the Translation study page).
// Mirrors Learning/web_app/routes/translation/translation_routes.py GET /lesson,
// a raw (non-enveloped) JSON endpoint — use legacyApiFetch.

import type { TranslationRow } from "@/lib/types/lesson";
import { legacyApiFetch } from "./client";

export function getLessonTranslations(
  hskLevel: string,
  lesson: string
): Promise<TranslationRow[]> {
  return legacyApiFetch<{ translations: TranslationRow[] }>(
    `/api/translation/lesson?hsk_level=${encodeURIComponent(hskLevel)}&lesson=${encodeURIComponent(lesson)}`
  ).then((r) => r.translations ?? []);
}
