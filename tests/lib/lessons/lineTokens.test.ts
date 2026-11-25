// tests/lib/lessons/lineTokens.test.ts

import { describe, it, expect } from "vitest";
import { formatTokens, parseTokens, tokensMatch } from "@/lib/lessons/lineTokens";

describe("line tokens", () => {
  it("round-trips through the text field, accepting a full-width separator", () => {
    expect(formatTokens(["你", "好", "！"])).toBe("你 | 好 | ！");
    expect(parseTokens(" 你｜好 ||！ ")).toEqual(["你", "好", "！"]);
    expect(parseTokens("  ")).toEqual([]);
  });

  it("matches ignoring punctuation and spaces", () => {
    expect(tokensMatch("你好，AI！", ["你好", "AI"])).toBe(true);
    expect(tokensMatch("你好", ["你", "好", "。"])).toBe(true);
    expect(tokensMatch("你好", [])).toBe(true);
  });

  it("rejects missing, extra or reordered words", () => {
    expect(tokensMatch("你好", ["你"])).toBe(false);
    expect(tokensMatch("您好", ["你", "好"])).toBe(false);
    expect(tokensMatch("你好", ["好", "你"])).toBe(false);
  });
});
