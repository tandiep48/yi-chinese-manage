"use client";

// components/han/HanziSettingsControl.tsx
// The signed-in user's hanzi script + font selectors, ported from the legacy
// .hanzi-font-control block in templates/shared/site_nav.html. Two looks:
// "nav" (compact white-on-teal, the historical inline row) and "panel"
// (stacked labeled fields, for the settings modal). Callers gate on auth — the
// preferences are per-user, so anonymous visitors never see this control.

import { useT } from "@/components/i18n/I18nProvider";
import { useHanziSettings } from "./HanziSettingsProvider";
import { HANZI_FONTS, type HanziFont, type HanziScript } from "@/lib/han/hanConvert";

const NAV_SELECT_CLS =
  "rounded-lg border border-white/30 bg-white/15 px-2 py-1.5 text-xs font-bold text-white outline-none";
const PANEL_SELECT_CLS =
  "w-full rounded-lg border border-[color:var(--learner-border)] bg-white px-3 py-2 text-sm text-[color:var(--learner-text)] outline-none focus:border-[color:var(--learner-nav)]";

export function HanziSettingsControl({ variant = "nav" }: { variant?: "nav" | "panel" }) {
  const { t } = useT();
  const { script, font, setScript, setFont } = useHanziSettings();

  const scriptSelect = (
    <select
      aria-label="Script"
      title="Script"
      value={script}
      onChange={(e) => setScript(e.target.value as HanziScript)}
      className={variant === "panel" ? PANEL_SELECT_CLS : NAV_SELECT_CLS}
    >
      <option value="simplified" className="text-slate-800">
        简体
      </option>
      <option value="traditional" className="text-slate-800">
        繁體
      </option>
    </select>
  );

  const fontSelect = (
    <select
      aria-label="Font"
      title="Font"
      value={font}
      onChange={(e) => setFont(e.target.value as HanziFont)}
      className={variant === "panel" ? PANEL_SELECT_CLS : NAV_SELECT_CLS}
    >
      {HANZI_FONTS.map((f) => (
        <option key={f} value={f} className="text-slate-800">
          {f}
        </option>
      ))}
    </select>
  );

  if (variant === "nav") {
    return (
      <div className="flex items-center gap-1.5" data-han-skip>
        <span className="hidden text-xs font-bold text-white lg:inline">
          {t("nav.hanzi_label")}
        </span>
        {scriptSelect}
        {fontSelect}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-han-skip>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-[color:var(--learner-text)]">
          {t("settings.script")}
        </span>
        {scriptSelect}
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-[color:var(--learner-text)]">
          {t("settings.font")}
        </span>
        {fontSelect}
      </label>
    </div>
  );
}
