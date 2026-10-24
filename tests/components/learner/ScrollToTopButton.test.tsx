// tests/components/learner/ScrollToTopButton.test.tsx
// The floating back-to-top button: hidden near the top, shown once the scroller is
// past the threshold, and smooth-scrolls to the top on click. With no styled
// scrollable ancestor in jsdom the component falls back to the window, so these
// drive window.scrollY / window.scrollTo.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import { ScrollToTopButton } from "@/components/page/learner/shared/ScrollToTopButton";

vi.mock("@/components/i18n/I18nProvider", () => ({
  useT: () => ({ t: (k: string) => k, lang: "en" }),
}));

function setScrollY(y: number) {
  Object.defineProperty(window, "scrollY", { value: y, writable: true, configurable: true });
}

beforeEach(() => {
  setScrollY(0);
  window.scrollTo = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
  setScrollY(0);
});

describe("ScrollToTopButton", () => {
  it("stays hidden until the scroller passes the threshold", () => {
    const { container } = render(<ScrollToTopButton threshold={300} />);
    const btn = container.querySelector(".scroll-to-top") as HTMLElement;
    expect(btn.className).not.toContain("is-visible");

    setScrollY(400);
    act(() => void window.dispatchEvent(new Event("scroll")));
    expect(btn.className).toContain("is-visible");
  });

  it("hides again when scrolled back near the top", () => {
    setScrollY(400);
    const { container } = render(<ScrollToTopButton threshold={300} />);
    const btn = container.querySelector(".scroll-to-top") as HTMLElement;
    expect(btn.className).toContain("is-visible");

    setScrollY(50);
    act(() => void window.dispatchEvent(new Event("scroll")));
    expect(btn.className).not.toContain("is-visible");
  });

  it("smooth-scrolls to the top on click", () => {
    setScrollY(400);
    const { container } = render(<ScrollToTopButton />);
    const btn = container.querySelector(".scroll-to-top") as HTMLElement;

    fireEvent.click(btn);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });
});
