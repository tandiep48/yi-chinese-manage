// lib/lessons/meaning.ts
// Language-aware meaning selection, mirroring pickLang / pickMeaning in
// Learning/web_app/static/shared/i18n.js. VI shows the Vietnamese gloss (falling
// back to English), EN shows English (falling back to Vietnamese).

import type { Lang } from "@/lib/i18n";

export function pickLang(
  vn: string | null | undefined,
  en: string | null | undefined,
  lang: Lang
): string {
  const v = vn ?? "";
  const e = en ?? "";
  return (lang === "vi" ? v || e : e || v) || "";
}

export function pickMeaning(
  row: { meaning_vn?: string | null; meaning_en?: string | null },
  lang: Lang
): string {
  return pickLang(row.meaning_vn, row.meaning_en, lang);
}
