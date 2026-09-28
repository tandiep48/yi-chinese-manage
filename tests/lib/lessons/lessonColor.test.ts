import { describe, it, expect } from "vitest";
import { lessonColor } from "@/lib/lessons/lessons";
import { LESSON_COLORS } from "@/lib/lessons/constants";

describe("lessonColor", () => {
  it("maps an HSK key + lesson number to the legacy tint", () => {
    expect(lessonColor("HSK1", "2")).toBe("#f5f5f5");
    expect(lessonColor("HSK3", 6)).toBe("#064288");
    expect(lessonColor("HSK6", "30")).toBe("#d63432");
  });

  it("accepts an already-shortened level key", () => {
    expect(lessonColor("H2", "15")).toBe("#6fa68f");
  });

  it("returns undefined for a lesson with no mapped color", () => {
    expect(lessonColor("HSK1", "99")).toBeUndefined();
    expect(lessonColor("HSK4", "Other")).toBeUndefined();
  });

  it("has the full 126-entry palette with valid hex values", () => {
    const entries = Object.entries(LESSON_COLORS);
    expect(entries).toHaveLength(126);
    for (const [, hex] of entries) {
      expect(hex).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
