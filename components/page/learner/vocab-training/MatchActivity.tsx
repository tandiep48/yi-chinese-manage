"use client";

// components/page/learner/vocab-training/MatchActivity.tsx
// A listening- or reading-match group of the batch vocab trainer: two columns of the
// same words, the left column the scored anchor (audio for listening, the character
// for reading), the right column their meanings, shuffled. Ported from
// renderMatchActivity() in Learning/web_app/static/vocab/vocab_trainer_core.js
// (solo / manual mode — no competition auto-advance, no keyboard shortcuts). The
// first pairing attempt per left item is recorded once, on solve, with the mistake
// count; wrong pairs flash and reset, and the board must be fully matched to continue.

import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faVolumeHigh } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { vocabAudioUrl } from "@/lib/audio";
import { now } from "@/lib/clock";
import { pickMeaning } from "@/lib/lessons/meaning";
import { MATCH_CONFIG, shuffle, type Activity, type TrainerWord } from "@/lib/lessons/vocabTrainer";
import { useTrainerActionSlot } from "@/components/page/learner/trainer/TrainerShell";

export function MatchActivity({
  activity,
  onRecord,
  onAdvance,
}: {
  activity: Activity;
  onRecord: (
    row: TrainerWord,
    type: string,
    answer: string,
    isCorrect: boolean,
    responseMs: number,
    wrongAttempts: number
  ) => void;
  onAdvance: () => void;
}) {
  const { t, lang } = useT();
  const slot = useTrainerActionSlot();
  const matchCfg = MATCH_CONFIG[activity.type as "listen" | "reading"];
  const words = activity.words;

  // Right column order is fixed for the life of the board.
  const rightWords = useMemo(() => shuffle(words), [words]);

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [solved, setSolved] = useState<Set<string>>(() => new Set());
  const [wrong, setWrong] = useState<Set<string>>(() => new Set());

  const startRef = useRef(now());
  const firstSelectedAt = useRef<Record<string, number>>({});
  const wrongAttempts = useRef<Record<string, number>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const total = words.length;
  const allSolved = solved.size === total;

  function playWordAudio(audioKey: string) {
    if (!audioKey) return;
    try {
      if (!audioRef.current) audioRef.current = new Audio();
      audioRef.current.src = vocabAudioUrl(audioKey);
      audioRef.current.currentTime = 0;
      void audioRef.current.play().catch(() => {});
    } catch {
      /* ignore playback errors */
    }
  }

  function evaluate(leftWord: string, rightWord: string) {
    const row = words.find((w) => w.word === leftWord) ?? words[0];
    if (leftWord === rightWord) {
      const startedAt = firstSelectedAt.current[leftWord] ?? startRef.current;
      onRecord(
        row,
        matchCfg.db,
        pickMeaning(row, lang),
        true,
        now() - startedAt,
        wrongAttempts.current[leftWord] || 0
      );
      setSolved((prev) => new Set(prev).add(leftWord));
      setSelectedLeft(null);
      setSelectedRight(null);
    } else {
      wrongAttempts.current[leftWord] = (wrongAttempts.current[leftWord] || 0) + 1;
      const flashKeys = new Set([`left:${leftWord}`, `right:${rightWord}`]);
      setWrong(flashKeys);
      setSelectedLeft(null);
      setSelectedRight(null);
      window.setTimeout(() => setWrong(new Set()), 700);
    }
  }

  function selectLeft(word: string) {
    if (solved.has(word)) return;
    if (matchCfg.leftKind === "audio") {
      const row = words.find((w) => w.word === word);
      if (row) playWordAudio(row.audio_key);
    }
    if (!firstSelectedAt.current[word]) firstSelectedAt.current[word] = now();
    if (selectedLeft === word) {
      setSelectedLeft(null);
      return;
    }
    setSelectedLeft(word);
    if (selectedRight) evaluate(word, selectedRight);
  }

  function selectRight(word: string) {
    if (solved.has(word)) return;
    if (selectedRight === word) {
      setSelectedRight(null);
      return;
    }
    setSelectedRight(word);
    if (selectedLeft) evaluate(selectedLeft, word);
  }

  function itemClass(side: "left" | "right", word: string, extra = "") {
    const isSolved = solved.has(word);
    const isSelected = side === "left" ? selectedLeft === word : selectedRight === word;
    const isWrong = wrong.has(`${side}:${word}`);
    return [
      "bt-match-item",
      extra,
      isSolved ? "solved" : "",
      isSelected ? "selected" : "",
      isWrong ? "wrong" : "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  const actionButton = (
    <button
      type="button"
      className="btn primary bt-primary-action"
      disabled={!allSolved}
      onClick={onAdvance}
    >
      {t("lesson.continue")}
    </button>
  );

  return (
    <div className="batch-activity">
      <div className="bt-match">
        <div className="instruction">{t(`vocab_trainer.${matchCfg.instruction}`)}</div>
        <div className="bt-match-board bt-match-board-rows">
          <div className="bt-match-col">
            {words.map((row) => (
              <button
                key={`left-${row.word}`}
                type="button"
                className={itemClass("left", row.word, matchCfg.leftKind === "audio" ? "bt-match-audio" : "")}
                style={matchCfg.leftKind === "word" ? { fontSize: "30px" } : undefined}
                onClick={() => selectLeft(row.word)}
                aria-label={matchCfg.leftKind === "audio" ? t("lesson.play_audio") : undefined}
              >
                {matchCfg.leftKind === "audio" ? (
                  <FontAwesomeIcon icon={faVolumeHigh} aria-hidden />
                ) : (
                  row.word
                )}
              </button>
            ))}
          </div>
          <div className="bt-match-col">
            {rightWords.map((row) => (
              <button
                key={`right-${row.word}`}
                type="button"
                className={itemClass("right", row.word)}
                onClick={() => selectRight(row.word)}
              >
                {pickMeaning(row, lang)}
              </button>
            ))}
          </div>
        </div>
      </div>
      {slot && createPortal(actionButton, slot)}
    </div>
  );
}
