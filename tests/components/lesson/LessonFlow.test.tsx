// tests/components/lesson/LessonFlow.test.tsx
// Two end-of-lesson behaviours:
//  - Translation → Next asks to confirm, then (on confirm) makes the next lesson the
//    learner's current lesson so the dashboard follows it — no completion gate.
//  - Finishing the last part offers the two master trainers (Vocab, then Lesson)
//    before Grammar; each is independently skippable.
// The milestone, master stage, study panels, shell, data hooks and navigation are mocked.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { LessonFlow } from "@/components/page/learner/lesson/LessonFlow";
import { resolveNextLessonFirstPart } from "@/lib/api/learner/lessons";
import { saveRecentLearning } from "@/lib/api/learner/recent";
import { invalidateCurrentLesson } from "@/hooks/lesson/useCurrentLesson";

vi.mock("@/components/i18n/I18nProvider", () => ({
  useT: () => ({ t: (k: string) => k, lang: "en" }),
}));
vi.mock("@/hooks/lesson/useLessonParts", () => ({
  useLessonParts: () => ({
    loading: false,
    error: null,
    header: null,
    parts: [{ passageId: "H2_1_1", partNum: "1", isNumber: false, title: null, progress: null }],
  }),
}));
vi.mock("@/hooks/shared/useGrammar", () => ({
  useGrammar: () => ({ loading: false, error: null, sections: [] }),
}));
vi.mock("@/hooks/shared/useTranslation", () => ({
  useTranslation: () => ({ loading: false, error: null, rows: [] }),
}));
vi.mock("@/lib/api/learner/lessons", () => ({
  resolveNextLessonFirstPart: vi.fn(),
}));
vi.mock("@/lib/api/learner/recent", () => ({ saveRecentLearning: vi.fn() }));
vi.mock("@/hooks/lesson/useCurrentLesson", () => ({ invalidateCurrentLesson: vi.fn() }));

// The milestone exposes a button that fires onLessonComplete, so a test can reach the
// end-of-lesson sequence without driving the real six steps.
vi.mock("@/components/page/learner/milestone/MilestoneRunner", () => ({
  MilestoneRunner: ({ onLessonComplete }: { onLessonComplete?: () => void }) => (
    <div data-testid="milestone">
      <button onClick={() => onLessonComplete?.()}>complete-lesson</button>
    </div>
  ),
}));
// The master stage is driven only through its onDone seam here.
vi.mock("@/components/page/learner/lesson/MasterTrainerStage", () => ({
  MasterTrainerStage: ({ engine, onDone }: { engine: string; onDone: () => void }) => (
    <div data-testid={`master-${engine}`}>
      <button onClick={onDone}>master-done</button>
    </div>
  ),
}));
vi.mock("@/components/page/learner/grammar/GrammarPanel", () => ({
  GrammarPanel: () => <div data-testid="grammar-panel" />,
}));
vi.mock("@/components/page/learner/translation/TranslationPanel", () => ({
  TranslationPanel: () => <div data-testid="translation-panel" />,
}));
vi.mock("@/components/page/learner/lesson/LessonStudyShell", () => ({
  LessonStudyShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockResolveNext = vi.mocked(resolveNextLessonFirstPart);
const mockSaveRecent = vi.mocked(saveRecentLearning);
const mockInvalidate = vi.mocked(invalidateCurrentLesson);

describe("LessonFlow — Translation → Next confirm (#1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveRecent.mockResolvedValue(undefined);
  });

  it("confirms before rolling on, then persists the next lesson as current", async () => {
    mockResolveNext.mockResolvedValue("H2_2_1");
    render(<LessonFlow passageId="H2_1_1" initialDomain="translation" />);

    expect(screen.getByTestId("translation-panel")).toBeInTheDocument();
    // The nav Next opens the confirm dialog — it does not advance yet.
    fireEvent.click(screen.getByText("milestone.next_lesson"));
    expect(mockResolveNext).not.toHaveBeenCalled();

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("milestone.next_lesson_confirm_title")).toBeInTheDocument();

    fireEvent.click(within(dialog).getByText("milestone.next_lesson"));
    await waitFor(() => {
      expect(mockResolveNext).toHaveBeenCalledWith("H2_1_1");
      expect(mockSaveRecent).toHaveBeenCalledWith("H2_2_1");
      expect(mockInvalidate).toHaveBeenCalled();
    });
  });

  it("cancelling the confirm keeps the learner on Translation and advances nothing", async () => {
    mockResolveNext.mockResolvedValue("H2_2_1");
    render(<LessonFlow passageId="H2_1_1" initialDomain="translation" />);

    fireEvent.click(screen.getByText("milestone.next_lesson"));
    fireEvent.click(screen.getByText("milestone.confirm_cancel_btn"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByTestId("translation-panel")).toBeInTheDocument();
    expect(mockResolveNext).not.toHaveBeenCalled();
    expect(mockSaveRecent).not.toHaveBeenCalled();
  });

  it("does not persist anything at the last lesson of the level", async () => {
    mockResolveNext.mockResolvedValue(null);
    render(<LessonFlow passageId="H2_1_1" initialDomain="translation" />);

    fireEvent.click(screen.getByText("milestone.next_lesson"));
    fireEvent.click(within(screen.getByRole("dialog")).getByText("milestone.next_lesson"));

    await waitFor(() => expect(mockResolveNext).toHaveBeenCalled());
    expect(mockSaveRecent).not.toHaveBeenCalled();
    expect(mockInvalidate).not.toHaveBeenCalled();
  });
});

describe("LessonFlow — end-of-lesson master trainers (#5)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs Vocab then Lesson master, then Grammar, when both are confirmed", () => {
    render(<LessonFlow passageId="H2_1_1" />);

    fireEvent.click(screen.getByText("complete-lesson"));
    // First prompt: Master Vocab.
    expect(screen.getByText("milestone.master_vocab_confirm_title")).toBeInTheDocument();
    fireEvent.click(screen.getByText("milestone.confirm_start_btn"));
    expect(screen.getByTestId("master-vocab")).toBeInTheDocument();

    // Finishing it prompts for Master Lesson.
    fireEvent.click(screen.getByText("master-done"));
    expect(screen.getByText("milestone.master_lesson_confirm_title")).toBeInTheDocument();
    fireEvent.click(screen.getByText("milestone.confirm_start_btn"));
    expect(screen.getByTestId("master-lesson")).toBeInTheDocument();

    // Finishing the lesson trainer continues the flow into Grammar.
    fireEvent.click(screen.getByText("master-done"));
    expect(screen.getByTestId("grammar-panel")).toBeInTheDocument();
  });

  it("skipping Vocab still offers Lesson; skipping that goes straight to Grammar", () => {
    render(<LessonFlow passageId="H2_1_1" />);

    fireEvent.click(screen.getByText("complete-lesson"));
    fireEvent.click(screen.getByText("milestone.confirm_skip_btn")); // skip Vocab
    expect(screen.queryByTestId("master-vocab")).not.toBeInTheDocument();
    expect(screen.getByText("milestone.master_lesson_confirm_title")).toBeInTheDocument();

    fireEvent.click(screen.getByText("milestone.confirm_skip_btn")); // skip Lesson
    expect(screen.getByTestId("grammar-panel")).toBeInTheDocument();
  });
});
