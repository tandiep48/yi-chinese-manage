"use client";

// components/page/learner/lesson-training/ChoiceTask.tsx
// Multiple-choice lesson task (listening or meaning), ported from the listening /
// meaning branches of Learning/web_app/static/lesson/lesson.js. Listening plays the
// line audio (auto on load + a replay button) and asks for the meaning; meaning shows
// the Chinese sentence. Number keys 1-4 pick an option; after answering, the correct
// option turns green (a wrong pick turns red) and the board locks.

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeadphonesSimple, faBookOpen, faPlay } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { answersMatch } from "@/lib/lessons/lessonTrainer";
import { useLessonTaskFlow } from "@/hooks/useLessonTaskFlow";
import type { LessonTask } from "@/lib/types/types";

export function ChoiceTask({
  task,
  onResolved,
  onAdvance,
  mcDelayMs,
}: {
  task: LessonTask;
  onResolved: Parameters<typeof useLessonTaskFlow>[0]["onResolved"];
  onAdvance: () => void;
  // Learn Together shortens the pause after a correct answer; see useLessonTaskFlow.
  mcDelayMs?: number;
}) {
  const { t } = useT();
  const { answered, playAudio, commit, buttonPortal } = useLessonTaskFlow({
    task,
    onResolved,
    onAdvance,
    mcDelayMs,
  });
  const [selected, setSelected] = useState<string | null>(null);
  const isListening = task.type === "listening";
  const options = task.options ?? [];

  // Autoplay the audio for a listening task when it mounts.
  useEffect(() => {
    if (isListening) playAudio();
    // playAudio is stable enough for a mount-only autoplay.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Number keys 1-4 pick an option, matching the solo lesson trainer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const n = parseInt(e.key, 10);
      if (!n || n > options.length) return;
      e.preventDefault();
      choose(options[n - 1]);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answered, options]);

  function choose(opt: string) {
    if (answered) return;
    setSelected(opt);
    commit(opt, answersMatch(opt, task.correct_answer));
  }

  function optionClass(opt: string) {
    if (!answered) return "btn lt-mc-btn";
    const classes = ["btn", "lt-mc-btn"];
    if (answersMatch(opt, task.correct_answer)) classes.push("lt-correct");
    else if (opt === selected) classes.push("lt-wrong");
    return classes.join(" ");
  }

  return (
    <div className="lt-task lt-choice">
      <div className="instruction">
        <FontAwesomeIcon icon={isListening ? faHeadphonesSimple : faBookOpen} aria-hidden />
        <span>{t(isListening ? "lesson.instruction_listen" : "lesson.instruction_meaning")}</span>
      </div>

      {isListening ? (
        <button type="button" className="lt-audio-btn" onClick={playAudio} aria-label={t("lesson.play_audio")}>
          <FontAwesomeIcon icon={faPlay} aria-hidden />
        </button>
      ) : (
        <div className="lt-word">{task.content}</div>
      )}

      <div className="lt-mc-area">
        {options.map((opt, idx) => (
          <button
            key={`${opt}-${idx}`}
            type="button"
            className={optionClass(opt)}
            disabled={answered}
            onClick={() => choose(opt)}
          >
            <span className="mc-btn-inner">
              <span className="key-hint">{idx + 1}</span>
              {opt}
            </span>
          </button>
        ))}
      </div>

      {buttonPortal}
    </div>
  );
}
