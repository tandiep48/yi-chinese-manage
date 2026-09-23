// tests/components/milestone/MilestoneRunner.test.tsx
// The six-step runner (docs/plans/dashboard-tabs.md §10.6): a passive step
// advances on Continue, a graded step does NOT advance below the pass threshold,
// the step is mirrored to the host, and the summaries' Learn/Train footers are
// gone rather than merely disabled.
//
// The step bodies are heavy (two trainers, a flash-card viewer), so each is
// mocked to a marker — this file is about the machine, not its contents.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
// finished run can be simulated.
let vocabTrainerExit: () => void = () => {};
let lessonTrainerExit: () => void = () => {};
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
  VocabTrainerPage: ({ onExit }: { onExit?: () => void }) => {
    vocabTrainerExit = onExit ?? (() => {});
    return <div data-testid="body">vocab-trainer</div>;
  },
}));
vi.mock("@/components/page/learner/lesson-training/LessonTrainerPage", () => ({
  LessonTrainerPage: ({ onExit }: { onExit?: () => void }) => {
    lessonTrainerExit = onExit ?? (() => {});
    return <div data-testid="body">lesson-trainer</div>;
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

  it("advances on Continue", async () => {
    const user = userEvent.setup();
    renderRunner();
    await waitFor(() => expect(body()).toContain("word-summary"));

    await user.click(screen.getByRole("button", { name: /Continue/ }));

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
  it("shows no Continue button on a graded step", async () => {
    mockResolve.mockResolvedValue([
      { word: "学习", cn: "学习", pinyin: "x", meaning_en: "s", meaning_vn: "h", audio_key: "a", level: "HSK1" },
    ]);
    renderRunner({ initialStep: 3 });

    await waitFor(() => expect(body()).toContain("vocab-trainer"));
    expect(screen.queryByRole("button", { name: /Continue/ })).not.toBeInTheDocument();
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

describe("MilestoneRunner — host wiring", () => {
  it("reports the step so the host can mirror it to the URL", async () => {
    const onStepChange = vi.fn();
    const user = userEvent.setup();
    renderRunner({ onStepChange });
    await waitFor(() => expect(onStepChange).toHaveBeenCalledWith(1));

    await user.click(screen.getByRole("button", { name: /Continue/ }));

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
