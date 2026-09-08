"use client";

// components/page/learner/lesson/LessonCardStudy.tsx
// "Learn This Lesson" — the per-line lesson-card viewer for a passage. One line at a
// time with hanzi / pinyin / meaning, a type-along self-check, audio play/pause and
// prev / next / summary navigation with a progress bar. Ported from the
// #screen-lesson-card markup + renderLessonCard()/nextLessonCard()/prevLessonCard()
// in Learning/web_app/static/reading/reading.js. Speaking practice (mic + ASR) from
// the original is deferred, matching the vocab FlashcardView.

import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause, faTableList } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { lessonAudioUrl } from "@/lib/audio";
import type { LessonPassageLine } from "@/lib/types/types";

export function LessonCardStudy({
  lines,
  folder,
  onShowSummary,
}: {
  lines: LessonPassageLine[];
  // Lesson-audio folder for the passage (HSK level or book code).
  folder: string;
  onShowSummary: () => void;
}) {
  const { t, lang } = useT();

  const [index, setIndex] = useState(0);
  const [typing, setTyping] = useState("");
  const [success, setSuccess] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
  const meaning = useMemo(() => {
    if (!line) return "";
    const tr = line.translations;
    return (lang === "vi" ? tr.vi : tr.en) || tr.en || tr.vi || "";
  }, [line, lang]);
  const isLast = index === total - 1;

  // Play the current line's audio when it changes. Playback state is driven by the
  // <audio> element's own events, so nothing sets state synchronously here.
  useEffect(() => {
    audioRef.current?.pause();
    const key = lines[index]?.audio_key;
    if (!key) {
      audioRef.current = null;
      return;
    }
    const audio = new Audio(lessonAudioUrl(folder, key));
    audioRef.current = audio;
    audio.onplay = () => setPlaying(true);
    audio.onpause = () => setPlaying(false);
    audio.onended = () => setPlaying(false);
    audio.onerror = () => setPlaying(false);
    audio.play()?.catch(() => setPlaying(false));
    return () => {
      audio.pause();
      audio.onplay = audio.onpause = audio.onended = audio.onerror = null;
    };
  }, [lines, index, folder]);

  function playAudio() {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    audio.currentTime = 0;
    audio.play()?.catch(() => setPlaying(false));
  }

  function goPrev() {
    if (index > 0) setIndex((i) => i - 1);
  }

  function goNext() {
    if (index < total - 1) setIndex((i) => i + 1);
    else onShowSummary();
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

  // Keyboard shortcuts: ←/→ navigate, Space replays audio (ignored while typing).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === " ") {
        e.preventDefault();
        playAudio();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, total]);

  if (!line) return null;

  return (
    <div id="screen-learning" className="lesson-line-learning">
      <div className="vl-learning-topbar">
        <button type="button" className="btn secondary" onClick={onShowSummary}>
          &larr; {t("reading.summary")}
        </button>
        <span className="vl-counter">
          {index + 1} / {total}
        </span>
      </div>

      <div className="vl-progress-bar vl-card-progress">
        <div className="vl-progress-fill" style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>

      <div className="vl-card lesson-line-card">
        <div className="vl-hanzi lesson-line-hanzi" lang="zh-CN">
          {content}
        </div>
        <div className="vl-pinyin">{line.pinyin || ""}</div>
        <div className="vl-meaning">{meaning}</div>

        <div className="vl-typing-container">
          <input
            type="text"
            lang="zh-CN"
            className={`vl-input${success ? " success-highlight" : ""}`}
            placeholder={t("lesson.typing_placeholder")}
            value={typing}
            onChange={(e) => onTypingChange(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="vl-card-controls">
          <button type="button" className={`vl-audio-btn${playing ? " playing" : ""}`} onClick={playAudio}>
            <FontAwesomeIcon icon={playing ? faPause : faPlay} />
            <span>{t("reading.play_audio")}</span>
          </button>
        </div>
      </div>

      <div className="vl-nav-row">
        <button type="button" className="vl-nav-btn" onClick={goPrev} disabled={index === 0}>
          &larr; {t("reading.prev")}
        </button>
        <button type="button" className="vl-train-btn" onClick={onShowSummary}>
          <FontAwesomeIcon icon={faTableList} />
          <span>{t("reading.summary")}</span>
        </button>
        <button type="button" className="vl-nav-btn" onClick={goNext}>
          {isLast ? t("grammar.finish") : t("reading.next")} &rarr;
        </button>
      </div>

      <p className="vl-keyboard-tip">{t("vocab_learning.keyboard_tip")}</p>
    </div>
  );
}
