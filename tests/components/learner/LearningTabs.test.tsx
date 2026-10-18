import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { LearningTabs } from "@/components/page/learner/picker/LearningTabs";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { usePathname } from "next/navigation";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));

function renderTabs() {
  return render(
    <I18nProvider>
      <LearningTabs />
    </I18nProvider>
  );
}

describe("LearningTabs", () => {
  beforeEach(() => vi.resetAllMocks());

  it("marks the HSK tab active on the /hsk routes", () => {
    vi.mocked(usePathname).mockReturnValue("/learner/hsk/HSK2");
    renderTabs();

    expect(screen.getByText("HSK Lessons")).toHaveClass("active");
    expect(screen.getByText("Books")).not.toHaveClass("active");
  });

  it("marks the Books tab active on the /books routes", () => {
    vi.mocked(usePathname).mockReturnValue("/learner/books/AML");
    renderTabs();

    expect(screen.getByText("Books")).toHaveClass("active");
    expect(screen.getByText("HSK Lessons")).not.toHaveClass("active");
  });

  it("links each tab to its route", () => {
    vi.mocked(usePathname).mockReturnValue("/learner/hsk");
    renderTabs();

    expect(screen.getByText("HSK Lessons")).toHaveAttribute("href", "/learner/hsk");
    expect(screen.getByText("Books")).toHaveAttribute("href", "/learner/books");
    expect(screen.getByText("Practice")).toHaveAttribute("href", "/learner/practice");
    expect(screen.getByText("Exam")).toHaveAttribute("href", "/learner/exam");
  });

  it("marks Practice active on its routes without lighting the others", () => {
    vi.mocked(usePathname).mockReturnValue("/learner/practice/3");
    renderTabs();

    expect(screen.getByText("Practice")).toHaveClass("active");
    expect(screen.getByText("Exam")).not.toHaveClass("active");
    expect(screen.getByText("HSK Lessons")).not.toHaveClass("active");
  });

  it("marks Exam active on its routes", () => {
    vi.mocked(usePathname).mockReturnValue("/learner/exam");
    renderTabs();

    expect(screen.getByText("Exam")).toHaveClass("active");
    expect(screen.getByText("Practice")).not.toHaveClass("active");
  });
});
