"use client";

// components/page/learner/vocab-learning/FlashcardView.tsx
// The flash-card review screen — one card at a time with a typing self-check, driven
// entirely by the keyboard (see useCardControls): A/D move, S reveals pinyin+meaning,
// W reveals + plays audio, Space shuffles, Q opens stroke order. Pinyin + meaning
// start hidden on each card. Ported from the #screen-learning markup in
// Learning/web_app/static/vocab_learning/vocab_learning.js; speaking practice deferred.
//
// variant="milestone" is the lesson flow's layout of the same card: a word-count
// pill, separate Pinyin / Meaning eye toggles, a labelled progress bar and a mint
// card carrying its own shuffle / audio / stroke tools and previous / next arrows
// (flashcards.css, `.vl-milestone`). The keys behave the same in both.

import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faEye,
  faEyeSlash,
  faPencil,
  faShuffle,
  faTableList,
  faVolumeHigh,
} from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { vocabAudioUrl } from "@/lib/audio";
import { typingCharClasses } from "@/lib/lessons/typingGlow";
import { useCardControls } from "@/hooks/shared/useCardControls";
import { CardShortcutLegend } from "@/components/page/learner/shared/CardShortcutLegend";
import type { LessonVocabRow } from "@/lib/types/vocab";

const HANZI_RE = /[一-鿿]/;

export type FlashcardVariant = "default" | "milestone";

