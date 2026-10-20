// tests/components/milestone/MilestoneRunner.test.tsx
// The six-step runner (docs/plans/dashboard-tabs.md §10.6): a passive step
// advances on Continue, a graded step does NOT advance below the pass threshold,
// the step is mirrored to the host, and the summaries' Learn/Train footers are
// gone rather than merely disabled.
//
// The step bodies are heavy (two trainers, a flash-card viewer), so each is
// mocked to a marker — this file is about the machine, not its contents.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { getMilestone, markMilestoneStep } from "@/lib/api/learner/milestone";
import { resolveTrainerWords } from "@/lib/api/learner/vocabTrainer";
import { useLessonOverview } from "@/hooks/lesson/useLessonOverview";
import { MilestoneRunner } from "@/components/page/learner/milestone/MilestoneRunner";
import type { Milestone } from "@/lib/api/learner/milestone";

vi.mock("@/lib/api/learner/milestone", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/learner/milestone")>()),
  getMilestone: vi.fn(),
  markMilestoneStep: vi.fn(),
}));
vi.mock("@/lib/api/learner/vocabTrainer", () => ({
  resolveTrainerWords: vi.fn(),
  submitVocabBatch: vi.fn(),
}));
vi.mock("@/hooks/lesson/useLessonOverview", () => ({ useLessonOverview: vi.fn() }));

// Step bodies, reduced to markers. The two trainers expose their onExit so a
// finished run can be simulated, and their onScreenChange so a test can drive the
// trainer into its training / complete screens (which swaps the nav bar's buttons).
let vocabTrainerExit: () => void = () => {};
let lessonTrainerExit: () => void = () => {};
let vocabTrainerScreen: (s: string) => void = () => {};
vi.mock("@/components/page/learner/lesson/WordSummary", () => ({
  WordSummary: ({ hideActions }: { hideActions?: boolean }) => (
    <div data-testid="body">word-summary hideActions={String(!!hideActions)}</div>
  ),
}));
vi.mock("@/components/page/learner/lesson/LessonSummary", () => ({
  LessonSummary: ({ hideActions }: { hideActions?: boolean }) => (
    <div data-testid="body">lesson-summary hideActions={String(!!hideActions)}</div>
  ),
}));
vi.mock("@/components/page/learner/lesson/LessonCardStudy", () => ({
  LessonCardStudy: () => <div data-testid="body">lesson-cards</div>,
}));
vi.mock("@/components/page/learner/vocab-learning/FlashcardStudy", () => ({
  FlashcardStudy: ({ shell }: { shell?: boolean }) => (
    <div data-testid="body">flashcards shell={String(shell)}</div>
  ),
}));
vi.mock("@/components/page/learner/vocab-training/VocabTrainerPage", () => ({
  VocabTrainerPage: ({
    onExit,
    types,
    onScreenChange,
    bottomBarSlot,
  }: {
    onExit?: () => void;
    types?: string[];
    onScreenChange?: (s: string) => void;
    bottomBarSlot?: HTMLElement | null;
  }) => {
    vocabTrainerExit = onExit ?? (() => {});
    vocabTrainerScreen = onScreenChange ?? (() => {});
    return (
      <div data-testid="body" data-hasslot={String(!!bottomBarSlot)}>
        vocab-trainer types={JSON.stringify(types ?? null)}
      </div>
    );
  },
}));
vi.mock("@/components/page/learner/lesson-training/LessonTrainerPage", () => ({
  LessonTrainerPage: ({
    onExit,
    types,
    bottomBarSlot,
  }: {
    onExit?: () => void;
    types?: string[];
    onScreenChange?: (s: string) => void;
    bottomBarSlot?: HTMLElement | null;
  }) => {
    lessonTrainerExit = onExit ?? (() => {});
    return (
      <div data-testid="body" data-hasslot={String(!!bottomBarSlot)}>
        lesson-trainer types={JSON.stringify(types ?? null)}
      </div>
    );
  },
}));

const mockGet = vi.mocked(getMilestone);
const mockMark = vi.mocked(markMilestoneStep);
const mockResolve = vi.mocked(resolveTrainerWords);
const mockOverview = vi.mocked(useLessonOverview);

