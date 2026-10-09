// tests/components/learner/LessonSidebar.test.tsx
// Part navigation from the lesson-study sidebar. The regression: on the grammar /
// translation pages the passage id is the same as the part's, so clicking that part
// used to be swallowed by an `id === passageId` guard and never returned to the
// lesson view. next/navigation, useLessonParts and i18n are mocked.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LessonSidebar } from "@/components/page/learner/lesson/LessonSidebar";

vi.mock("@/components/i18n/I18nProvider", () => ({
  useT: () => ({ t: (k: string) => k, lang: "en" }),
}));

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

vi.mock("@/hooks/lesson/useLessonParts", () => ({
  useLessonParts: () => ({
    loading: false,
    error: null,
    header: { badge: "HSK1", lessonNum: "1", isBook: false },
    parts: [
      { passageId: "H1_1_1", partNum: "1", isNumber: false, title: null, progress: null },
      { passageId: "H1_1_2", partNum: "2", isNumber: false, title: null, progress: null },
    ],
  }),
}));

beforeEach(() => push.mockClear());

describe("LessonSidebar part navigation", () => {
  it("returns to the lesson view when the current part is clicked from the grammar page", () => {
    render(<LessonSidebar passageId="H1_1_1" domain="grammar" open onOpenChange={() => {}} />);
    // On the grammar page the Parts accordion starts collapsed — expand it first.
    fireEvent.click(screen.getByText("sidebar.lesson_parts"));
    fireEvent.click(screen.getByText("picker.part_prefix 1"));
    expect(push).toHaveBeenCalledWith("/learner/lesson?passage_id=H1_1_1");
  });

  it("does not navigate when the already-active part is clicked on the lesson page", () => {
    render(<LessonSidebar passageId="H1_1_1" domain="lesson" open onOpenChange={() => {}} />);
    // The Parts accordion is expanded by default on the lesson page.
    fireEvent.click(screen.getByText("picker.part_prefix 1"));
    expect(push).not.toHaveBeenCalled();
  });

  it("navigates to a different part on the lesson page", () => {
    render(<LessonSidebar passageId="H1_1_1" domain="lesson" open onOpenChange={() => {}} />);
    fireEvent.click(screen.getByText("picker.part_prefix 2"));
    expect(push).toHaveBeenCalledWith("/learner/lesson?passage_id=H1_1_2");
  });
});
