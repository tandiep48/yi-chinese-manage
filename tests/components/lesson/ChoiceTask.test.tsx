// tests/components/lesson/ChoiceTask.test.tsx
// The lesson trainer's multiple-choice task keeps its auto-advance on a correct
// answer AND now exposes a Next button so the learner can move on at once. The two
// must never advance the task twice.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ChoiceTask } from "@/components/page/learner/lesson-training/ChoiceTask";
import { MC_CORRECT_DELAY_MS } from "@/lib/lessons/lessonTrainer";
import type { LessonTask } from "@/lib/types/lesson";

vi.mock("@/components/i18n/I18nProvider", () => ({
  useT: () => ({ t: (key: string) => key, lang: "en" }),
}));

// The task portals its primary button into the trainer action slot; provide one.
let slot: HTMLElement | null = null;
vi.mock("@/components/page/learner/trainer/TrainerShell", () => ({
  useTrainerActionSlot: () => slot,
}));

const TASK: LessonTask = {
  type: "meaning",
  passage_id: "H2_2_1",
  line_id: 1,
  content: "我喝水",
  correct_answer: "I drink water",
  options: ["I drink water", "I eat fire", "I see wind", "I am earth"],
  audio_key: null,
};

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  slot = document.createElement("div");
  document.body.appendChild(slot);
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
  if (slot) slot.remove();
  slot = null;
  vi.clearAllMocks();
});

function clickOption(text: string) {
  const btn = [...document.querySelectorAll<HTMLButtonElement>(".lt-mc-btn")].find((b) =>
    b.textContent?.includes(text)
  );
  fireEvent.click(btn!);
}

describe("ChoiceTask correct-answer flow", () => {
  it("shows Next after a correct answer and advances once when clicked", () => {
    const onAdvance = vi.fn();
    render(<ChoiceTask task={TASK} onResolved={vi.fn()} onAdvance={onAdvance} />);

    // Skip before answering, not Next.
    expect(screen.getByText("trainer.skip")).toBeInTheDocument();

    clickOption("I drink water");

    // Next now appears even though the answer was correct.
    const next = screen.getByText("lesson.next");
    expect(next).toBeInTheDocument();

    fireEvent.click(next);
    expect(onAdvance).toHaveBeenCalledTimes(1);

    // The pending auto-advance timer must not fire a second advance.
    act(() => void vi.advanceTimersByTime(MC_CORRECT_DELAY_MS + 100));
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it("still auto-advances a correct answer after the delay if Next is not clicked", () => {
    const onAdvance = vi.fn();
    render(<ChoiceTask task={TASK} onResolved={vi.fn()} onAdvance={onAdvance} />);

    clickOption("I drink water");
    expect(onAdvance).not.toHaveBeenCalled();

    act(() => void vi.advanceTimersByTime(MC_CORRECT_DELAY_MS));
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it("shows Next after a wrong answer and advances when clicked", () => {
    const onAdvance = vi.fn();
    render(<ChoiceTask task={TASK} onResolved={vi.fn()} onAdvance={onAdvance} />);

    clickOption("I eat fire");
    // Wrong answers never auto-advance.
    act(() => void vi.advanceTimersByTime(MC_CORRECT_DELAY_MS + 100));
    expect(onAdvance).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("lesson.next"));
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });
});