const PASSAGE = "H1_2_1";

function milestone(done: number[]): Milestone {
  const steps = [1, 2, 3, 4, 5, 6].map((step) => ({
    step,
    completed: done.includes(step),
    completed_at: null,
  }));
  const incomplete = steps.filter((s) => !s.completed).map((s) => s.step);
  return {
    passage_id: PASSAGE,
    total_steps: 6,
    current_step: incomplete.length ? incomplete[0] : 7,
    steps,
  };
}

function renderRunner(props: Partial<Parameters<typeof MilestoneRunner>[0]> = {}) {
  return render(
    <I18nProvider>
      <MilestoneRunner passageId={PASSAGE} {...props} />
    </I18nProvider>
  );
}

const body = () => screen.getByTestId("body").textContent;

beforeEach(() => {
  vi.clearAllMocks();
  mockGet.mockResolvedValue(milestone([]));
  mockMark.mockResolvedValue(milestone([1]));
  mockResolve.mockResolvedValue([]);
  mockOverview.mockReturnValue({
    loading: false,
    error: null,
    passage: { passage_id: PASSAGE, hsk_level: "HSK1", lines: [] } as never,
    vocab: [],
    vocabError: null,
  });
});

describe("MilestoneRunner — passive steps", () => {
  it("opens on step 1 and shows the word summary with its footer removed", async () => {
    renderRunner();
    await waitFor(() => expect(body()).toContain("word-summary"));
    // hideActions, not merely no handlers — omitting those only disables.
    expect(body()).toContain("hideActions=true");
    expect(screen.getByText(/Step 1 of 6/)).toBeInTheDocument();
  });

  it("advances on Next", async () => {
    const user = userEvent.setup();
    renderRunner();
    await waitFor(() => expect(body()).toContain("word-summary"));

    await user.click(screen.getByRole("button", { name: /Next/ }));

    await waitFor(() => expect(body()).toContain("flashcards"));
    expect(mockMark).toHaveBeenCalledWith(PASSAGE, 1);
    expect(screen.getByText(/Step 2 of 6/)).toBeInTheDocument();
  });

  it("mounts the flash cards without a second study shell", async () => {
    renderRunner({ initialStep: 2 });
    await waitFor(() => expect(body()).toContain("flashcards"));
    expect(body()).toContain("shell=false");
  });

  it("hides the lesson summary's footer too", async () => {
    renderRunner({ initialStep: 4 });
    await waitFor(() => expect(body()).toContain("lesson-summary"));
    expect(body()).toContain("hideActions=true");
  });
});

describe("MilestoneRunner — graded steps", () => {
  it("Next re-reads the milestone instead of marking it on a graded step", async () => {
    const user = userEvent.setup();
    mockResolve.mockResolvedValue([
      { word: "学习", cn: "学习", pinyin: "x", meaning_en: "s", meaning_vn: "h", audio_key: "a", level: "HSK1" },
    ]);
    renderRunner({ initialStep: 3 });
    await waitFor(() => expect(body()).toContain("vocab-trainer"));

    // The server still reports step 3 incomplete, so Next is pass-gated: it
    // re-reads the milestone and stays put rather than POSTing a completion.
    await user.click(screen.getByRole("button", { name: /Next/ }));

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));
    expect(mockMark).not.toHaveBeenCalled();
    expect(body()).toContain("vocab-trainer");
    expect(screen.getByText(/Step 3 of 6/)).toBeInTheDocument();
  });

  it("does NOT advance when the run fell below the pass threshold", async () => {
    mockResolve.mockResolvedValue([
      { word: "学习", cn: "学习", pinyin: "x", meaning_en: "s", meaning_vn: "h", audio_key: "a", level: "HSK1" },
    ]);
    renderRunner({ initialStep: 3 });
    await waitFor(() => expect(body()).toContain("vocab-trainer"));

    // The server still reports step 3 incomplete.
    vocabTrainerExit();

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));
    expect(body()).toContain("vocab-trainer");
    expect(screen.getByText(/Step 3 of 6/)).toBeInTheDocument();
    expect(mockMark).not.toHaveBeenCalled();
  });

  it("advances when the server counted the run", async () => {
    renderRunner({ initialStep: 6 });
    await waitFor(() => expect(body()).toContain("lesson-trainer"));

    mockGet.mockResolvedValue(milestone([1, 2, 3, 4, 5, 6]));
    lessonTrainerExit();

    // Step 6 is the last, so the view stays but the milestone is now complete.
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));
    expect(mockMark).not.toHaveBeenCalled();
  });

  it("resolves the trainer words through the same endpoint the standalone route uses", async () => {
    renderRunner({ initialStep: 3 });
    await waitFor(() => expect(mockResolve).toHaveBeenCalledWith({ passage_id: PASSAGE }));
  });

  it("says so when the part has no vocabulary to train", async () => {
    mockResolve.mockResolvedValue([]);
    renderRunner({ initialStep: 3 });
    expect(await screen.findByText(/no vocabulary to train/i)).toBeInTheDocument();
  });
});

