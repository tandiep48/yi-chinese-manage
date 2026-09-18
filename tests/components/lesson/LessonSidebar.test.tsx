import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LessonSidebar } from "@/components/page/learner/lesson/LessonSidebar";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import * as partsHook from "@/hooks/lesson/useLessonParts";
import type { SidebarPart, LessonPartsHeader } from "@/hooks/lesson/useLessonParts";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/hooks/lesson/useLessonParts");

const HEADER: LessonPartsHeader = { badge: "HSK2", lessonNum: "2", isBook: false };
const PARTS: SidebarPart[] = [
  { passageId: "H2_2_1", partNum: "1", isNumber: false, title: "Lili likes to run.", progress: null },
  {
    passageId: "H2_2_2",
    partNum: "2",
    isNumber: false,
    title: "Too busy.",
    progress: { learnedWords: 4, totalWords: 8, progressPct: 50 },
  },
];

function renderSidebar(
  open = true,
  passageId = "H2_2_2",
  domain: "lesson" | "grammar" | "translation" = "lesson"
) {
  const onOpenChange = vi.fn();
  const utils = render(
    <I18nProvider>
      <LessonSidebar passageId={passageId} domain={domain} open={open} onOpenChange={onOpenChange} />
    </I18nProvider>
  );
  return { ...utils, onOpenChange };
}

describe("LessonSidebar", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(partsHook.useLessonParts).mockReturnValue({
      loading: false,
      error: null,
      parts: PARTS,
      header: HEADER,
    });
  });

  it("renders the header badge, lesson title and the three accordion sections", () => {
    renderSidebar();
    expect(screen.getByText("HSK2")).toBeInTheDocument();
    expect(screen.getByText("Lesson 2")).toBeInTheDocument();
    expect(screen.getByText("Lesson Parts")).toBeInTheDocument();
    expect(screen.getByText("Grammar")).toBeInTheDocument();
    expect(screen.getByText("Translation")).toBeInTheDocument();
  });

  it("opens the section for the current domain and navigates on the domain step", () => {
    renderSidebar(true, "H2_2_2", "grammar");
    // The Grammar section is expanded (its step is rendered) on the grammar domain.
    const grammarStep = screen.getAllByText("Grammar").at(-1)!.closest("button");
    expect(grammarStep).toHaveClass("active");

    fireEvent.click(screen.getByText("Translation"));
    fireEvent.click(screen.getAllByText("Translation").at(-1)!);
    expect(push).toHaveBeenCalledWith("/learner/translation?passage_id=H2_2_2");
  });

  it("navigates to the grammar page from the lesson domain", () => {
    renderSidebar(true, "H2_2_2", "lesson");
    // Expand Grammar, then click its step.
    fireEvent.click(screen.getByText("Grammar"));
    fireEvent.click(screen.getAllByText("Grammar").at(-1)!);
    expect(push).toHaveBeenCalledWith("/learner/grammar?passage_id=H2_2_2");
  });

  it("lists the parts and marks the current one active", () => {
    renderSidebar();
    expect(screen.getByText("Lili likes to run.")).toBeInTheDocument();
    const active = screen.getByText("Too busy.").closest("button");
    expect(active).toHaveClass("active");
  });

  it("navigates to a part when clicked, but not the current part", () => {
    renderSidebar();
    fireEvent.click(screen.getByText("Lili likes to run."));
    expect(push).toHaveBeenCalledWith("/learner/lesson?passage_id=H2_2_1");

    push.mockClear();
    fireEvent.click(screen.getByText("Too busy."));
    expect(push).not.toHaveBeenCalled();
  });

  it("routes back to the HSK part picker", () => {
    renderSidebar();
    fireEvent.click(screen.getByRole("button", { name: "Part Selection" }));
    expect(push).toHaveBeenCalledWith("/learner/hsk/HSK2/2");
  });

  it("routes back to the book part picker for a book passage", () => {
    vi.mocked(partsHook.useLessonParts).mockReturnValue({
      loading: false,
      error: null,
      parts: PARTS,
      header: { badge: "AML", lessonNum: "1", isBook: true },
    });
    renderSidebar(true, "AML_1_1");
    fireEvent.click(screen.getByRole("button", { name: "Part Selection" }));
    expect(push).toHaveBeenCalledWith("/learner/books/AML/1");
  });

  it("collapses via the close button and exposes the toggle when closed", () => {
    const { onOpenChange, rerender } = renderSidebar(true);
    fireEvent.click(screen.getByRole("button", { name: "Close Sidebar" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    rerender(
      <I18nProvider>
        <LessonSidebar passageId="H2_2_2" open={false} onOpenChange={onOpenChange} />
      </I18nProvider>
    );
    expect(screen.getByRole("button", { name: "Open Sidebar" })).toBeInTheDocument();
  });

  it("shows the empty state when the lesson has no parts", () => {
    vi.mocked(partsHook.useLessonParts).mockReturnValue({
      loading: false,
      error: null,
      parts: [],
      header: HEADER,
    });
    renderSidebar();
    expect(screen.getByText("No parts found.")).toBeInTheDocument();
  });
});
