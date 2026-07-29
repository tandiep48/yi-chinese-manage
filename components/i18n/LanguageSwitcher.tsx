"use client";

// components/i18n/LanguageSwitcher.tsx
// EN / VI selector for the learner top nav.

import { useT } from "./I18nProvider";
import { SUPPORTED_LANGS, LANG_LABELS, type Lang } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { lang, setLang, t } = useT();
  return (
    <select
      aria-label={t("nav.language_label")}
      value={lang}
      onChange={(e) => setLang(e.target.value as Lang)}
      className="rounded-lg border border-white/30 bg-white/15 px-2 py-1.5 text-xs font-bold text-white outline-none"
    >
      {SUPPORTED_LANGS.map((l) => (
        <option key={l} value={l} className="text-slate-800">
          {LANG_LABELS[l]}
        </option>
      ))}
    </select>
  );
}
