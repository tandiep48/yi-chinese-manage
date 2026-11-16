"use client";

// components/page/learner/translation/TranslationPanel.tsx
// The lesson's translation sentences as a flashcard drill, ported from the card half
// of Learning/web_app/static/translation/translation.js (renderCards / renderCard /
// toggleAnswer / prevCard / nextCard / shuffleCards). One sentence at a time: its
// meaning in the UI language, an input for the Chinese that highlights as soon as it
// matches, a reveal toggle, and Prev / Shuffle / Next. Given a `finish` action, Next
// on the last sentence becomes that action (the lesson flow's "Next lesson") instead
// of dead-ending.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShuffle } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { shuffle } from "@/lib/lessons/vocabTrainer";
import type { TranslationRow } from "@/lib/types/lesson";
import "./translation-panel.css";

// What Next does once the learner is on the last sentence.
export interface TranslationFinish {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function TranslationPanel({
  rows,
  loading,
  error,
  finish,
}: {
  rows: TranslationRow[];
  loading: boolean;
  error: string | null;
  finish?: TranslationFinish;
}) {
  const { t } = useT();

  if (loading) return <div className="lesson-learner-empty">{t("translation.loading")}</div>;
  if (error) return <div className="lesson-learner-empty">{t("translation.failed_load")}</div>;
  if (rows.length === 0)
    return <div className="lesson-learner-empty">{t("translation.empty")}</div>;

  // Keyed on the loaded deck so navigating to another lesson remounts the drill —
  // resetting the shuffled order and the card index with it.
  return <TranslationCards key={`${rows.length}:${rows[0].cn}`} rows={rows} finish={finish} />;
}

function TranslationCards({ rows, finish }: { rows: TranslationRow[]; finish?: TranslationFinish }) {
  const { t, lang } = useT();
  // The drill owns its own order so Shuffle can reorder it without touching the fetch.
  const [deck, setDeck] = useState<TranslationRow[]>(rows);
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [revealed, setRevealed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const row = deck[index];
  const total = deck.length;
  const meaning = useMemo(() => {
    if (!row) return "";
    return (lang === "vi" ? row.vn : row.en) || row.en || row.vn || "";
  }, [row, lang]);
  const onLast = index === total - 1;
  const matched = !!row && typed.trim() === (row.cn || "").trim();

  // Every card starts blank, hidden and focused (renderCard).
  const goTo = useCallback((target: number) => {
    setIndex(target);
    setTyped("");
    setRevealed(false);
    inputRef.current?.focus();
  }, []);

  const prev = useCallback(() => {
    if (index > 0) goTo(index - 1);
  }, [index, goTo]);

  const next = useCallback(() => {
    if (index < total - 1) goTo(index + 1);
  }, [index, total, goTo]);

  // Fisher-Yates over the loaded rows, then back to card 1 (shuffleCards).
  const reshuffle = useCallback(() => {
    if (total <= 1) return;
    setDeck((d) => shuffle(d));
    goTo(0);
  }, [total, goTo]);

  // Arrow keys flip between cards — but not while the learner is typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.activeElement === inputRef.current) return;
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [prev, next]);

  if (!row) return null;

  return (
    <div className="translation-card-view">
      <div className="translation-card-topbar">
        <span className="translation-counter">{`${index + 1} / ${total}`}</span>
      </div>
      <div className="translation-progress-bar">
        <div
          className="translation-progress-fill"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      <div className="translation-card">
        <div className="translation-meaning">{meaning}</div>
        <input
          ref={inputRef}
          type="text"
          lang="zh-CN"
          className={`translation-input${matched ? " success-highlight" : ""}`}
          placeholder={t("translation.input_placeholder")}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
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

      <div className="translation-nav-row">
        <button
          type="button"
          className="btn translation-nav-btn"
          disabled={index === 0}
          onClick={prev}
        >
          &larr; {t("reading.prev")}
        </button>
        <button type="button" className="btn translation-nav-btn" onClick={reshuffle}>
          <FontAwesomeIcon icon={faShuffle} /> {t("vocab_learning.shuffle")}
        </button>
        <button
          type="button"
          className="btn primary translation-nav-btn"
          disabled={onLast ? !finish || finish.disabled : false}
          onClick={onLast && finish ? finish.onClick : next}
        >
          {onLast && finish ? finish.label : t("reading.next")} &rarr;
        </button>
      </div>
    </div>
  );
}
