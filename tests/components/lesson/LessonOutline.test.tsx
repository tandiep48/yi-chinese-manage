// tests/components/lesson/LessonOutline.test.tsx
// The outline half of LessonSidebar: the two progress bars on top, and the active
// part's milestone steps listed under it (each a jump to that step).

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LessonSidebar } from "@/components/page/learner/lesson/LessonSidebar";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import * as partsHook from "@/hooks/lesson/useLessonParts";
import type { UseLessonPartsReturn } from "@/hooks/lesson/useLessonParts";
import type { OutlineMilestone } from "@/components/page/learner/lesson/LessonOutlineContext";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/hooks/lesson/useLessonParts");

const LESSON: UseLessonPartsReturn = {
  loading: false,
  error: null,
  header: { badge: "HSK2", lessonNum: "2", isBook: false },
  lessonProgress: { learnedWords: 4, totalWords: 12, progressPct: 25 },
  parts: [
    {
      passageId: "H2_2_1",
      partNum: "1",
      isNumber: false,
      title: "Lili likes to run.",
      progress: { learnedWords: 2, totalWords: 8, progressPct: 40 },
    },
    { passageId: "H2_2_2", partNum: "2", isNumber: false, title: "Too busy.", progress: null },
  ],
};

function run(over: Partial<OutlineMilestone> = {}): OutlineMilestone {
  return {
    passageId: "H2_2_1",
    step: 2,
    totalSteps: 6,
    completed: [1],
    goToStep: vi.fn(),
    ...over,
  };
}

function renderOutline(
  milestone: OutlineMilestone | null,
  domain: "lesson" | "grammar" = "lesson"
) {
  return render(
    <I18nProvider>
      <LessonSidebar
        passageId="H2_2_1"
        domain={domain}
        open
        onOpenChange={vi.fn()}
        lesson={LESSON}
        milestone={milestone}
      />
    </I18nProvider>
  );
}

describe("LessonSidebar outline", () => {
  beforeEach(() => {
    vi.mocked(partsHook.useLessonParts).mockReturnValue({
      loading: false,
      error: "invalid",
      parts: [],
      lessonProgress: null,
      header: null,
    });
  });

  it("uses the host's parts instead of loading its own", () => {
    renderOutline(null);
    expect(screen.getAllByText("Lili likes to run.").length).toBeGreaterThan(0);
    expect(partsHook.useLessonParts).toHaveBeenCalledWith("");
  });

  it("shows the whole-lesson and current-part progress", () => {
    const { container } = renderOutline(run());
    const rows = container.querySelectorAll(".outline-progress-row");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Lesson progress");
    expect(rows[0]).toHaveTextContent("25%");
    // The running milestone drives the part bar: 1 of 6 steps done.
    expect(rows[1]).toHaveTextContent("Lili likes to run. (current)");
    expect(rows[1]).toHaveTextContent("17% · Step 2 of 6");
  });

  it("falls back to the part's saved progress when no milestone is running", () => {
    const { container } = renderOutline(null);
    expect(container.querySelectorAll(".outline-progress-row")[1]).toHaveTextContent("40%");
    expect(container.querySelector(".outline-substeps")).toBeNull();
  });

  it("lists the active part's steps and jumps to the clicked one", () => {
    const milestone = run();
    const { container } = renderOutline(milestone);
    const steps = container.querySelectorAll(".outline-substep");
    expect(steps).toHaveLength(6);
    expect(steps[0]).toHaveClass("is-done");
    expect(steps[1]).toHaveClass("is-current");
    expect(steps[1]).toHaveAttribute("aria-current", "step");

    fireEvent.click(screen.getByRole("button", { name: "4. Lesson Summary" }));
    expect(milestone.goToStep).toHaveBeenCalledWith(4);
  });

  it("ignores a milestone reported for another part", () => {
    const { container } = renderOutline(run({ passageId: "H2_2_2" }));
    expect(container.querySelector(".outline-substeps")).toBeNull();
  });

  it("drops the current-part bar and steps on the Grammar view", () => {
    const { container } = renderOutline(run(), "grammar");
    expect(container.querySelectorAll(".outline-progress-row")).toHaveLength(1);
    expect(container.querySelector(".outline-substeps")).toBeNull();
  });
});