export function FlashcardView({
  words,
  onOpenStroke,
  onShowSummary,
  hideSummaryButton = false,
  lockAtEnd = false,
  variant = "default",
}: {
  words: LessonVocabRow[];
  onOpenStroke: (word: string, pinyin: string) => void;
  onShowSummary: () => void;
  // Milestone chrome (step 2): the host drives advancing with its own Continue
  // button, so the in-card Summary shortcut is hidden and the last card locks
  // instead of turning Next into a Finish that jumps back to the summary.
  hideSummaryButton?: boolean;
  lockAtEnd?: boolean;
  variant?: FlashcardVariant;
}) {
  const { t, lang } = useT();
  const milestone = variant === "milestone";

  const [order, setOrder] = useState<LessonVocabRow[]>(words);
  const [index, setIndex] = useState(0);
  const [typing, setTyping] = useState("");
  const [success, setSuccess] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset the working order when a new word set arrives (render-phase reset).
  const [prevWords, setPrevWords] = useState(words);
  if (words !== prevWords) {
    setPrevWords(words);
    setOrder(words);
    setIndex(0);
    setTyping("");
    setSuccess(false);
  }

  // Clear the typing box whenever the card changes (render-phase reset).
  const [prevIndex, setPrevIndex] = useState(index);
  if (index !== prevIndex) {
    setPrevIndex(index);
    setTyping("");
    setSuccess(false);
  }

  const total = order.length;
  const word = order[index];
  const meaning = (lang === "vi" ? word?.meaning_vn : word?.meaning_en) || word?.meaning_en || word?.meaning_vn || "";
  const hasHanzi = !!word && HANZI_RE.test(word.cn);

  // Colour the word per character as the learner types, so a wrong character shows
  // up the moment it is typed — the same feedback the lesson trainer gives.
  const target = useMemo(() => [...(word?.cn ?? "")], [word]);
  const charClasses = useMemo(() => typingCharClasses(target, typing), [target, typing]);

  // Play the current card's audio when it changes.
  useEffect(() => {
    audioRef.current?.pause();
    const key = order[index]?.audio_key;
    if (!key) {
      audioRef.current = null;
      return;
    }
    const audio = new Audio(vocabAudioUrl(key));
    audioRef.current = audio;
    audio.play()?.catch(() => {});
    return () => {
      audio.pause();
    };
  }, [order, index]);

  function playAudio() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play()?.catch(() => {});
  }

  function goPrev() {
    if (index > 0) setIndex((i) => i - 1);
  }

  function goNext() {
    if (index < total - 1) setIndex((i) => i + 1);
    else if (!lockAtEnd) onShowSummary();
  }

  function shuffle() {
    if (total <= 1) return;
    setOrder((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      return next;
    });
    setIndex(0);
  }

  function onTypingChange(value: string) {
    setTyping(value);
    if (value.trim() === (word?.cn ?? "")) {
      setSuccess(true);
      playAudio();
    } else {
      setSuccess(false);
    }
  }

  const openStroke = () => {
    if (hasHanzi) onOpenStroke(word.cn, word.pinyin || "");
  };

  const { revealed, reveal, toggleReveal } = useCardControls({
    resetKey: word,
    onPrev: goPrev,
    onNext: goNext,
    onPlayAudio: playAudio,
    onShuffle: shuffle,
    onStroke: openStroke,
  });

  // The milestone layout's eye toggles show or hide one line each, on top of the
  // keyboard's show-both state. A flip lasts until that state or the card changes.
  const [flipped, setFlipped] = useState({ pinyin: false, meaning: false });
  const flipKey = `${index}:${revealed}`;
  const [prevFlipKey, setPrevFlipKey] = useState(flipKey);
  if (flipKey !== prevFlipKey) {
    setPrevFlipKey(flipKey);
    setFlipped({ pinyin: false, meaning: false });
  }
  const showPinyin = revealed !== flipped.pinyin;
  const showMeaning = revealed !== flipped.meaning;

  if (!word) return null;

  const progressPct = Math.round(((index + 1) / total) * 100);
  const progressFill = (
    <div className="vl-progress-bar vl-card-progress">
      <div className="vl-progress-fill" style={{ width: `${((index + 1) / total) * 100}%` }} />
    </div>
  );

  return (
    <div id="screen-learning" className={milestone ? "vl-milestone" : undefined}>
      <div className="vl-learning-topbar">
        {milestone ? (
          <>
            <span className="vl-counter-pill">
              {t("milestone.word_counter", {
                n: String(index + 1).padStart(2, "0"),
                total: String(total).padStart(2, "0"),
              })}
            </span>
            <div className="vl-toggle-group">
              <button
                type="button"
                className={`vl-toggle${showPinyin ? "" : " is-off"}`}
                aria-pressed={showPinyin}
                onClick={() => setFlipped((f) => ({ ...f, pinyin: !f.pinyin }))}
              >
                <FontAwesomeIcon icon={showPinyin ? faEye : faEyeSlash} aria-hidden />
                <span>{t("dashboard.table_pinyin")}</span>
              </button>
              <button
                type="button"
                className={`vl-toggle${showMeaning ? "" : " is-off"}`}
                aria-pressed={showMeaning}
                onClick={() => setFlipped((f) => ({ ...f, meaning: !f.meaning }))}
              >
                <FontAwesomeIcon icon={showMeaning ? faEye : faEyeSlash} aria-hidden />
                <span>{t("dashboard.table_meaning_vn")}</span>
              </button>
            </div>
          </>
        ) : (
          <span className="vl-counter">
            {index + 1} / {total}
          </span>
        )}
        {!hideSummaryButton && (
          <button type="button" className="vl-train-btn" onClick={onShowSummary}>
            <FontAwesomeIcon icon={faTableList} />
            <span>{t("reading.summary")}</span>
          </button>
        )}
      </div>

      {milestone ? (
        <div className="vl-progress-row">
          <span className="vl-progress-label">{t("milestone.word_progress")}</span>
          {progressFill}
          <span className="vl-progress-value">
            {index + 1}/{total} ({progressPct}%)
          </span>
        </div>
      ) : (
        progressFill
      )}

      <div className="vl-card">
        {milestone && (
          <>
            <button
              type="button"
              className="vl-card-arrow vl-card-arrow-prev"
              aria-label={t("card_shortcuts.prev")}
              title={t("card_shortcuts.prev")}
              disabled={index === 0}
              onClick={goPrev}
            >
              <FontAwesomeIcon icon={faChevronLeft} aria-hidden />
            </button>
            <button
              type="button"
              className="vl-card-arrow vl-card-arrow-next"
              aria-label={t("card_shortcuts.next")}
              title={t("card_shortcuts.next")}
              disabled={lockAtEnd && index === total - 1}
              onClick={goNext}
            >
              <FontAwesomeIcon icon={faChevronRight} aria-hidden />
            </button>
            {total > 1 && (
              <button
                type="button"
                className="vl-tool vl-tool-shuffle"
                aria-label={t("card_shortcuts.shuffle")}
                title={t("card_shortcuts.shuffle")}
                onClick={shuffle}
              >
                <FontAwesomeIcon icon={faShuffle} aria-hidden />
              </button>
            )}
            <div className="vl-tool-stack">
              <button
                type="button"
                className="vl-tool vl-tool-audio"
                aria-label={t("card_shortcuts.audio_reveal")}
                title={t("card_shortcuts.audio_reveal")}
                onClick={() => {
                  reveal();
                  playAudio();
                }}
              >
                <FontAwesomeIcon icon={faVolumeHigh} aria-hidden />
              </button>
              {hasHanzi && (
                <button
                  type="button"
                  className="vl-tool"
                  aria-label={t("card_shortcuts.stroke")}
                  title={t("card_shortcuts.stroke")}
                  onClick={openStroke}
                >
                  <FontAwesomeIcon icon={faPencil} aria-hidden />
                </button>
              )}
            </div>
          </>
        )}
        <div className="vl-hanzi" lang="zh-CN">
          {typing
            ? target.map((ch, i) => (
                <span key={i} className={`typing-char ${charClasses[i]}`}>
                  {ch}
                </span>
              ))
            : word.cn}
        </div>
        <div className="vl-pinyin">{showPinyin ? word.pinyin || "" : ""}</div>
        <div className="vl-meaning">{showMeaning ? meaning : ""}</div>

        <div className="vl-typing-container">
          <input
            type="text"
            lang="zh-CN"
            className={`vl-input${success ? " success-highlight" : ""}`}
            placeholder={t("vocab_learning.typing_placeholder")}
            value={typing}
            onChange={(e) => onTypingChange(e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>

      {/* The milestone card carries these actions as its own buttons; the keys still work. */}
      {!milestone && (
        <CardShortcutLegend
          onPrev={goPrev}
          onNext={goNext}
          onAudioReveal={() => {
            reveal();
            playAudio();
          }}
          onReveal={toggleReveal}
          onShuffle={shuffle}
          onStroke={hasHanzi ? openStroke : undefined}
        />
      )}
    </div>
  );
}
