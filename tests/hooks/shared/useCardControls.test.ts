// tests/hooks/shared/useCardControls.test.ts
// The shared card-learner controls. The key behaviour here: S toggles the pinyin +
// meaning (show, then hide again — a listening/recall self-check), while W always
// reveals; and the text resets to hidden whenever the card changes.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCardControls } from "@/hooks/shared/useCardControls";

function press(key: string) {
  act(() => void document.dispatchEvent(new KeyboardEvent("keydown", { key })));
}

const noop = () => {};

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useCardControls — S shows and hides the text", () => {
  it("toggles revealed on each S press", () => {
    const { result } = renderHook(() =>
      useCardControls({ resetKey: 0, onPrev: noop, onNext: noop, onPlayAudio: noop })
    );
    expect(result.current.revealed).toBe(false);

    press("s");
    expect(result.current.revealed).toBe(true);

    press("s");
    expect(result.current.revealed).toBe(false);
  });

  it("toggleReveal() flips the same state as the S key", () => {
    const { result } = renderHook(() =>
      useCardControls({ resetKey: 0, onPrev: noop, onNext: noop, onPlayAudio: noop })
    );

    act(() => result.current.toggleReveal());
    expect(result.current.revealed).toBe(true);
    act(() => result.current.toggleReveal());
    expect(result.current.revealed).toBe(false);
  });

  it("W always reveals and never hides, even after S hid it", () => {
    const onPlayAudio = vi.fn();
    const { result } = renderHook(() =>
      useCardControls({ resetKey: 0, onPrev: noop, onNext: noop, onPlayAudio })
    );

    press("w");
    expect(result.current.revealed).toBe(true);
    expect(onPlayAudio).toHaveBeenCalledTimes(1);

    // A second W keeps it shown (reveal is not a toggle).
    press("w");
    expect(result.current.revealed).toBe(true);
  });

  it("resets to hidden when the card changes", () => {
    const { result, rerender } = renderHook(
      ({ key }: { key: number }) =>
        useCardControls({ resetKey: key, onPrev: noop, onNext: noop, onPlayAudio: noop }),
      { initialProps: { key: 0 } }
    );

    press("s");
    expect(result.current.revealed).toBe(true);

    rerender({ key: 1 });
    expect(result.current.revealed).toBe(false);
  });

  it("ignores S while a text field is focused", () => {
    const { result } = renderHook(() =>
      useCardControls({ resetKey: 0, onPrev: noop, onNext: noop, onPlayAudio: noop })
    );

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    act(() => void input.dispatchEvent(new KeyboardEvent("keydown", { key: "s", bubbles: true })));
    expect(result.current.revealed).toBe(false);
    input.remove();
  });
});
