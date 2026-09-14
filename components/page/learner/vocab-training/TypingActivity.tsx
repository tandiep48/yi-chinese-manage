"use client";

// components/page/learner/vocab-training/TypingActivity.tsx
// One typing group of the batch vocab trainer: each word shows its character and the
// learner types it back. Ported from renderTypingActivity() in
// Learning/web_app/static/vocab/vocab_trainer_core.js. A live reveal (pinyin +
// meaning + audio) fires the moment a word is typed correctly.
//
// Two modes, like the legacy core:
//   - solo (default): Check scores the whole group, and a fully-correct group
//     auto-advances.
//   - autoAdvance (Learn Together): no Check button — each word locks in and scores
//     as soon as it is typed correctly, the group advances once every word is done,
//     and a Skip button reveals whatever is left (scored wrong) before Next.

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { vocabAudioUrl } from "@/lib/audio";
import { now } from "@/lib/clock";
import { pickMeaning } from "@/lib/lessons/meaning";
import { useTrainerActionSlot } from "@/components/page/learner/trainer/TrainerShell";
import type { Activity, TrainerWord } from "@/lib/lessons/vocabTrainer";

type RowStatus = "none" | "correct" | "incorrect";

// How long the board lingers after the last word is solved in auto-advance mode.
const AUTO_ADVANCE_DELAY_MS = 350;

export function TypingActivity({
  activity,
  onRecord,
  onAdvance,
  autoAdvance = false,
}: {
  activity: Activity;
  onRecord: (
    row: TrainerWord,
    type: string,
    answer: string,
    isCorrect: boolean,
    responseMs: number
  ) => void;
  onAdvance: () => void;
  // Learn Together plays without a Check button; see the file header.
  autoAdvance?: boolean;
}) {
  const { t, lang } = useT();
  const slot = useTrainerActionSlot();
  const words = activity.words;

  const [values, setValues] = useState<string[]>(() => words.map(() => ""));
  const [status, setStatus] = useState<RowStatus[]>(() => words.map(() => "none"));
  const [checked, setChecked] = useState(false);
  // Auto-advance mode: words lock one by one as they are solved or revealed.
  const [locked, setLocked] = useState<boolean[]>(() => words.map(() => false));
  const [revealed, setRevealed] = useState(false);

  const startRef = useRef(now());
  const completedAtRef = useRef<(number | null)[]>(words.map(() => null));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Focus the first field on mount.
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Auto-advance mode: once every word has been typed correctly, the group moves on by
  // itself (there is no Continue button to click). A skipped group does not — it waits
  // for the learner to read the revealed answers and press Next.
  useEffect(() => {
    if (!autoAdvance || revealed || !locked.length || !locked.every(Boolean)) return;
    const id = window.setTimeout(onAdvance, AUTO_ADVANCE_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [autoAdvance, revealed, locked, onAdvance]);

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

  function scoreGroup() {
    if (checked) return;
    words.forEach((row, i) => {
      const answer = values[i].trim();
      const isCorrect = answer === row.word;
      const completedAt = completedAtRef.current[i] ?? now();
      onRecord(row, "typing", answer, isCorrect, completedAt - startRef.current);
    });
    setStatus(words.map((row, i) => (values[i].trim() === row.word ? "correct" : "incorrect")));
    setChecked(true);
  }

  // Auto-advance mode: score the word on its own and lock its field.
  function lockWord(idx: number, value: string, isCorrect: boolean) {
    const row = words[idx];
    const completedAt = completedAtRef.current[idx] ?? now();
    onRecord(row, "typing", value, isCorrect, completedAt - startRef.current);
    setLocked((prev) => {
      const next = [...prev];
      next[idx] = true;
      return next;
    });
  }

  function handleChange(idx: number, value: string) {
    if (checked || locked[idx]) return;
    setValues((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
    const row = words[idx];
    if (value.trim() === (row.word || "")) {
      if (completedAtRef.current[idx] == null) {
        completedAtRef.current[idx] = now();
        playWordAudio(row.audio_key);
      }
      setStatus((prev) => {
        const next = [...prev];
        next[idx] = "correct";
        return next;
      });
      if (autoAdvance) {
        lockWord(idx, value.trim(), true);
        return;
      }
      // Auto-finish the group once every word is correct.
      const allCorrect = words.every((w, i) => (i === idx ? value.trim() : values[i].trim()) === w.word);
      if (allCorrect) {
        scoreGroup();
        window.setTimeout(onAdvance, 600);
      }
    } else {
      completedAtRef.current[idx] = null;
      setStatus((prev) => {
        const next = [...prev];
        if (next[idx] === "correct") next[idx] = "none";
        return next;
      });
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    e.stopPropagation();
    if (idx < words.length - 1) inputRefs.current[idx + 1]?.focus();
    else if (!autoAdvance) scoreGroup();
  }

  // Skip (auto-advance mode): reveal every word still unsolved, scored as incorrect,
  // so the learner can read the answers; the button then becomes Next.
  function revealUnsolved() {
    setRevealed(true);
    setStatus((prev) => prev.map((s, i) => (locked[i] ? s : "incorrect")));
    words.forEach((row, i) => {
      if (locked[i]) return;
      onRecord(row, "typing", values[i].trim(), false, now() - startRef.current);
    });
    setLocked(words.map(() => true));
  }

  const primaryLabel = autoAdvance
    ? revealed
      ? t("lesson.next")
      : t("vocab_trainer.skip")
    : checked
      ? t("lesson.continue")
      : t("vocab_trainer.check");

  const onPrimary = () => {
    if (autoAdvance) {
      if (revealed) onAdvance();
      else revealUnsolved();
      return;
    }
    if (checked) onAdvance();
    else scoreGroup();
  };

  // Rebuilt every render on purpose: the handler closes over the per-word `locked`
  // state, so a memoized button would skip-reveal words that are already solved.
  const actionButton = (
    <button type="button" className="btn primary bt-primary-action" onClick={onPrimary}>
      {primaryLabel}
    </button>
  );

  return (
    <div className="batch-activity">
      <div className="bt-typing">
        <div className="instruction">{t("vocab_trainer.instruction_type_recall")}</div>
        <div className="bt-type-list">
          {words.map((row, idx) => (
            <div key={`${row.word}-${idx}`} className={`bt-type-row ${status[idx]}`}>
              <div className="bt-type-prompt">
                <span className="bt-hanzi" style={{ fontSize: "30px" }}>
                  {row.word}
                </span>
              </div>
              <input
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                className="bt-type-input"
                lang="zh-CN"
                autoComplete="off"
                inputMode="text"
                style={{ fontSize: "30px" }}
                value={values[idx]}
                disabled={checked || locked[idx]}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={(e) => e.preventDefault()}
                onDrop={(e) => e.preventDefault()}
              />
              <div className="bt-type-result" aria-live="polite">
                {status[idx] !== "none" && (
                  <span className={status[idx] === "correct" ? "bt-ok" : "bt-bad"}>
                    <FontAwesomeIcon icon={status[idx] === "correct" ? faCheck : faXmark} />{" "}
                    {row.pinyin} - {pickMeaning(row, lang)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {slot && createPortal(actionButton, slot)}
    </div>
  );
}
