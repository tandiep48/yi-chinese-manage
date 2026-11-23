// tests/components/lesson/TypingTask.test.tsx
// The lesson trainer's typing task reveals the correct sentence in green when the
// learner skips (or submits a wrong answer), so the answer is clearly shown.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { TypingTask } from "@/components/page/learner/lesson-training/TypingTask";
import type { LessonTask } from "@/lib/types/lesson";

vi.mock("@/components/i18n/I18nProvider", () => ({
  useT: () => ({ t: (key: string) => key, lang: "en" }),
}));

let slot: HTMLElement | null = null;
vi.mock("@/components/page/learner/trainer/TrainerShell", () => ({
  useTrainerActionSlot: () => slot,
}));

const AUDIO_TASK: LessonTask = { ...TASK_BASE(), audio_key: "line_1" };

function TASK_BASE(): LessonTask {
  return {
    type: "typing",
    passage_id: "H2_2_1",
    line_id: 1,
    content: "你好",
    correct_answer: "你好",
    pinyin: "Nǐ hǎo",
    audio_key: null,
  };
}

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

describe("TypingTask audio gate", () => {
  function typeCorrect() {
    fireEvent.change(document.querySelector("textarea") as HTMLTextAreaElement, {
      target: { value: "你好" },
    });
  }

  it("keeps Next disabled until the answer audio has ended", () => {
    const onAdvance = vi.fn();
    render(<TypingTask task={AUDIO_TASK} onResolved={vi.fn()} onAdvance={onAdvance} />);
    typeCorrect();

    const next = screen.getByText("lesson.next") as HTMLButtonElement;
    expect(next).toBeDisabled();
    fireEvent.click(next);
    expect(onAdvance).not.toHaveBeenCalled();

    const audio = vi.mocked(window.HTMLMediaElement.prototype.play).mock.contexts[0] as HTMLAudioElement;
    act(() => {
      audio.onended?.(new Event("ended"));
    });
    expect(screen.getByText("lesson.next")).not.toBeDisabled();
  });

  it("unlocks Next when the audio fails to play", async () => {
    window.HTMLMediaElement.prototype.play = vi.fn().mockRejectedValue(new Error("blocked"));
    render(<TypingTask task={AUDIO_TASK} onResolved={vi.fn()} onAdvance={vi.fn()} />);
    typeCorrect();
    await waitFor(() => expect(screen.getByText("lesson.next")).not.toBeDisabled());
  });

  it("does not lock Next when there is no audio to wait for", () => {
    render(<TypingTask task={TASK} onResolved={vi.fn()} onAdvance={vi.fn()} />);
    typeCorrect();
    expect(screen.getByText("lesson.next")).not.toBeDisabled();
  });
});
