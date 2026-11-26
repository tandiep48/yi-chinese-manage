// tests/components/trainer/TrainerShellCompact.test.tsx
// The milestone's compact trainer: no topbar, and on phones each new task is
// scrolled into view. The solo trainers are unchanged.

import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { TrainerShell } from "@/components/page/learner/trainer/TrainerShell";
import { I18nProvider } from "@/components/i18n/I18nProvider";

function shell(compact: boolean, taskKey = 0) {
  return (
    <I18nProvider>
      <TrainerShell
        screen="training"
        subtitle="HSK2"
        onQuit={vi.fn()}
        compact={compact}
        taskKey={taskKey}
      />
    </I18nProvider>
  );
}

function stubViewport(phone: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: phone && query.includes("max-width"),
  }));
  const scroll = vi.fn();
  Element.prototype.scrollIntoView = scroll;
  return scroll;
}

describe("TrainerShell compact", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(Element.prototype, "scrollIntoView");
  });

  it("drops the topbar only when compact", () => {
    expect(render(shell(false)).container.querySelector(".trainer-topbar")).not.toBeNull();
    const { container } = render(shell(true));
    expect(container.querySelector(".trainer-topbar")).toBeNull();
    expect(container.querySelector(".trainer-shell")).toHaveClass("compact");
  });

  it("scrolls each new task into view on a phone", () => {
    const scroll = stubViewport(true);
    const { rerender } = render(shell(true, 0));
    rerender(shell(true, 1));
    expect(scroll).toHaveBeenCalledTimes(2);
    expect(scroll).toHaveBeenLastCalledWith({ block: "start", behavior: "smooth" });
  });

  it("does not scroll on a wide screen", () => {
    const scroll = stubViewport(false);
    render(shell(true));
    expect(scroll).not.toHaveBeenCalled();
  });

  it("does not scroll in the solo trainer", () => {
    const scroll = stubViewport(true);
    render(shell(false));
    expect(scroll).not.toHaveBeenCalled();
  });
});
