// tests/lib/hanConvert.test.ts
// Covers the pure font/script helpers and the DOM converter's convert / restore
// / observer behaviour — including the React-reconciliation edge cases the
// legacy first-seen WeakMap couldn't handle. Uses a fake converter (no OpenCC
// network) that maps a couple of simplified chars to traditional.

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  fontStack,
  normalizeFont,
  normalizeScript,
  createHanConverter,
  DEFAULT_FONT,
  DEFAULT_SCRIPT,
} from "@/lib/han/hanConvert";

// 简体 -> 繁體 style mapping for the chars used in these tests.
const MAP: Record<string, string> = { 学: "學", 习: "習", 汉: "漢", 语: "語" };
const fakeConverter = (text: string) =>
  text.replace(/[学习汉语]/g, (c) => MAP[c] ?? c);

describe("fontStack", () => {
  it("puts Roboto first so Latin stays Roboto and only CJK swaps", () => {
    expect(fontStack("SimSun")).toBe(
      "Roboto, 'SimSun', 'Noto Sans', Helvetica, sans-serif"
    );
  });
  it("falls back to the default face for unknown/empty input", () => {
    expect(fontStack("Comic Sans")).toContain(`'${DEFAULT_FONT}'`);
    expect(fontStack(null)).toContain(`'${DEFAULT_FONT}'`);
  });
});

describe("normalizeFont / normalizeScript", () => {
  it("passes allowed values through", () => {
    expect(normalizeFont("Roboto")).toBe("Roboto");
    expect(normalizeScript("traditional")).toBe("traditional");
  });
  it("clamps anything else to the default", () => {
    expect(normalizeFont("Nope")).toBe(DEFAULT_FONT);
    expect(normalizeFont(null)).toBe(DEFAULT_FONT);
    expect(normalizeScript("martian")).toBe(DEFAULT_SCRIPT);
    expect(normalizeScript(undefined)).toBe(DEFAULT_SCRIPT);
  });
});

describe("createHanConverter", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("converts existing hanzi when a converter is installed", () => {
    document.body.innerHTML = `<p id="a">学习</p>`;
    const ctrl = createHanConverter();
    ctrl.setConverter(fakeConverter);
    expect(document.getElementById("a")!.textContent).toBe("學習");
  });

  it("restores the originals when the converter is cleared", () => {
    document.body.innerHTML = `<p id="a">学习</p>`;
    const ctrl = createHanConverter();
    ctrl.setConverter(fakeConverter);
    ctrl.setConverter(null);
    expect(document.getElementById("a")!.textContent).toBe("学习");
  });

  it("leaves non-Han text untouched", () => {
    document.body.innerHTML = `<p id="a">Hello 学 world</p>`;
    const ctrl = createHanConverter();
    ctrl.setConverter(fakeConverter);
    expect(document.getElementById("a")!.textContent).toBe("Hello 學 world");
  });

  it("skips text inside form controls and [data-han-skip]", () => {
    document.body.innerHTML = `
      <select id="s"><option>简体</option></select>
      <div data-han-skip><span id="k">学习</span></div>
      <p id="p">汉语</p>`;
    const ctrl = createHanConverter();
    ctrl.setConverter(fakeConverter);
    expect(document.querySelector("#s option")!.textContent).toBe("简体");
    expect(document.getElementById("k")!.textContent).toBe("学习");
    expect(document.getElementById("p")!.textContent).toBe("漢語");
  });

  it("converts nodes added after the converter is running (observer)", async () => {
    document.body.innerHTML = `<div id="root"></div>`;
    const ctrl = createHanConverter();
    ctrl.start();
    ctrl.setConverter(fakeConverter);

    const p = document.createElement("p");
    p.textContent = "汉语";
    document.getElementById("root")!.appendChild(p);

    await waitForMutations();
    expect(p.textContent).toBe("漢語");
    ctrl.stop();
  });

  it("re-derives the original when React swaps a converted node's text (characterData)", async () => {
    // Simulates React writing fresh simplified text into a node we already
    // converted: the stale record must not be trusted — the new value is the
    // new original and must itself be converted.
    document.body.innerHTML = `<p id="a">学习</p>`;
    const node = document.getElementById("a")!.firstChild as Text;
    const ctrl = createHanConverter();
    ctrl.start();
    ctrl.setConverter(fakeConverter);
    expect(node.nodeValue).toBe("學習");

    node.nodeValue = "汉语"; // React-style in-place text update
    await waitForMutations();
    expect(node.nodeValue).toBe("漢語");
    ctrl.stop();
  });

  it("does not loop on its own writes", async () => {
    document.body.innerHTML = `<p id="a">学</p>`;
    const ctrl = createHanConverter();
    const spy = vi.fn(fakeConverter);
    ctrl.start();
    ctrl.setConverter(spy);
    await waitForMutations();
    const callsAfterConvert = spy.mock.calls.length;
    await waitForMutations();
    // No further conversions triggered by observing our own mutation.
    expect(spy.mock.calls.length).toBe(callsAfterConvert);
    ctrl.stop();
  });
});

// MutationObserver callbacks fire as microtasks; flush them.
function waitForMutations(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
