"use client";

// components/page/learner/vocab-learning/FlashcardView.tsx
// The flash-card review screen — one card at a time with a typing self-check, driven
// entirely by the keyboard (see useCardControls): A/D move, S reveals pinyin+meaning,
// W reveals + plays audio, Space shuffles, Q opens stroke order. Pinyin + meaning
// start hidden on each card. Ported from the #screen-learning markup in
// Learning/web_app/static/vocab_learning/vocab_learning.js; speaking practice deferred.

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTableList } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { vocabAudioUrl } from "@/lib/audio";
import { useCardControls } from "@/hooks/shared/useCardControls";
import { CardShortcutLegend } from "@/components/page/learner/shared/CardShortcutLegend";
import type { LessonVocabRow } from "@/lib/types/vocab";

const HANZI_RE = /[一-鿿]/;

export function FlashcardView({
  words,
  onOpenStroke,
  onShowSummary,
  hideSummaryButton = false,
  lockAtEnd = false,
}: {
  words: LessonVocabRow[];
  onOpenStroke: (word: string, pinyin: string) => void;
  onShowSummary: () => void;
  // Milestone chrome (step 2): the host drives advancing with its own Continue
  // button, so the in-card Summary shortcut is hidden and the last card locks
  // instead of turning Next into a Finish that jumps back to the summary.
  hideSummaryButton?: boolean;
  lockAtEnd?: boolean;
}) {
  const { t, lang } = useT();

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

  const { revealed } = useCardControls({
    resetKey: word,
    onPrev: goPrev,
    onNext: goNext,
    onPlayAudio: playAudio,
    onShuffle: shuffle,
    onStroke: () => {
      if (hasHanzi) onOpenStroke(word.cn, word.pinyin || "");
    },
  });

  if (!word) return null;

  return (
    <div id="screen-learning">
      <div className="vl-learning-topbar">
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

      <div className="vl-card">
        <div className="vl-hanzi" lang="zh-CN">
          {word.cn}
        </div>
        <div className="vl-pinyin">{revealed ? word.pinyin || "" : ""}</div>
        <div className="vl-meaning">{revealed ? meaning : ""}</div>

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

      <CardShortcutLegend shuffle stroke={hasHanzi} />
    </div>
  );
}
