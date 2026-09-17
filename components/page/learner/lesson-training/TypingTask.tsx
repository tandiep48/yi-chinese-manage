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
import { useLessonTaskFlow } from "@/hooks/useLessonTaskFlow";
import type { LessonTask } from "@/lib/types/lesson";

const HANZI_RE = /[一-鿿]/;

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
  const { answered, commit, buttonPortal } = useLessonTaskFlow({ task, onResolved, onAdvance });
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const target = useMemo(() => [...(task.content || "")], [task.content]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Colour each target character by the character typed at the same position. '、'
  // positions consume no input; only a Chinese character is judged (so IME/pinyin
  // composition in the field does not glow red).
  const charClasses = useMemo(() => {
    const typed = [...value];
    const classes: string[] = [];
    let ti = 0;
    for (let i = 0; i < target.length; i++) {
      if (target[i] === "、") {
        classes.push("");
        continue;
      }
      let cls = "";
      if (ti < typed.length && HANZI_RE.test(typed[ti])) {
        cls = typed[ti] === target[i] ? "char-correct" : "char-wrong";
      }
      classes.push(cls);
      ti++;
    }
    return classes;
  }, [value, target]);

  function handleChange(next: string) {
    if (answered) return;
    setValue(next);
    if (answersMatch(next, task.correct_answer)) commit(next, true);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" || answered) return;
    e.preventDefault();
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
          <span key={i} className={`typing-char ${charClasses[i]}`}>
            {ch}
          </span>
        ))}
      </div>

      <input
        ref={inputRef}
        type="text"
        className="lt-typing-input"
        lang="zh-CN"
        autoComplete="off"
        inputMode="text"
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
