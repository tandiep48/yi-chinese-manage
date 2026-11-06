// tests/components/lesson/TypingTask.test.tsx
// The lesson trainer's typing task reveals the correct sentence in green when the
// learner skips (or submits a wrong answer), so the answer is clearly shown.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TypingTask } from "@/components/page/learner/lesson-training/TypingTask";
import type { LessonTask } from "@/lib/types/lesson";

vi.mock("@/components/i18n/I18nProvider", () => ({
  useT: () => ({ t: (key: string) => key, lang: "en" }),
}));

let slot: HTMLElement | null = null;
vi.mock("@/components/page/learner/trainer/TrainerShell", () => ({
  useTrainerActionSlot: () => slot,
}));

const TASK: LessonTask = {
  type: "typing",
  passage_id: "H2_2_1",
  line_id: 1,
  content: "你好",
  correct_answer: "你好",
  pinyin: "Nǐ hǎo",
  audio_key: null,
};

beforeEach(() => {
  slot = document.createElement("div");
  document.body.appendChild(slot);
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
});

afterEach(() => {
  if (slot) slot.remove();
  slot = null;
  vi.clearAllMocks();
});

describe("TypingTask skip reveal", () => {
  it("turns every target character green when skipped", () => {
    render(<TypingTask task={TASK} onResolved={vi.fn()} onAdvance={vi.fn()} />);

    // Before skipping, nothing is judged (no glow).
    const before = [...document.querySelectorAll(".lt-typing-target .typing-char")];
    expect(before.every((c) => !c.className.includes("char-correct"))).toBe(true);

    fireEvent.click(screen.getByText("trainer.skip"));

    const after = [...document.querySelectorAll(".lt-typing-target .typing-char")];
    expect(after.length).toBe(2);
    expect(after.every((c) => c.className.includes("char-correct"))).toBe(true);
  });
});
