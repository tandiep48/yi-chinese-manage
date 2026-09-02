"use client";

// components/page/learner/vocab-learning/FlashcardView.tsx
// The flash-card review screen — one card at a time with hanzi / pinyin /
// meaning, a typing self-check, audio play/pause, per-card stroke order, and
// prev / next / shuffle / summary navigation with a progress bar. Ported from
// the #screen-learning markup + renderWord()/nextWord()/prevWord()/
// shuffleLearningWords() in Learning/web_app/static/vocab_learning/vocab_learning.js.
// Speaking practice (mic + ASR) from the original is deferred.

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faPause,
  faPenNib,
  faTableList,
  faShuffle,
} from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { vocabAudioUrl } from "@/lib/audio";
import type { LessonVocabRow } from "@/lib/types/types";

const HANZI_RE = /[一-鿿]/;

export function FlashcardView({
  words,
  onOpenStroke,
  onShowSummary,
}: {
  words: LessonVocabRow[];
  onOpenStroke: (word: string, pinyin: string) => void;
  onShowSummary: () => void;
}) {
  const { t, lang } = useT();

  const [order, setOrder] = useState<LessonVocabRow[]>(words);
  const [index, setIndex] = useState(0);
  const [typing, setTyping] = useState("");
  const [success, setSuccess] = useState(false);
  const [playing, setPlaying] = useState(false);
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
  const isLast = index === total - 1;

  // Play the current card's audio when it changes. Playback state is driven by
  // the <audio> element's own events, so nothing sets state synchronously here.
  useEffect(() => {
    audioRef.current?.pause();
    const key = order[index]?.audio_key;
    if (!key) {
      audioRef.current = null;
      return;
    }
    const audio = new Audio(vocabAudioUrl(key));
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
  }, [order, index]);

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

  // Keyboard shortcuts: ←/→ navigate, Space replays audio (ignored while typing).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }
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

  if (!word) return null;

  return (
    <div id="screen-learning">
      <div className="vl-learning-topbar">
        <span className="vl-counter">
          {index + 1} / {total}
        </span>
      </div>

      <div className="vl-progress-bar vl-card-progress">
        <div className="vl-progress-fill" style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>

      <div className="vl-card">
        <div className="vl-hanzi" lang="zh-CN">
          {word.cn}
        </div>
        <div className="vl-pinyin">{word.pinyin || ""}</div>
        <div className="vl-meaning">{meaning}</div>

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

        <div className="vl-card-controls">
          <button type="button" className={`vl-audio-btn${playing ? " playing" : ""}`} onClick={playAudio}>
            <FontAwesomeIcon icon={playing ? faPause : faPlay} />
            <span>{t("reading.play_audio")}</span>
          </button>
          {HANZI_RE.test(word.cn) && (
            <button
              type="button"
              className="vl-stroke-btn"
              onClick={() => onOpenStroke(word.cn, word.pinyin || "")}
            >
              <FontAwesomeIcon icon={faPenNib} />
              <span>{t("vocab_learning.stroke_order")}</span>
            </button>
          )}
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
        <button type="button" className="vl-train-btn" onClick={shuffle} title={t("vocab_learning.shuffle_words_title")}>
          <FontAwesomeIcon icon={faShuffle} />
          <span>{t("vocab_learning.shuffle")}</span>
        </button>
        <button type="button" className="vl-nav-btn" onClick={goNext}>
          {isLast ? t("vocab_learning.finish") : t("reading.next")} &rarr;
        </button>
      </div>

      <p className="vl-keyboard-tip">{t("vocab_learning.keyboard_tip")}</p>
    </div>
  );
}
