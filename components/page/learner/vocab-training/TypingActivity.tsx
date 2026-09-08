"use client";

// components/page/learner/vocab-training/TypingActivity.tsx
// One typing group of the batch vocab trainer: each word shows its character and the
// learner types it back. Ported from renderTypingActivity() in
// Learning/web_app/static/vocab/vocab_trainer_core.js (solo / manual mode only —
// competition auto-advance is not used here). A live reveal (pinyin + meaning +
// audio) fires the moment a word is typed correctly; Check scores the whole group,
// and a fully-correct group auto-advances.

import { useEffect, useMemo, useRef, useState } from "react";
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

export function TypingActivity({
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
    responseMs: number
  ) => void;
  onAdvance: () => void;
}) {
  const { t, lang } = useT();
  const slot = useTrainerActionSlot();
  const words = activity.words;

  const [values, setValues] = useState<string[]>(() => words.map(() => ""));
  const [status, setStatus] = useState<RowStatus[]>(() => words.map(() => "none"));
  const [checked, setChecked] = useState(false);

  const startRef = useRef(now());
  const completedAtRef = useRef<(number | null)[]>(words.map(() => null));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Focus the first field on mount.
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

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

  function handleChange(idx: number, value: string) {
    if (checked) return;
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
    else scoreGroup();
  }

  const primaryLabel = checked ? t("lesson.continue") : t("vocab_trainer.check");
  const onPrimary = () => (checked ? onAdvance() : scoreGroup());

  const actionButton = useMemo(
    () => (
      <button type="button" className="btn primary bt-primary-action" onClick={onPrimary}>
        {primaryLabel}
      </button>
    ),
    // Rebuild when the label/handler intent changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [checked, primaryLabel]
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
                disabled={checked}
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
