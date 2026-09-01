"use client";

// components/page/learner/translation/TranslationPanel.tsx
// Renders the lesson's translation sentences. Ported from renderRows() in
// Learning/web_app/static/translation/translation.js: each row shows the meaning
// (in the UI language), an input for the learner to type the Chinese, and a
// per-row reveal of the answer.

import { useState } from "react";
import { useT } from "@/components/i18n/I18nProvider";
import type { TranslationRow } from "@/lib/types/types";

export function TranslationPanel({
  rows,
  loading,
  error,
}: {
  rows: TranslationRow[];
  loading: boolean;
  error: string | null;
}) {
  const { t } = useT();

  if (loading) return <div className="lesson-learner-empty">{t("translation.loading")}</div>;
  if (error) return <div className="lesson-learner-empty">{t("translation.failed_load")}</div>;
  if (rows.length === 0)
    return <div className="lesson-learner-empty">{t("translation.empty")}</div>;

  return (
    <div className="translation-list">
      {rows.map((row, index) => (
        <TranslationItem key={row.translation_id ?? index} row={row} index={index} />
      ))}
    </div>
  );
}

function TranslationItem({ row, index }: { row: TranslationRow; index: number }) {
  const { t, lang } = useT();
  const [revealed, setRevealed] = useState(false);
  const meaning = (lang === "vi" ? row.vn : row.en) || row.en || row.vn || "";

  return (
    <div className="translation-item">
      <div className="translation-item-index">{index + 1}</div>
      <div className="translation-item-body">
        <div className="translation-meaning">{meaning}</div>
        <input
          type="text"
          className="translation-input"
          placeholder={t("translation.input_placeholder")}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        {revealed && (
          <div className="translation-answer" lang="zh-CN">
            {row.cn}
          </div>
        )}
        <button
          type="button"
          className="translation-reveal-btn"
          onClick={() => setRevealed((v) => !v)}
        >
          {revealed ? t("translation.hide") : t("translation.reveal")}
        </button>
      </div>
    </div>
  );
}