describe("MilestoneRunner — train-type picker", () => {
  it("opens the vocab picker on Continue from step 2 instead of advancing", async () => {
    const user = userEvent.setup();
    renderRunner({ initialStep: 2 });
    await waitFor(() => expect(body()).toContain("flashcards"));

    await user.click(screen.getByRole("button", { name: /Next/ }));

    expect(screen.getByText("What do you want to train?")).toBeInTheDocument();
    // Still on the learner step; nothing was marked until a skill set is chosen.
    expect(body()).toContain("flashcards");
    expect(mockMark).not.toHaveBeenCalled();
  });

  it("starts the vocab trainer with only the chosen skills", async () => {
    mockResolve.mockResolvedValue([
      { word: "学习", cn: "学习", pinyin: "x", meaning_en: "s", meaning_vn: "h", audio_key: "a", level: "HSK1" },
    ]);
    const user = userEvent.setup();
    renderRunner({ initialStep: 2 });
    await waitFor(() => expect(body()).toContain("flashcards"));

    await user.click(screen.getByRole("button", { name: /Next/ }));
    await user.click(screen.getByRole("checkbox", { name: "Listening" }));
    await user.click(screen.getByRole("checkbox", { name: "Reading" }));
    await user.click(screen.getByRole("button", { name: "Start" }));

    await waitFor(() => expect(body()).toContain("vocab-trainer"));
    expect(body()).toContain('types=["typing"]');
    expect(mockMark).toHaveBeenCalledWith(PASSAGE, 2);
  });

  it("opens the lesson picker on Continue from step 5 and filters the lesson trainer", async () => {
    const user = userEvent.setup();
    renderRunner({ initialStep: 5 });
    await waitFor(() => expect(body()).toContain("lesson-cards"));

    await user.click(screen.getByRole("button", { name: /Next/ }));
    // Lesson engine offers a Reorder skill the vocab engine does not.
    expect(screen.getByRole("checkbox", { name: "Reorder" })).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "Typing" }));
    await user.click(screen.getByRole("checkbox", { name: "Reorder" }));
    await user.click(screen.getByRole("button", { name: "Start" }));

    await waitFor(() => expect(body()).toContain("lesson-trainer"));
    expect(body()).toContain('types=["listening","meaning"]');
  });

  it("cancelling the picker leaves the learner on the step", async () => {
    const user = userEvent.setup();
    renderRunner({ initialStep: 2 });
    await waitFor(() => expect(body()).toContain("flashcards"));

    await user.click(screen.getByRole("button", { name: /Next/ }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByText("What do you want to train?")).not.toBeInTheDocument();
    expect(body()).toContain("flashcards");
    expect(mockMark).not.toHaveBeenCalled();
  });
});

