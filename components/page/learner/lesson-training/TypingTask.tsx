"use client";

// components/page/learner/lesson-training/TypingTask.tsx
// Typing lesson task, ported from the typing branch of
// Learning/web_app/static/lesson/lesson.js. The Chinese sentence is shown one span
// per character so each character can glow green/red as the learner types; the answer
// auto-submits once it matches (Enter submits whatever is typed). After answering the
// sentence's pinyin is revealed. Punctuation is optional (see normalizeAnswer).

import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faKeyboard } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { answersMatch } from "@/lib/lessons/lessonTrainer";
import { typingCharClasses } from "@/lib/lessons/typingGlow";
import { useLessonTaskFlow } from "@/hooks/lesson/useLessonTaskFlow";
import type { LessonTask } from "@/lib/types/lesson";

export function TypingTask({
  task,
  onResolved,
  onAdvance,
}: {
  task: LessonTask;
  onResolved: Parameters<typeof useLessonTaskFlow>[0]["onResolved"];
  onAdvance: () => void;
}) {
  const { t } = useT();
  const { answered, outcome, commit, buttonPortal } = useLessonTaskFlow({ task, onResolved, onAdvance });
  // On skip / a wrong submit, reveal the whole target sentence in green so the correct
  // answer is clearly shown (a correct answer already glows green from what was typed).
  const reveal = answered && outcome !== "correct";
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const target = useMemo(() => [...(task.content || "")], [task.content]);

  // Grow the field to fit its content so a long sentence wraps onto new lines
  // instead of scrolling out of view in a one-line box — the whole typed answer
  // stays readable, which matters most on a narrow phone.
  function autoGrow(el: HTMLTextAreaElement | null) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    autoGrow(inputRef.current);
  }, [value]);

  // Colour each target character by the character typed at the same position
  // (shared with the other typed milestone steps; see typingGlow).
  const charClasses = useMemo(() => typingCharClasses(target, value), [value, target]);

  function handleChange(next: string) {
    if (answered) return;
    setValue(next);
    if (answersMatch(next, task.correct_answer)) commit(next, true);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter submits rather than inserting a newline, matching the single-line field
    // this replaced.
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (answered) return;
    const v = value.trim();
    if (v) commit(v, answersMatch(v, task.correct_answer));
  }

  return (
    <div className="lt-task lt-typing">
      <div className="instruction">
        <FontAwesomeIcon icon={faKeyboard} aria-hidden />
        <span>{t("lesson.instruction_typing")}</span>
      </div>

      <div className="lt-typing-target">
        {target.map((ch, i) => (
          <span key={i} className={`typing-char ${reveal ? "char-correct" : charClasses[i]}`}>
            {ch}
          </span>
        ))}
      </div>

      <textarea
        ref={inputRef}
        className="lt-typing-input"
        lang="zh-CN"
        autoComplete="off"
        inputMode="text"
        rows={1}
        placeholder={t("lesson.typing_placeholder")}
        value={value}
        disabled={answered}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
      />

      {answered && task.pinyin ? <div className="lt-typing-pinyin">{task.pinyin}</div> : null}

      {buttonPortal}
    </div>
  );
}
