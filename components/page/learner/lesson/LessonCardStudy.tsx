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
import { faTableList } from "@fortawesome/free-solid-svg-icons";
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
}) {
  const { t, lang } = useT();

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

  if (!line) return null;

  return (
    <div id="screen-learning" className="lesson-line-learning">
      <div className="vl-learning-topbar">
        {!hideBackSummary && (
          <button type="button" className="btn secondary" onClick={onShowSummary}>
            &larr; {t("reading.summary")}
          </button>
        )}
        <span className="vl-counter">
          {index + 1} / {total}
        </span>
        {!hideSummaryButton && (
          <button type="button" className="vl-train-btn" onClick={onShowSummary}>
            <FontAwesomeIcon icon={faTableList} />
            <span>{t("reading.summary")}</span>
          </button>
        )}
      </div>

      <div className="vl-progress-bar vl-card-progress">
        <div className="vl-progress-fill" style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>

      <div className="vl-card lesson-line-card">
        <div className="vl-hanzi lesson-line-hanzi" lang="zh-CN">
          {typing
            ? target.map((ch, i) => (
                <span key={i} className={`typing-char ${charClasses[i]}`}>
                  {ch}
                </span>
              ))
            : content}
        </div>
        <div className="vl-pinyin">{revealed ? line.pinyin || "" : ""}</div>
        <div className="vl-meaning">{revealed ? meaning : ""}</div>

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

      <CardShortcutLegend
        onPrev={goPrev}
        onNext={goNext}
        onAudioReveal={() => {
          reveal();
          playAudio();
        }}
        onReveal={toggleReveal}
      />
    </div>
  );
}
