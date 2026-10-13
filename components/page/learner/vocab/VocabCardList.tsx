"use client";

// components/page/learner/vocab/VocabCardList.tsx
// Mobile card view of a page of vocab rows — the phone-friendly alternative to
// the horizontally-scrolling VocabTable. Each word is a full-width card: a select
// checkbox (picks the word for training, same hook state as the table), the
// hanzi / pinyin / meaning, and an audio button. Tapping the card body opens a
// bottom-sheet with the word's full detail (hanzi, pinyin, VN + EN meaning,
// audio, and a stroke-order button that reuses the page's VocabStrokeModal). A
// "select all on page" row sits on top.
//
// Takes the same selection props the table does, so a surface can render this on
// mobile and VocabTable on desktop without any extra state.

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faVolumeHigh,
  faChevronRight,
  faXmark,
  faPenNib,
} from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { vocabAudioUrl } from "@/lib/audio";
import type { VocabRow } from "@/lib/types/vocab";
import "./vocab-card-list.css";

const HANZI_RE = /[一-鿿]/;

interface VocabCardListProps {
  rows: VocabRow[];
  isSelected: (row: VocabRow) => boolean;
  allOnPageSelected: boolean;
  onToggleWord: (row: VocabRow, checked: boolean) => void;
  onTogglePage: (rows: VocabRow[], checked: boolean) => void;
  // Opens the page's stroke-order modal (reused from the table flow).
  onOpenStroke?: (word: string, pinyin: string) => void;
}

function wordOf(row: VocabRow): string {
  return row.word || row.cn || "";
}

export function VocabCardList({
  rows,
  isSelected,
  allOnPageSelected,
  onToggleWord,
  onTogglePage,
  onOpenStroke,
}: VocabCardListProps) {
  const { t } = useT();
  const [detail, setDetail] = useState<VocabRow | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function play(row: VocabRow) {
    if (!row.audio_key) return;
    audioRef.current?.pause();
    const audio = new Audio(vocabAudioUrl(row.audio_key));
    audioRef.current = audio;
    audio.play().catch(() => {
      /* ignore playback errors, matching the table */
    });
  }

  // Close the detail sheet on Escape; stop audio when it unmounts.
  useEffect(() => {
    if (!detail) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetail(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detail]);

  useEffect(
    () => () => {
      audioRef.current?.pause();
      audioRef.current = null;
    },
    []
  );

  const detailWord = detail ? wordOf(detail) : "";
  const detailMeaningVn = detail?.meaning_vn || "";
  const detailMeaningEn = detail?.meaning_en || "";

  return (
    <div className="vocab-card-list">
      <label className="vcl-selectall">
        <input
          type="checkbox"
          checked={allOnPageSelected}
          onChange={(e) => onTogglePage(rows, e.target.checked)}
          aria-label={t("vocab.select_visible_rows_aria")}
        />
        <span>{t("vocab.select_all")}</span>
      </label>

      <ul className="vcl-cards">
        {rows.map((row, index) => {
          const word = wordOf(row);
          const meaning = row.meaning_vn || row.meaning_en || "";
          return (
            <li
              key={`${word}-${index}`}
              className={`vcl-card${isSelected(row) ? " is-selected" : ""}`}
            >
              <input
                type="checkbox"
                className="vcl-card-check"
                checked={isSelected(row)}
                onChange={(e) => onToggleWord(row, e.target.checked)}
                aria-label={word}
              />

              <button type="button" className="vcl-card-main" onClick={() => setDetail(row)}>
                <span className="vcl-card-hanzi" lang="zh-CN">
                  {word}
                </span>
                <span className="vcl-card-text">
                  <span className="vcl-card-pinyin">{row.pinyin}</span>
                  <span className="vcl-card-meaning">{meaning}</span>
                </span>
                <FontAwesomeIcon icon={faChevronRight} className="vcl-card-chevron" aria-hidden />
              </button>

              {row.audio_key ? (
                <button
                  type="button"
                  className="vcl-card-audio"
                  onClick={() => play(row)}
                  aria-label={t("lesson.play_audio")}
                >
                  <FontAwesomeIcon icon={faVolumeHigh} />
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>

      {detail ? (
        <div className="vcl-sheet-overlay" onClick={() => setDetail(null)}>
          <div
            className="vcl-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={detailWord}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="vcl-sheet-close"
              onClick={() => setDetail(null)}
              aria-label={t("widgets.close")}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>

            <div className="vcl-sheet-hanzi" lang="zh-CN">
              {detailWord}
            </div>
            <div className="vcl-sheet-pinyin">{detail.pinyin}</div>
            {detailMeaningVn ? <div className="vcl-sheet-meaning">{detailMeaningVn}</div> : null}
            {detailMeaningEn ? (
              <div className="vcl-sheet-meaning vcl-sheet-meaning-en">{detailMeaningEn}</div>
            ) : null}

            <div className="vcl-sheet-actions">
              {detail.audio_key ? (
                <button type="button" className="vcl-sheet-btn" onClick={() => play(detail)}>
                  <FontAwesomeIcon icon={faVolumeHigh} /> <span>{t("widgets.listen")}</span>
                </button>
              ) : null}
              {onOpenStroke && HANZI_RE.test(detailWord) ? (
                <button
                  type="button"
                  className="vcl-sheet-btn"
                  onClick={() => onOpenStroke(detailWord, detail.pinyin || "")}
                >
                  <FontAwesomeIcon icon={faPenNib} /> <span>{t("widgets.stroke")}</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
