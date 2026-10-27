// tests/components/lesson/MasterTrainerStage.test.tsx
// The end-of-lesson master trainer wrapper: it resolves the lesson-wide word set
// for Vocab, hands the part ids (mode="master") to the Lesson trainer, lets the
// learner skip while training, and shows a Continue on the recap. The trainers and
// the words endpoint are mocked; the real component owns only the nav + wiring.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { TrainerScreen } from "@/components/page/learner/trainer/TrainerShell";
import { MasterTrainerStage } from "@/components/page/learner/lesson/MasterTrainerStage";
import { resolveTrainerWords } from "@/lib/api/learner/vocabTrainer";

vi.mock("@/components/i18n/I18nProvider", () => ({
  useT: () => ({ t: (k: string) => k, lang: "en" }),
}));
vi.mock("@/lib/api/learner/vocabTrainer", () => ({ resolveTrainerWords: vi.fn() }));

// Each trainer mock records its props and exposes a button to drive onScreenChange,
// standing in for reaching the recap.
let vocabProps: Record<string, unknown> | null = null;
let lessonProps: Record<string, unknown> | null = null;
vi.mock("@/components/page/learner/vocab-training/VocabTrainerPage", () => ({
  VocabTrainerPage: (p: { onScreenChange?: (s: TrainerScreen) => void }) => {
    vocabProps = p as Record<string, unknown>;
    return (
      <div data-testid="vocab-trainer">
        <button onClick={() => p.onScreenChange?.("complete")}>to-complete</button>
      </div>
    );
  },
}));
vi.mock("@/components/page/learner/lesson-training/LessonTrainerPage", () => ({
  LessonTrainerPage: (p: { onScreenChange?: (s: TrainerScreen) => void }) => {
    lessonProps = p as Record<string, unknown>;
    return (
      <div data-testid="lesson-trainer">
        <button onClick={() => p.onScreenChange?.("complete")}>to-complete</button>
      </div>
    );
  },
}));

const mockResolve = vi.mocked(resolveTrainerWords);

beforeEach(() => {
  vi.clearAllMocks();
  vocabProps = null;
  lessonProps = null;
});

describe("MasterTrainerStage — vocab", () => {
  it("resolves the lesson-wide words and runs the vocab trainer", async () => {
    mockResolve.mockResolvedValue([{ word: "好" }] as never);
    render(<MasterTrainerStage engine="vocab" passageIds={["H2_2_1", "H2_2_2"]} onDone={vi.fn()} />);

    await waitFor(() => expect(screen.getByTestId("vocab-trainer")).toBeInTheDocument());
    expect(mockResolve).toHaveBeenCalledWith({ passage_ids: ["H2_2_1", "H2_2_2"] });
    expect(vocabProps?.words).toEqual([{ word: "好" }]);
  });

  it("skips to onDone while training", async () => {
    mockResolve.mockResolvedValue([{ word: "好" }] as never);
    const onDone = vi.fn();
    render(<MasterTrainerStage engine="vocab" passageIds={["H2_2_1"]} onDone={onDone} />);

    await waitFor(() => expect(screen.getByTestId("vocab-trainer")).toBeInTheDocument());
    fireEvent.click(screen.getByText("milestone.confirm_skip_btn"));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("shows Continue (not the trainer) when the lesson has no vocab", async () => {
    mockResolve.mockResolvedValue([]);
    const onDone = vi.fn();
    render(<MasterTrainerStage engine="vocab" passageIds={["H2_2_1"]} onDone={onDone} />);

    await waitFor(() => expect(screen.getByText("milestone.no_vocab")).toBeInTheDocument());
    expect(screen.queryByTestId("vocab-trainer")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("milestone.confirm_continue_btn"));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("swaps the skip + action slot for Continue on the recap", async () => {
    mockResolve.mockResolvedValue([{ word: "好" }] as never);
    const onDone = vi.fn();
    render(<MasterTrainerStage engine="vocab" passageIds={["H2_2_1"]} onDone={onDone} />);

    await waitFor(() => expect(screen.getByTestId("vocab-trainer")).toBeInTheDocument());
    fireEvent.click(screen.getByText("to-complete")); // reach the recap
    expect(screen.queryByText("milestone.confirm_skip_btn")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("milestone.confirm_continue_btn"));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});

describe("MasterTrainerStage — lesson", () => {
  it("runs the lesson trainer in master mode over the given parts, no words fetch", () => {
    render(
      <MasterTrainerStage engine="lesson" passageIds={["H2_2_1", "H2_2_2"]} onDone={vi.fn()} />
    );

    expect(screen.getByTestId("lesson-trainer")).toBeInTheDocument();
    expect(mockResolve).not.toHaveBeenCalled();
    expect(lessonProps?.mode).toBe("master");
    expect(lessonProps?.passageIds).toEqual(["H2_2_1", "H2_2_2"]);
  });
});
