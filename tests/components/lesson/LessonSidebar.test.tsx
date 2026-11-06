import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LessonSidebar } from "@/components/page/learner/lesson/LessonSidebar";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import * as partsHook from "@/hooks/lesson/useLessonParts";
import type {
  SidebarPart,
  LessonPartsHeader,
} from "@/hooks/lesson/useLessonParts";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/hooks/lesson/useLessonParts");

const HEADER: LessonPartsHeader = {
  badge: "HSK2",
  lessonNum: "2",
  isBook: false,
};
const LESSON_PROGRESS = { learnedWords: 4, totalWords: 12, progressPct: 50 };
const PARTS: SidebarPart[] = [
  {
    passageId: "H2_2_1",
    partNum: "1",
    isNumber: false,
    title: "Lili likes to run.",
    progress: null,
  },
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
  domain: "lesson" | "grammar" | "translation" = "lesson",
) {
  const onOpenChange = vi.fn();
  const utils = render(
    <I18nProvider>
      <LessonSidebar
        passageId={passageId}
        domain={domain}
        open={open}
        onOpenChange={onOpenChange}
      />
    </I18nProvider>,
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
      lessonProgress: LESSON_PROGRESS,
      header: HEADER,
    });
  });

  it("renders the header badge, lesson title, the Parts accordion and the two domain buttons", () => {
    renderSidebar();
    expect(screen.getByText("HSK2")).toBeInTheDocument();
    expect(screen.getByText("Lesson 2")).toBeInTheDocument();
    expect(screen.getByText("Lesson Parts")).toBeInTheDocument();
    expect(screen.getByText("Grammar")).toBeInTheDocument();
    expect(screen.getByText("Translation")).toBeInTheDocument();
  });

  it("marks the active domain and opens the other in a single click", () => {
    renderSidebar(true, "H2_2_2", "grammar");
    // Grammar is the active domain; its entry carries the active class, no expand step.
    expect(screen.getByText("Grammar").closest(".acc-item")).toHaveClass(
      "active",
    );

    // Translation is a direct button now — one click navigates.
    fireEvent.click(screen.getByText("Translation"));
    expect(push).toHaveBeenCalledWith("/learner/translation?passage_id=H2_2_2");
  });

  it("navigates to the grammar page in one click from the lesson domain", () => {
    renderSidebar(true, "H2_2_2", "lesson");
    fireEvent.click(screen.getByText("Grammar"));
    expect(push).toHaveBeenCalledWith("/learner/grammar?passage_id=H2_2_2");
  });

  it("renders a single Exam entry", () => {
    renderSidebar();
    expect(screen.getByText("Exam")).toBeInTheDocument();
    // The two separate master-trainer entries are gone.
    expect(screen.queryByText("Master Vocab Trainer")).not.toBeInTheDocument();
    expect(screen.queryByText("Master Lesson Trainer")).not.toBeInTheDocument();
  });

  it("shows the lesson's total vocab and lesson progress on the Exam entry", () => {
    renderSidebar();
    // The aggregate words count (4/12) is unique to the Exam entry's mini-stats.
    expect(screen.getByText("4/12")).toBeInTheDocument();
  });

  it("opens the Exam chooser and starts the picked master in place via onStartMaster", () => {
    const onStartMaster = vi.fn();
    render(
      <I18nProvider>
        <LessonSidebar
          passageId="H2_2_2"
          domain="lesson"
          open
          onOpenChange={vi.fn()}
          onStartMaster={onStartMaster}
        />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByText("Exam"));
    fireEvent.click(screen.getByText("Vocab Trainer"));
    expect(onStartMaster).toHaveBeenCalledWith("vocab");

    // Re-open and pick the lesson trainer this time.
    fireEvent.click(screen.getByText("Exam"));
    fireEvent.click(screen.getByText("Lesson Trainer"));
    expect(onStartMaster).toHaveBeenCalledWith("lesson");
    expect(push).not.toHaveBeenCalled();
  });

  it("navigates to the lesson flow with ?master= when no in-place handler is given", () => {
    renderSidebar(true, "H2_2_2", "grammar");
    fireEvent.click(screen.getByText("Exam"));
    fireEvent.click(screen.getByText("Vocab Trainer"));
    expect(push).toHaveBeenCalledWith(
      "/learner/lesson?passage_id=H2_2_2&master=vocab",
    );
  });

  it("hides the Exam entry for a book lesson", () => {
    vi.mocked(partsHook.useLessonParts).mockReturnValue({
      loading: false,
      error: null,
      parts: PARTS,
      lessonProgress: null,
      header: { badge: "AML", lessonNum: "1", isBook: true },
    });
    renderSidebar(true, "AML_1_1");
    expect(screen.queryByText("Exam")).not.toBeInTheDocument();
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
      lessonProgress: null,
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
        <LessonSidebar
          passageId="H2_2_2"
          open={false}
          onOpenChange={onOpenChange}
        />
      </I18nProvider>,
    );
    expect(
      screen.getByRole("button", { name: "Open Sidebar" }),
    ).toBeInTheDocument();
  });

  it("shows the empty state when the lesson has no parts", () => {
    vi.mocked(partsHook.useLessonParts).mockReturnValue({
      loading: false,
      error: null,
      parts: [],
      lessonProgress: null,
      header: HEADER,
    });
    renderSidebar();
    expect(screen.getByText("No parts found.")).toBeInTheDocument();
  });
});