describe("MilestoneRunner — host wiring", () => {
  it("reports the step so the host can mirror it to the URL", async () => {
    const onStepChange = vi.fn();
    const user = userEvent.setup();
    renderRunner({ onStepChange });
    await waitFor(() => expect(onStepChange).toHaveBeenCalledWith(1));

    await user.click(screen.getByRole("button", { name: /Next/ }));

    await waitFor(() => expect(onStepChange).toHaveBeenCalledWith(2));
  });

  it("reports a running trainer so the host can arm its guard", async () => {
    const onRunningChange = vi.fn();
    renderRunner({ initialStep: 3, onRunningChange });

    await waitFor(() => expect(onRunningChange).toHaveBeenCalledWith(true));
  });

  it("does not re-report a run when the host's callback identity changes", async () => {
    // Both hosts build these from useSearchParams, so a URL write changes their
    // identity. If the running-state effect depended on that, its cleanup would
    // report false and then true again — each a URL write, each changing
    // useSearchParams: an infinite loop, not a wasted render.
    const calls: boolean[] = [];
    const { rerender } = render(
      <I18nProvider>
        <MilestoneRunner
          passageId={PASSAGE}
          initialStep={3}
          onRunningChange={(r) => calls.push(r)}
        />
      </I18nProvider>
    );
    await waitFor(() => expect(calls).toContain(true));

    const before = calls.length;
    for (let i = 0; i < 3; i++) {
      rerender(
        <I18nProvider>
          <MilestoneRunner
            passageId={PASSAGE}
            initialStep={3}
            onRunningChange={(r) => calls.push(r)}
          />
        </I18nProvider>
      );
    }

    expect(calls.length).toBe(before);
  });

  it("reports no run on a passive step", async () => {
    const onRunningChange = vi.fn();
    renderRunner({ initialStep: 1, onRunningChange });

    await waitFor(() => expect(onRunningChange).toHaveBeenCalledWith(false));
    expect(onRunningChange).not.toHaveBeenCalledWith(true);
  });
});

describe("MilestoneRunner — trainer step nav bar", () => {
  const withVocab = () =>
    mockResolve.mockResolvedValue([
      { word: "学习", cn: "学习", pinyin: "x", meaning_en: "s", meaning_vn: "h", audio_key: "a", level: "HSK1" },
    ]);

  it("shows Quit + the trainer's action slot while training", async () => {
    withVocab();
    renderRunner({ initialStep: 3 });
    await waitFor(() => expect(body()).toContain("vocab-trainer"));

    act(() => vocabTrainerScreen("training"));

    expect(screen.getByRole("button", { name: /Quit Session/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Next$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Prev$/ })).not.toBeInTheDocument();
    // The trainer is handed the nav-bar slot to portal its Check/Next button into.
    await waitFor(() => expect(screen.getByTestId("body").dataset.hasslot).toBe("true"));
  });

  it("confirms Quit and steps back out of the trainer without posting", async () => {
    const user = userEvent.setup();
    withVocab();
    renderRunner({ initialStep: 3 });
    await waitFor(() => expect(body()).toContain("vocab-trainer"));
    act(() => vocabTrainerScreen("training"));

    await user.click(screen.getByRole("button", { name: /Quit Session/ }));
    expect(screen.getByText("Quit Session?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Yes, Quit" }));

    await waitFor(() => expect(body()).toContain("flashcards"));
    expect(screen.getByText(/Step 2 of 6/)).toBeInTheDocument();
    expect(mockMark).not.toHaveBeenCalled();
  });

  it("returns to Previous + Next on the trainer's recap screen", async () => {
    withVocab();
    renderRunner({ initialStep: 3 });
    await waitFor(() => expect(body()).toContain("vocab-trainer"));
    act(() => vocabTrainerScreen("training"));
    expect(screen.getByRole("button", { name: /Quit Session/ })).toBeInTheDocument();

    act(() => vocabTrainerScreen("complete"));

    expect(screen.getByRole("button", { name: /Next/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Quit Session/ })).not.toBeInTheDocument();
  });
});

