// tests/lib/api/vocabQuerySchema.test.ts
// The zod schema that mirrors the backend VocabQuery model: defaults, bounds,
// trimming, and enum rejection.

import { describe, it, expect } from "vitest";
import { vocabQuerySchema } from "@/lib/api/schemas/vocab";

describe("vocabQuerySchema", () => {
  it("applies defaults for an empty input", () => {
    expect(vocabQuerySchema.parse({})).toEqual({ page: 1, page_size: 20 });
  });

  it("trims search", () => {
    expect(vocabQuerySchema.parse({ search: "  hao  " }).search).toBe("hao");
  });

  it("accepts a valid hsk level and paging", () => {
    const out = vocabQuerySchema.parse({ page: 2, page_size: 50, hsk_level: "HSK3" });
    expect(out).toEqual({ page: 2, page_size: 50, hsk_level: "HSK3" });
  });

  it.each([
    { page: 0 },
    { page_size: 0 },
    { page_size: 101 },
    { hsk_level: "HSK9" },
    { search: "x".repeat(101) },
  ])("rejects invalid input %o", (input) => {
    expect(() => vocabQuerySchema.parse(input)).toThrow();
  });
});
