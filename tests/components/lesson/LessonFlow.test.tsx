// tests/components/lesson/LessonFlow.test.tsx
// Rolling on to the next lesson (Translation → Next) must also make that lesson the
// learner's current lesson, so the dashboard follows it — there is no completion
// gate. The milestone, study panels, shell, data hooks and navigation are mocked.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
vi.mock("@/components/page/learner/milestone/MilestoneRunner", () => ({
  MilestoneRunner: () => <div data-testid="milestone" />,
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

describe("LessonFlow next-lesson advance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveRecent.mockResolvedValue(undefined);
  });

  it("persists the next lesson as current when Next rolls on from Translation", async () => {
    mockResolveNext.mockResolvedValue("H2_2_1");
    render(<LessonFlow passageId="H2_1_1" initialDomain="translation" />);

    // The translation view is showing; its Next button rolls on to the next lesson.
    expect(screen.getByTestId("translation-panel")).toBeInTheDocument();
    fireEvent.click(screen.getByText("milestone.next_lesson"));

    await waitFor(() => {
      expect(mockResolveNext).toHaveBeenCalledWith("H2_1_1");
      // The crux: advancing saves the next lesson as current and drops the cache so
      // the dashboard reflects it — no 100% completion required.
      expect(mockSaveRecent).toHaveBeenCalledWith("H2_2_1");
      expect(mockInvalidate).toHaveBeenCalled();
    });
    // The flow switches into the next lesson's milestone.
    await screen.findByTestId("milestone");
  });

  it("does not persist anything at the last lesson of the level", async () => {
    mockResolveNext.mockResolvedValue(null);
    render(<LessonFlow passageId="H2_1_1" initialDomain="translation" />);

    fireEvent.click(screen.getByText("milestone.next_lesson"));

    await waitFor(() => expect(mockResolveNext).toHaveBeenCalled());
    expect(mockSaveRecent).not.toHaveBeenCalled();
    expect(mockInvalidate).not.toHaveBeenCalled();
  });
});
