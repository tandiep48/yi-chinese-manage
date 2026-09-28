"use client";

// components/page/learner/pinyin/BasicPinyinTable.tsx
// The basic pinyin chart: Initials + Finals + toned vowels in one fixed grid.
// Click a cell to hear it; hover to see a pronunciation hint. Ported from
// Learning/web_app/templates/lesson/basic_pinyin.html + pinyin.js.

import { useState } from "react";
import { useT } from "@/components/i18n/I18nProvider";
import {
  BASIC_INITIAL_ROWS,
  BASIC_TONE_ROWS,
  BASIC_FINAL_ROWS,
  PRONUNCIATION_MAP,
  playPinyin,
} from "@/lib/lessons/pinyin";

interface Tip {
  text: string;
  x: number;
  y: number;
}

export function BasicPinyinTable() {
  const { t } = useT();
  const [tip, setTip] = useState<Tip | null>(null);

  const hint = (syllable: string): string =>
    PRONUNCIATION_MAP[syllable] ?? t("pinyin.pronunciation_for", { syllable });

  // A plain render helper (not a nested component) so cells aren't remounted on
  // every tooltip state change.
  const renderCell = (value: string | null, key: string) => {
    if (!value) return <td className="pinyin-cell" aria-hidden="true" key={key} />;
    return (
      <td
        key={key}
        className="pinyin-cell pinyin-cell-clickable"
        role="button"
        tabIndex={0}
        onClick={() => playPinyin(value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            playPinyin(value);
          }
        }}
        onMouseEnter={(e) => setTip({ text: hint(value), x: e.pageX, y: e.pageY })}
        onMouseMove={(e) => setTip({ text: hint(value), x: e.pageX, y: e.pageY })}
        onMouseLeave={() => setTip(null)}
      >
        {value}
      </td>
    );
  };

  return (
    <div className="pinyin-table-wrap">
      <table className="pinyin-basic-table">
        <thead>
          <tr>
            <th colSpan={4}>{t("pinyin.initials")}</th>
            <th colSpan={4}>{t("pinyin.finals")}</th>
          </tr>
        </thead>
        <tbody>
          {BASIC_FINAL_ROWS.map((finalRow, i) => {
            const isTonesHeader = i === 6;
            const initialRow = i < 6 ? BASIC_INITIAL_ROWS[i] : null;
            const toneRow = i > 6 ? BASIC_TONE_ROWS[i - 7] : null;
            return (
              <tr key={i}>
                {isTonesHeader ? (
                  <th colSpan={4} className="pinyin-section-head">
                    {t("pinyin.tones")}
                  </th>
                ) : (
                  (initialRow ?? toneRow ?? [null, null, null, null]).map((v, c) =>
                    renderCell(v, `l-${i}-${c}`)
                  )
                )}
                {finalRow.map((v, c) => renderCell(v, `r-${i}-${c}`))}
              </tr>
            );
          })}
        </tbody>
      </table>

      {tip && (
        <div className="pinyin-tooltip visible" style={{ left: tip.x + 10, top: tip.y + 10 }}>
          {tip.text}
        </div>
      )}
    </div>
  );
}
