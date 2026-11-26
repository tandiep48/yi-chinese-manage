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
    expect(screen.getByRole("button", { name: "Step 1 of 6: Vocab Summary" })).toHaveTextContent(
      "Step 1Vocab Summary"
    );
    expect(screen.getByRole("button", { name: "Step 2 of 6: Vocab Learner" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Step 6 of 6: Lesson Trainer" })).toBeInTheDocument();
    // Six step tiles plus the previous / next arrows.
    expect(screen.getAllByRole("button")).toHaveLength(8);
  });

  it("steps back and forward with the arrows, disabled at either end", () => {
    const { onSelect, rerender } = renderBar(2);
    fireEvent.click(screen.getByRole("button", { name: "Back one step" }));
    expect(onSelect).toHaveBeenLastCalledWith(1);
    fireEvent.click(screen.getByRole("button", { name: "Forward one step" }));
    expect(onSelect).toHaveBeenLastCalledWith(3);

    rerender(
      <I18nProvider>
        <MilestoneBar step={1} totalSteps={6} isCompleted={() => false} onSelect={onSelect} />
      </I18nProvider>
    );
    expect(screen.getByRole("button", { name: "Back one step" })).toBeDisabled();
    rerender(
      <I18nProvider>
        <MilestoneBar step={6} totalSteps={6} isCompleted={() => false} onSelect={onSelect} />
      </I18nProvider>
    );
    expect(screen.getByRole("button", { name: "Forward one step" })).toBeDisabled();
  });

  it("marks the done and current steps, and only the current one pulses", () => {
    const { container } = renderBar(2, [1]);
    const done = screen.getByRole("button", { name: /Step 1 of 6/ });
    const current = screen.getByRole("button", { name: /Step 2 of 6/ });
    expect(done).toHaveClass("is-done");
    expect(current).toHaveClass("is-current");
    expect(current).toHaveAttribute("aria-current", "step");
    expect(container.querySelectorAll(".milestone-segment-pulse")).toHaveLength(1);
    // The tiles carry no number badge; a finished step has a single check mark.
    expect(done.querySelector(".milestone-segment-num")).toBeNull();
    expect(done.querySelectorAll("svg")).toHaveLength(1);
  });

  it("scrolls the strip to centre the current step on load and on each change", () => {
    const scrollTo = vi.fn();
    const rect = vi
      .spyOn(Element.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: Element) {
        if (this.classList.contains("milestone-segments")) return new DOMRect(50, 0, 200, 56);
        const tiles = Array.from(document.querySelectorAll(".milestone-segment"));
        const index = tiles.indexOf(this);
        return new DOMRect(50 + index * 160, 0, 150, 56);
      });
    Element.prototype.scrollTo = scrollTo;
    const { rerender, onSelect } = renderBar(3);
    // Tile 3 starts 320px in; centring a 150px tile in 200px leaves 25px each side.
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 295, behavior: "auto" });

    rerender(
      <I18nProvider>
        <MilestoneBar step={4} totalSteps={6} isCompleted={() => false} onSelect={onSelect} />
      </I18nProvider>
    );
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 455, behavior: "smooth" });

    rect.mockRestore();
    Reflect.deleteProperty(Element.prototype, "scrollTo");
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
    const header = <MilestoneHeader passageId="H2_2_1" />;
    return render(
      <I18nProvider>
        {parts ? (
          <LessonOutlineContext.Provider value={{ parts }}>
            {header}
          </LessonOutlineContext.Provider>
        ) : (
          header
        )}
      </I18nProvider>
    );
  }

  it("shows the breadcrumb up the library without an outline", () => {
    renderHeader(null);
    expect(screen.getByRole("link", { name: "Library" })).toHaveAttribute("href", "/learner/hsk");
    expect(screen.getByRole("link", { name: "HSK 2" })).toHaveAttribute("href", "/learner/hsk/HSK2");
    expect(screen.getByRole("link", { name: "Lesson 2" })).toHaveAttribute(
      "href",
      "/learner/hsk/HSK2/2"
    );
    expect(screen.queryByText(/Mastered/)).toBeNull();
  });

  it("ends the breadcrumb on the part and shows no mastered chip", () => {
    const { container } = renderHeader([PART]);
    expect(screen.getByText("Part 1")).toHaveAttribute("aria-current", "page");
    expect(container.querySelector(".milestone-header-mastered")).toBeNull();
  });
});
