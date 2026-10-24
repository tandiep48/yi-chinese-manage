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
import { AUTO_ADVANCE_DELAY_MS, type Activity, type TrainerWord } from "@/lib/lessons/vocabTrainer";

type RowStatus = "none" | "correct" | "incorrect";

// Cap on how long the group waits for the last word's reveal audio to finish
// before auto-advancing, so a missing/blocked "ended" event can't strand it.
const AUDIO_ADVANCE_MAX_MS = 4000;

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
  const inputRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Pending auto-advance timer (solo all-correct), cleared on unmount.
  const advanceTimerRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
    },
    []
  );

  // Once the group finishes — solo all-correct, or Learn Together all-locked — wait
  // for the last word's reveal audio to end before moving on; the fixed pause used to
  // cut it off and advance mid-playback. Falls back to that pause when there is no
  // audio, and a hard cap covers an "ended" event that never fires (autoplay blocked).
  function advanceWhenAudioDone(hasAudio: boolean) {
    const audio = audioRef.current;
    if (!hasAudio || !audio) {
      advanceTimerRef.current = window.setTimeout(onAdvance, AUTO_ADVANCE_DELAY_MS);
      return;
    }
    const done = () => {
      audio.removeEventListener("ended", done);
      if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
      onAdvance();
    };
    audio.addEventListener("ended", done);
    advanceTimerRef.current = window.setTimeout(done, AUDIO_ADVANCE_MAX_MS);
  }

  // Grow a field to fit its content so an unusually long answer wraps onto new
  // lines instead of scrolling out of a one-line box — the whole typed text stays
  // readable, which matters most on a narrow phone.
  function autoGrow(el: HTMLTextAreaElement | null) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

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

  // `override` carries the just-typed values when scoring is triggered straight from
  // handleChange — the keystroke's setValues hasn't committed yet, so reading `values`
  // would score the last word against its stale (pre-keystroke) text and mark it wrong.
  function scoreGroup(override?: string[]) {
    if (checked) return;
    const finals = override ?? values;
    words.forEach((row, i) => {
      const answer = finals[i].trim();
      const isCorrect = answer === row.word;
      const completedAt = completedAtRef.current[i] ?? now();
      onRecord(row, "typing", answer, isCorrect, completedAt - startRef.current);
    });
    setStatus(words.map((row, i) => (finals[i].trim() === row.word ? "correct" : "incorrect")));
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
        // This word's reveal audio was just started above. If locking it finishes the
        // group, wait for that audio to end before advancing — the group used to move
        // on after a fixed pause and cut the last word's audio off. A skipped group
        // reveals through revealUnsolved() instead, so it never reaches here.
        const willFinish = words.every((_, i) => i === idx || locked[i]);
        lockWord(idx, value.trim(), true);
        if (willFinish) advanceWhenAudioDone(Boolean(row.audio_key));
        return;
      }
      // Auto-finish the group once every word is correct. Build the final values with
      // this keystroke applied and hand them to scoreGroup, which otherwise reads the
      // not-yet-committed `values` state and marks the last word wrong.
      const finals = words.map((_, i) => (i === idx ? value.trim() : values[i].trim()));
      const allCorrect = words.every((w, i) => finals[i] === w.word);
      if (allCorrect) {
        scoreGroup(finals);
        advanceWhenAudioDone(Boolean(row.audio_key));
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

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter moves to the next field (or scores), never inserting a newline — the
    // single-line behaviour this textarea replaced.
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
              <textarea
                ref={(el) => {
                  inputRefs.current[idx] = el;
                  autoGrow(el);
                }}
                className="bt-type-input"
                lang="zh-CN"
                autoComplete="off"
                inputMode="text"
                rows={1}
                style={{ fontSize: "30px" }}
                value={values[idx]}
                disabled={checked || locked[idx]}
                onChange={(e) => {
                  handleChange(idx, e.target.value);
                  autoGrow(e.currentTarget);
                }}
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
