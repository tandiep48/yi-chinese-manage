// tests/components/home/LessonTab.test.tsx
// The dashboard Lesson tab mirrors the milestone step into ?step= for refresh-
// resume. Entering or leaving a trainer step (3, 6) writes ?step= and ?run= in the
// same tick; the regression guarded here is that the step write lands SYNCHRONOUSLY
// (history.replaceState) and merges, so it composes with the ?run= write instead of
// one clobbering the other. Before the fix the step write went through the async
// router.replace, so ?step stuck at the pre-trainer step and a refresh snapped the
// milestone back a step.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LessonTab } from "@/components/page/learner/home/LessonTab";

vi.mock("@/components/i18n/I18nProvider", () => ({
  useT: () => ({ t: (k: string) => k, lang: "en" }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  // Reads the live URL, like the real hook.
  useSearchParams: () => new URLSearchParams(window.location.search),
}));
vi.mock("@/hooks/lesson/useCurrentLesson", () => ({
  useCurrentLesson: () => ({ loading: false, lesson: { passage_id: "H1_3_1" } }),
}));

// Expose the milestone seam: a button fires onStepChange(step), another reports the
// initialStep the tab handed down (from ?step=).
let captured: { onStepChange?: (s: number) => void; initialStep?: number } = {};
vi.mock("@/components/page/learner/lesson/LessonFlow", () => ({
  LessonFlow: (p: { onStepChange?: (s: number) => void; initialStep?: number }) => {
    captured = p;
    return (
      <div>
        <span data-testid="initial-step">{String(p.initialStep)}</span>
        <button onClick={() => p.onStepChange?.(6)}>to-6</button>
      </div>
    );
  },
}));

function setUrl(search: string) {
  window.history.replaceState({}, "", `/learner${search}`);
}

beforeEach(() => {
  captured = {};
  setUrl("");
});

describe("LessonTab — ?step= persistence", () => {
  it("seeds initialStep from ?step=", () => {
    setUrl("?tab=lesson&step=4");
    render(<LessonTab run={null} setRun={vi.fn()} />);
    expect(screen.getByTestId("initial-step")).toHaveTextContent("4");
  });

  it("writes the step synchronously and preserves tab and run", () => {
    // The moment a trainer step is entered: ?run= has just been written, ?step= is
    // still the previous step. onStepChange must update ?step in place without
    // dropping ?run (the param the old async write clobbered).
    setUrl("?tab=lesson&step=5&run=lesson-trainer");
    render(<LessonTab run="lesson-trainer" setRun={vi.fn()} />);

    fireEvent.click(screen.getByText("to-6"));

    // Synchronously reflected on window.location (no router round trip), with tab and
    // run intact.
    const params = new URLSearchParams(window.location.search);
    expect(params.get("step")).toBe("6");
    expect(params.get("tab")).toBe("lesson");
    expect(params.get("run")).toBe("lesson-trainer");
  });

  it("does not rewrite when the step is already current", () => {
    setUrl("?tab=lesson&step=6");
    render(<LessonTab run={null} setRun={vi.fn()} />);
    const before = window.location.search;
    captured.onStepChange?.(6);
    expect(window.location.search).toBe(before);
  });
});