describe("MilestoneRunner — auto-advance across parts", () => {
  const P1 = "H1_2_1";
  const P2 = "H1_2_2";

  function mk(passageId: string, done: number[]): Milestone {
    const steps = [1, 2, 3, 4, 5, 6].map((step) => ({
      step,
      completed: done.includes(step),
      completed_at: null,
    }));
    const incomplete = steps.filter((s) => !s.completed).map((s) => s.step);
    return {
      passage_id: passageId,
      total_steps: 6,
      current_step: incomplete.length ? incomplete[0] : 7,
      steps,
    };
  }

  it("moves to the next part when the final step is counted", async () => {
    // Part 1 finishes fully; part 2 is fresh and opens on its own step 1.
    mockGet.mockImplementation((pid: string) =>
      Promise.resolve(pid === P2 ? mk(P2, []) : mk(P1, [1, 2, 3, 4, 5, 6]))
    );
    renderRunner({ passageId: P1, passageIds: [P1, P2], initialStep: 6 });
    await waitFor(() => expect(body()).toContain("lesson-trainer"));

    // The trainer reports a finished, counted round.
    await act(async () => {
      lessonTrainerExit();
    });

    await waitFor(() => expect(mockGet).toHaveBeenCalledWith(P2));
    // The next part opens at its own resume step, not the carried step 6.
    await waitFor(() => expect(screen.getByText(/Step 1 of 6/)).toBeInTheDocument());
  });

  it("stays on the last part after its final step when no host takes over", async () => {
    mockGet.mockResolvedValue(mk(P2, [1, 2, 3, 4, 5, 6]));
    renderRunner({ passageId: P2, passageIds: [P1, P2], initialStep: 6 });
    await waitFor(() => expect(body()).toContain("lesson-trainer"));

    await act(async () => {
      lessonTrainerExit();
    });

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));
    expect(body()).toContain("lesson-trainer");
  });

  it("calls onLessonComplete when the final part's final step is counted", async () => {
    const onLessonComplete = vi.fn();
    mockGet.mockResolvedValue(mk(P2, [1, 2, 3, 4, 5, 6]));
    renderRunner({ passageId: P2, passageIds: [P1, P2], initialStep: 6, onLessonComplete });
    await waitFor(() => expect(body()).toContain("lesson-trainer"));

    await act(async () => {
      lessonTrainerExit();
    });

    await waitFor(() => expect(onLessonComplete).toHaveBeenCalledTimes(1));
  });

  it("calls onLessonComplete for a single-part run's final step (no dead end)", async () => {
    const onLessonComplete = vi.fn();
    mockGet.mockResolvedValue(mk(P1, [1, 2, 3, 4, 5, 6]));
    renderRunner({ passageId: P1, initialStep: 6, onLessonComplete });
    await waitFor(() => expect(body()).toContain("lesson-trainer"));

    await act(async () => {
      lessonTrainerExit();
    });

    await waitFor(() => expect(onLessonComplete).toHaveBeenCalledTimes(1));
  });

  it("does not cross a part boundary when the final step was not counted", async () => {
    mockGet.mockImplementation((pid: string) => Promise.resolve(mk(pid, [1, 2, 3, 4, 5])));
    renderRunner({ passageId: P1, passageIds: [P1, P2], initialStep: 6 });
    await waitFor(() => expect(body()).toContain("lesson-trainer"));

    await act(async () => {
      lessonTrainerExit();
    });

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));
    expect(mockGet).not.toHaveBeenCalledWith(P2);
    expect(body()).toContain("lesson-trainer");
  });
});

describe("MilestoneRunner — soft gating", () => {
  it("lets a completed step be replayed from the bar", async () => {
    const user = userEvent.setup();
    mockGet.mockResolvedValue(milestone([1, 2, 3]));
    renderRunner();
    await waitFor(() => expect(body()).toContain("lesson-summary"));

    await user.click(screen.getByRole("button", { name: /Step 1 of 6/ }));

    await waitFor(() => expect(body()).toContain("word-summary"));
  });
});

describe("MilestoneRunner — bottom nav bar", () => {
  it("disables Previous on the first step", async () => {
    renderRunner();
    await waitFor(() => expect(body()).toContain("word-summary"));
    expect(screen.getByRole("button", { name: /Prev/ })).toBeDisabled();
  });

  it("Previous steps back without touching the server", async () => {
    const user = userEvent.setup();
    renderRunner({ initialStep: 5 });
    await waitFor(() => expect(body()).toContain("lesson-cards"));

    await user.click(screen.getByRole("button", { name: /Prev/ }));

    await waitFor(() => expect(body()).toContain("lesson-summary"));
    expect(screen.getByText(/Step 4 of 6/)).toBeInTheDocument();
    expect(mockMark).not.toHaveBeenCalled();
  });
});
