"use client";

// components/han/HanziSettingsControl.tsx
// Nav dropdowns for the signed-in user's hanzi script + font, matching the
// legacy .hanzi-font-control block in templates/shared/site_nav.html. Styled to
// match LanguageSwitcher (white-on-teal). Render only when authenticated — the
// preferences are per-user, like the legacy control which the template omitted
// for anonymous visitors.

import { useT } from "@/components/i18n/I18nProvider";
import { useHanziSettings } from "./HanziSettingsProvider";
import { HANZI_FONTS, type HanziFont, type HanziScript } from "@/lib/han/hanConvert";

const SELECT_CLS =
  "rounded-lg border border-white/30 bg-white/15 px-2 py-1.5 text-xs font-bold text-white outline-none";

export function HanziSettingsControl() {
  const { t } = useT();
  const { script, font, setScript, setFont } = useHanziSettings();

  return (
    <div className="flex items-center gap-1.5" data-han-skip>
      <span className="hidden text-xs font-bold text-white lg:inline">
        {t("nav.hanzi_label")}
      </span>
      <select
        aria-label="Script"
        title="Script"
        value={script}
        onChange={(e) => setScript(e.target.value as HanziScript)}
        className={SELECT_CLS}
      >
        <option value="simplified" className="text-slate-800">
          简体
        </option>
        <option value="traditional" className="text-slate-800">
          繁體
        </option>
      </select>
      <select
        aria-label="Font"
        title="Font"
        value={font}
        onChange={(e) => setFont(e.target.value as HanziFont)}
        className={SELECT_CLS}
      >
        {HANZI_FONTS.map((f) => (
          <option key={f} value={f} className="text-slate-800">
            {f}
          </option>
        ))}
      </select>
    </div>
  );
}
