"use client";

// components/page/learner/lesson/LessonCardStudy.tsx
// "Learn This Lesson" — the per-line lesson-card viewer for a passage, one line at a
// time with a typing self-check. Keyboard-driven like the vocab FlashcardView (see
// useCardControls): A/D move, S shows/hides pinyin+meaning, W reveals + plays audio.
// Shuffle and stroke order don't apply to sentences, so Space/Q are omitted. Pinyin +
// meaning start hidden on each line. Ported from the #screen-lesson-card markup in
// Learning/web_app/static/reading/reading.js; speaking practice deferred.

import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faEye,
  faEyeSlash,
  faTableList,
  faVolumeHigh,
} from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { lessonAudioUrl } from "@/lib/audio";
import { typingCharClasses } from "@/lib/lessons/typingGlow";
import { useCardControls } from "@/hooks/shared/useCardControls";
import { CardShortcutLegend } from "@/components/page/learner/shared/CardShortcutLegend";
import type { LessonPassageLine } from "@/lib/types/lesson";

export function LessonCardStudy({
  lines,
  folder,
  onShowSummary,
  hideSummaryButton = false,
  hideBackSummary = false,
  lockAtEnd = false,
  variant = "default",
}: {
  lines: LessonPassageLine[];
  // Lesson-audio folder for the passage (HSK level or book code).
  folder: string;
  onShowSummary: () => void;
  // Milestone chrome (step 5): the host drives advancing with its own Continue
  // button, so the in-card Summary controls are hidden and the last line locks
  // instead of turning Next into a Finish that jumps back to the summary.
  hideSummaryButton?: boolean;
  hideBackSummary?: boolean;
  lockAtEnd?: boolean;
  // "milestone" is the lesson flow's layout, shared with the vocab flashcard step: line
  // pill + Pinyin / Meaning toggles, a progress row, and a mint card with in-card
  // audio and previous / next arrows.
  variant?: "default" | "milestone";
}) {
  const { t, lang } = useT();
  const milestone = variant === "milestone";

  const [index, setIndex] = useState(0);
  const [typing, setTyping] = useState("");
  const [success, setSuccess] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Clear the typing box whenever the card changes (render-phase reset).
  const [prevIndex, setPrevIndex] = useState(index);
  if (index !== prevIndex) {
    setPrevIndex(index);
    setTyping("");
    setSuccess(false);
  }

  const total = lines.length;
  const line = lines[index];
  const content = line?.content ?? "";
  // Colour the sentence per character as the learner types, so a wrong character
  // shows up at once — the same feedback the lesson trainer's typing task gives.
  const target = useMemo(() => [...content], [content]);
  const charClasses = useMemo(() => typingCharClasses(target, typing), [target, typing]);
  const meaning = useMemo(() => {
    if (!line) return "";
    const tr = line.translations;
    return (lang === "vi" ? tr.vi : tr.en) || tr.en || tr.vi || "";
  }, [line, lang]);

  // Play the current line's audio when it changes.
  useEffect(() => {
    audioRef.current?.pause();
    const key = lines[index]?.audio_key;
    if (!key) {
      audioRef.current = null;
      return;
    }
    const audio = new Audio(lessonAudioUrl(folder, key));
    audioRef.current = audio;
    audio.play()?.catch(() => {});
    return () => {
      audio.pause();
    };
  }, [lines, index, folder]);

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

  function onTypingChange(value: string) {
    setTyping(value);
    if (value.trim() === content) {
      setSuccess(true);
      playAudio();
    } else {
      setSuccess(false);
    }
  }

  // Grow the field to fit its content so a long sentence wraps onto new lines
  // instead of scrolling out of a one-line box — the whole typed answer stays
  // readable, which matters most on a narrow phone.
  function autoGrow(el: HTMLTextAreaElement | null) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  useEffect(() => {
    autoGrow(inputRef.current);
  }, [typing]);

  const { revealed, reveal, toggleReveal } = useCardControls({
    resetKey: index,
    onPrev: goPrev,
    onNext: goNext,
    onPlayAudio: playAudio,
  });

  // The milestone layout's eye toggles show or hide one line each, on top of the
  // keyboard's show-both state. A flip lasts until that state or the line changes.
  const [flipped, setFlipped] = useState({ pinyin: false, meaning: false });
  const flipKey = `${index}:${revealed}`;
  const [prevFlipKey, setPrevFlipKey] = useState(flipKey);
  if (flipKey !== prevFlipKey) {
    setPrevFlipKey(flipKey);
    setFlipped({ pinyin: false, meaning: false });
  }
  const showPinyin = revealed !== flipped.pinyin;
  const showMeaning = revealed !== flipped.meaning;

  if (!line) return null;

  const progressPct = Math.round(((index + 1) / total) * 100);
  const progressFill = (
    <div className="vl-progress-bar vl-card-progress">
      <div className="vl-progress-fill" style={{ width: `${((index + 1) / total) * 100}%` }} />
    </div>
  );

  return (
    <div
      id="screen-learning"
      className={milestone ? "vl-milestone" : "lesson-line-learning"}
    >
      <div className="vl-learning-topbar">
        {milestone ? (
          <>
            <span className="vl-counter-pill">
              {t("milestone.line_counter", {
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
          <>
            {!hideBackSummary && (
              <button type="button" className="btn secondary" onClick={onShowSummary}>
                &larr; {t("reading.summary")}
              </button>
            )}
            <span className="vl-counter">
              {index + 1} / {total}
            </span>
          </>
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
          <span className="vl-progress-label">{t("milestone.line_progress")}</span>
          {progressFill}
          <span className="vl-progress-value">
            {index + 1}/{total} ({progressPct}%)
          </span>
        </div>
      ) : (
        progressFill
      )}

      <div className="vl-card lesson-line-card">
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
            </div>
          </>
        )}
        <div className="vl-hanzi lesson-line-hanzi" lang="zh-CN">
          {typing
            ? target.map((ch, i) => (
                <span key={i} className={`typing-char ${charClasses[i]}`}>
                  {ch}
                </span>
              ))
            : content}
        </div>
        <div className="vl-pinyin">{showPinyin ? line.pinyin || "" : ""}</div>
        <div className="vl-meaning">{showMeaning ? meaning : ""}</div>

        <div className="vl-typing-container">
          <textarea
            ref={inputRef}
            lang="zh-CN"
            className={`vl-input${success ? " success-highlight" : ""}`}
            rows={1}
            placeholder={t("lesson.typing_placeholder")}
            value={typing}
            onChange={(e) => onTypingChange(e.target.value)}
            onKeyDown={(e) => {
              // Enter never inserts a newline — the sentence match is exact, so a
              // stray newline would only ever break it. Matches the one-line box
              // this textarea replaced.
              if (e.key === "Enter") e.preventDefault();
            }}
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
        />
      )}
    </div>
  );
}
