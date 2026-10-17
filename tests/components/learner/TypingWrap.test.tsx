// tests/components/learner/TypingWrap.test.tsx
// The lesson and vocab typing fields must be <textarea>, not <input>: a long
// answer has to wrap onto new lines on a narrow phone instead of scrolling out
// of a one-line box (an <input> cannot wrap). Enter still submits rather than
// inserting a newline, matching the single-line behaviour these replaced.

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { TypingTask } from "@/components/page/learner/lesson-training/TypingTask";
import { TypingActivity } from "@/components/page/learner/vocab-training/TypingActivity";
import type { LessonTask } from "@/lib/types/lesson";
import type { Activity, TrainerWord } from "@/lib/lessons/vocabTrainer";

const LESSON_TASK = {
  type: "typing",
  content: "你好世界",
  correct_answer: "你好世界",
  pinyin: "nǐ hǎo shì jiè",
} as LessonTask;

const VOCAB_WORD: TrainerWord = {
  word: "好",
  cn: "好",
  pinyin: "hǎo",
  meaning_vn: "tốt",
  meaning_en: "good",
  audio_key: "",
  level: "HSK1",
};
const VOCAB_ACTIVITY: Activity = { groupIndex: 0, type: "typing", words: [VOCAB_WORD] };

describe("typing fields wrap long input", () => {
  it("renders the lesson typing field as a textarea", () => {
    const { container } = render(
      <TypingTask task={LESSON_TASK} onResolved={vi.fn()} onAdvance={vi.fn()} />
    );
    expect(container.querySelector("textarea.lt-typing-input")).not.toBeNull();
    expect(container.querySelector("input.lt-typing-input")).toBeNull();
  });

  it("renders the vocab typing field as a textarea", () => {
    const { container } = render(
      <TypingActivity activity={VOCAB_ACTIVITY} onRecord={vi.fn()} onAdvance={vi.fn()} />
    );
    expect(container.querySelector("textarea.bt-type-input")).not.toBeNull();
    expect(container.querySelector("input.bt-type-input")).toBeNull();
  });

  it("submits on Enter without inserting a newline", () => {
    const onResolved = vi.fn();
    const { container } = render(
      <TypingTask task={LESSON_TASK} onResolved={onResolved} onAdvance={vi.fn()} />
    );
    const field = container.querySelector("textarea.lt-typing-input") as HTMLTextAreaElement;

    // A partial (wrong) answer avoids the correct-answer audio-advance path.
    fireEvent.change(field, { target: { value: "你好" } });
    fireEvent.keyDown(field, { key: "Enter" });

    expect(onResolved).toHaveBeenCalledTimes(1);
    const [, userAnswer, isCorrect] = onResolved.mock.calls[0];
    expect(userAnswer).toBe("你好");
    expect(isCorrect).toBe(false);
    expect(field.value).not.toContain("\n");
  });
});
