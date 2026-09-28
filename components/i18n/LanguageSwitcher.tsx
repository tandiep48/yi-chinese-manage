"use client";

// components/i18n/LanguageSwitcher.tsx
// EN / VI selector. Two looks: "nav" (white-on-teal, for the sidebar) and
// "panel" (a labeled light field, for the settings modal).

import { useT } from "./I18nProvider";
import { SUPPORTED_LANGS, LANG_LABELS, type Lang } from "@/lib/i18n";

const NAV_SELECT_CLS =
  "rounded-lg border border-white/30 bg-white/15 px-2 py-1.5 text-xs font-bold text-white outline-none";
const PANEL_SELECT_CLS =
  "w-full rounded-lg border border-[color:var(--learner-border)] bg-white px-3 py-2 text-sm text-[color:var(--learner-text)] outline-none focus:border-[color:var(--learner-nav)]";

export function LanguageSwitcher({ variant = "nav" }: { variant?: "nav" | "panel" }) {
  const { lang, setLang, t } = useT();

  const select = (
    <select
      aria-label={t("nav.language_label")}
      value={lang}
      onChange={(e) => setLang(e.target.value as Lang)}
      className={variant === "panel" ? PANEL_SELECT_CLS : NAV_SELECT_CLS}
    >
      {SUPPORTED_LANGS.map((l) => (
        <option key={l} value={l} className="text-slate-800">
          {LANG_LABELS[l]}
        </option>
      ))}
    </select>
  );

  if (variant === "nav") return select;

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-[color:var(--learner-text)]">
        {t("nav.language_label")}
      </span>
      {select}
    </label>
  );
}
