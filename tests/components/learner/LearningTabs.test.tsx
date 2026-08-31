import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { LearningTabs } from "@/components/page/learner/LearningTabs";
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
    vi.mocked(usePathname).mockReturnValue("/hsk/HSK2");
    renderTabs();

    expect(screen.getByText("HSK Lessons")).toHaveClass("active");
    expect(screen.getByText("Books")).not.toHaveClass("active");
  });

  it("marks the Books tab active on the /books routes", () => {
    vi.mocked(usePathname).mockReturnValue("/books/AML");
    renderTabs();

    expect(screen.getByText("Books")).toHaveClass("active");
    expect(screen.getByText("HSK Lessons")).not.toHaveClass("active");
  });

  it("links each tab to its route", () => {
    vi.mocked(usePathname).mockReturnValue("/hsk");
    renderTabs();

    expect(screen.getByText("HSK Lessons")).toHaveAttribute("href", "/hsk");
    expect(screen.getByText("Books")).toHaveAttribute("href", "/books");
  });
});
