// tests/components/translation/TranslationPage.test.tsx
// The standalone Translation page: Next on the last sentence asks first, then
// opens the next lesson's first part — or reads "Lesson complete" when the level
// has no further lesson.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TranslationPage from "@/app/learner/translation/page";
import { I18nProvider } from "@/components/i18n/I18nProvider";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams("passage_id=H2_2_1"),
}));

vi.mock("@/hooks/shared/useTranslation", () => ({
  useTranslation: () => ({
    loading: false,
    error: null,
    rows: [{ translation_id: "H2_2_1", cn: "起床了吗？", vn: "Dậy chưa?", en: "Are you up?" }],
  }),
}));

const resolveNext = vi.fn();
vi.mock("@/lib/api/learner/lessons", () => ({
  resolveNextLessonFirstPart: (id: string) => resolveNext(id),
}));
const saveRecent = vi.fn();
vi.mock("@/lib/api/learner/recent", () => ({
  saveRecentLearning: (id: string) => saveRecent(id),
}));
vi.mock("@/hooks/lesson/useCurrentLesson", () => ({ invalidateCurrentLesson: vi.fn() }));

vi.mock("@/components/page/learner/lesson/LessonStudyShell", () => ({
  LessonStudyShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

function renderPage() {
  return render(
    <I18nProvider>
      <TranslationPage />
    </I18nProvider>
  );
}

describe("TranslationPage — next lesson from the last sentence", () => {
  beforeEach(() => {
    push.mockReset();
    resolveNext.mockReset();
    saveRecent.mockReset();
  });

  it("confirms, then opens the next lesson's first part", async () => {
    resolveNext.mockResolvedValue("H2_3_1");
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /Next lesson/ }));
    // Nothing moves until the learner confirms.
    expect(resolveNext).not.toHaveBeenCalled();

    const dialog = screen.getByRole("dialog");
    fireEvent.click(
      Array.from(dialog.querySelectorAll("button")).find((b) =>
        /Next lesson/.test(b.textContent ?? "")
      )!
    );

    await waitFor(() => expect(push).toHaveBeenCalledWith("/learner/lesson?passage_id=H2_3_1"));
    expect(resolveNext).toHaveBeenCalledWith("H2_2_1");
    expect(saveRecent).toHaveBeenCalledWith("H2_3_1");
  });

  it("reads as complete and stays put on the level's last lesson", async () => {
    resolveNext.mockResolvedValue(null);
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /Next lesson/ }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(
      Array.from(dialog.querySelectorAll("button")).find((b) =>
        /Next lesson/.test(b.textContent ?? "")
      )!
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Lesson complete/i })).toBeDisabled()
    );
    expect(push).not.toHaveBeenCalled();
  });
});
