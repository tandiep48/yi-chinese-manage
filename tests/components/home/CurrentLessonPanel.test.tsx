// tests/components/home/CurrentLessonPanel.test.tsx
// The learner home's current-lesson rail: a loading skeleton, an empty state that
// points at the picker, and the populated card with lesson context, milestone
// progress and a Continue action. The two data hooks are mocked; i18n is real so
// assertions use the shipped EN strings.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { useCurrentLesson } from "@/hooks/lesson/useCurrentLesson";
import { useLessonMilestone } from "@/hooks/lesson/useLessonMilestone";
import { CurrentLessonPanel } from "@/components/page/learner/home/CurrentLessonPanel";

vi.mock("@/hooks/lesson/useCurrentLesson", () => ({ useCurrentLesson: vi.fn() }));
vi.mock("@/hooks/lesson/useLessonMilestone", () => ({ useLessonMilestone: vi.fn() }));

const mockLesson = vi.mocked(useCurrentLesson);
const mockMilestone = vi.mocked(useLessonMilestone);

function milestone(step: number, done: number[]) {
  return {
    loading: false,
    error: null,
    milestone: {
      passage_id: "H2_3_1",
      total_steps: 6,
      current_step: step,
      steps: [1, 2, 3, 4, 5, 6].map((s) => ({ step: s, completed: done.includes(s), completed_at: null })),
    },
    totalSteps: 6,
    step,
    goToStep: vi.fn(),
    isCompleted: (n: number) => done.includes(n),
    completeAndAdvance: vi.fn(),
    refreshAfterRun: vi.fn(),
    saving: false,
  } as never;
}

const DASH_LESSON = {
  passage_id: "H2_3_1",
  hsk_level: "HSK2",
  level: 2,
  lesson: 3,
  part: 1,
  passage_ids: ["H2_3_1", "H2_3_2"],
  updated_at: null,
};

function renderPanel(onContinue = vi.fn()) {
  render(
    <I18nProvider>
      <CurrentLessonPanel onContinue={onContinue} />
    </I18nProvider>
  );
  return onContinue;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockMilestone.mockReturnValue(milestone(1, []));
});

describe("CurrentLessonPanel", () => {
  it("shows a skeleton while the lesson loads", () => {
    mockLesson.mockReturnValue({ loading: true, lesson: null, error: null });
    const { container } = render(
      <I18nProvider>
        <CurrentLessonPanel onContinue={vi.fn()} />
      </I18nProvider>
    );
    expect(container.querySelector("[aria-busy='true']")).not.toBeNull();
  });

  it("prompts to browse lessons when there is no current lesson", () => {
    mockLesson.mockReturnValue({ loading: false, lesson: null, error: null });
    renderPanel();
    expect(screen.getByText("You haven't started a lesson yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse lessons" })).toHaveAttribute("href", "/learner/hsk");
  });

  it("shows the lesson context, milestone progress and a Continue action", async () => {
    const user = userEvent.setup();
    mockLesson.mockReturnValue({ loading: false, lesson: DASH_LESSON, error: null });
    mockMilestone.mockReturnValue(milestone(3, [1, 2]));

    const onContinue = renderPanel();

    expect(screen.getByText("HSK2 · Lesson 3 · Part 1")).toBeInTheDocument();
    expect(screen.getByText(/Step 3 of 6/)).toBeInTheDocument();
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "2");
    expect(bar).toHaveAttribute("aria-valuemax", "6");

    await user.click(screen.getByRole("button", { name: /Continue/ }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
