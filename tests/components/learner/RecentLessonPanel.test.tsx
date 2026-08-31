import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecentLessonPanel } from "@/components/page/learner/RecentLessonPanel";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import * as recentHook from "@/hooks/useRecentLearning";

vi.mock("@/hooks/useRecentLearning");

function renderPanel() {
  return render(
    <I18nProvider>
      <RecentLessonPanel />
    </I18nProvider>
  );
}

describe("RecentLessonPanel", () => {
  beforeEach(() => vi.resetAllMocks());

  it("renders nothing while loading", () => {
    vi.mocked(recentHook.useRecentLearning).mockReturnValue({ loading: true, passageId: null });
    const { container } = renderPanel();
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when there is no recent lesson", () => {
    vi.mocked(recentHook.useRecentLearning).mockReturnValue({ loading: false, passageId: null });
    const { container } = renderPanel();
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the formatted context and a Continue link to the lesson", () => {
    vi.mocked(recentHook.useRecentLearning).mockReturnValue({ loading: false, passageId: "H2_3_1" });
    renderPanel();

    expect(screen.getByText("HSK2 - Lesson 3 - Part 1")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Continue" });
    expect(link).toHaveAttribute("href", "/lesson?passage_id=H2_3_1");
  });
});
