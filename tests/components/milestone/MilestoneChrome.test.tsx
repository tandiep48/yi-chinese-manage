// tests/components/milestone/MilestoneChrome.test.tsx
// The milestone's chrome: the labelled step pills (MilestoneBar) and the context
// header (MilestoneHeader), which reads the part title and mastered-word count
// from the lesson outline when one is mounted around it.

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MilestoneBar } from "@/components/page/learner/milestone/MilestoneBar";
import { MilestoneHeader } from "@/components/page/learner/milestone/MilestoneHeader";
import { LessonOutlineContext } from "@/components/page/learner/lesson/LessonOutlineContext";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import type { SidebarPart } from "@/hooks/lesson/useLessonParts";

describe("MilestoneBar", () => {
  function renderBar(step = 2, done: number[] = [1]) {
    const onSelect = vi.fn();
    const utils = render(
      <I18nProvider>
        <MilestoneBar
          step={step}
          totalSteps={6}
          isCompleted={(n) => done.includes(n)}
          onSelect={onSelect}
        />
      </I18nProvider>
    );
    return { ...utils, onSelect };
  }

  it("labels every step with its number and title", () => {
    renderBar();
    expect(screen.getByText("1. Vocab Summary")).toBeInTheDocument();
    expect(screen.getByText("2. Vocab Learner")).toBeInTheDocument();
    expect(screen.getByText("6. Lesson Trainer")).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(6);
  });

  it("marks the done and current steps, and only the current one pulses", () => {
    const { container } = renderBar(2, [1]);
    const done = screen.getByRole("button", { name: /Step 1 of 6/ });
    const current = screen.getByRole("button", { name: /Step 2 of 6/ });
    expect(done).toHaveClass("is-done");
    expect(current).toHaveClass("is-current");
    expect(current).toHaveAttribute("aria-current", "step");
    expect(container.querySelectorAll(".milestone-segment-pulse")).toHaveLength(1);
    // A finished step shows a check in place of its number.
    expect(done.querySelector(".milestone-segment-num")).not.toHaveTextContent("1");
  });

  it("jumps to any step, ahead or behind (soft gating)", () => {
    const { onSelect } = renderBar();
    fireEvent.click(screen.getByRole("button", { name: /Step 5 of 6/ }));
    expect(onSelect).toHaveBeenCalledWith(5);
  });
});

describe("MilestoneHeader", () => {
  const PART: SidebarPart = {
    passageId: "H2_2_1",
    partNum: "1",
    isNumber: false,
    title: "Lili likes to run.",
    progress: { learnedWords: 2, totalWords: 8, progressPct: 40 },
  };

  function renderHeader(parts: SidebarPart[] | null) {
    const header = <MilestoneHeader passageId="H2_2_1" step={2} totalSteps={6} />;
    return render(
      <I18nProvider>
        {parts ? (
          <LessonOutlineContext.Provider value={{ parts, publishMilestone: vi.fn() }}>
            {header}
          </LessonOutlineContext.Provider>
        ) : (
          header
        )}
      </I18nProvider>
    );
  }

  it("shows the back link, lesson badge and step without an outline", () => {
    renderHeader(null);
    expect(screen.getByRole("link", { name: /Back to lesson/ })).toHaveAttribute(
      "href",
      "/learner/hsk/HSK2/2"
    );
    expect(screen.getByText("HSK2 · Lesson 2")).toBeInTheDocument();
    expect(screen.getByText(/Step 2 of 6 · Vocab Learner/)).toBeInTheDocument();
    expect(screen.queryByText(/Mastered/)).toBeNull();
  });

  it("adds the part title and mastered words from the outline", () => {
    const { container } = renderHeader([PART]);
    expect(screen.getByRole("heading", { name: "Lili likes to run." })).toBeInTheDocument();
    expect(container.querySelector(".milestone-header-mastered")).toHaveTextContent(
      "Mastered: 2/8"
    );
  });

  it("omits the mastered chip for a part with no words", () => {
    const { container } = renderHeader([
      { ...PART, progress: { learnedWords: 0, totalWords: 0, progressPct: 0 } },
    ]);
    expect(container.querySelector(".milestone-header-mastered")).toBeNull();
  });
});
