// tests/components/practice/PracticeSelectPage.test.tsx
// The Exercise / Exam level grid: each card's picture loads from the bucket,
// falls back to the local mirror, and finally to the plain level number.

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PracticeSelectPage } from "@/components/page/learner/practice/PracticeSelectPage";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { hskSelectImageUrl } from "@/lib/gcs";

vi.mock("@/components/page/learner/picker/LearningTabs", () => ({
  LearningTabs: () => null,
}));

function renderPage(category: "practice" | "exam") {
  return render(
    <I18nProvider>
      <PracticeSelectPage category={category} />
    </I18nProvider>
  );
}

describe("PracticeSelectPage level images", () => {
  it.each(["practice", "exam"] as const)("loads the %s pictures from the bucket", (category) => {
    renderPage(category);
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(6);
    expect(images[0]).toHaveAttribute("src", hskSelectImageUrl(category, 1));
    expect(images[5]).toHaveAttribute("src", hskSelectImageUrl(category, 6));
  });

  it("falls back to the local mirror, then to the level number", () => {
    const { container } = renderPage("exam");
    fireEvent.error(screen.getAllByRole("img")[0]);
    const local = screen.getAllByRole("img")[0];
    expect(local).toHaveAttribute("src", "/gcs/hsk_images/exam/hsk1.jpg");

    fireEvent.error(local);
    expect(screen.getAllByRole("img")).toHaveLength(5);
    expect(container.querySelector(".card-icon")).toHaveTextContent("1");
  });

  it("builds the bucket path per category and level", () => {
    expect(hskSelectImageUrl("practice", 3)).toMatch(/\/hsk_images\/practice\/hsk3\.jpg$/);
  });
});
