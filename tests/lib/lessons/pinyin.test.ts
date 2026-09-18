import { describe, it, expect } from "vitest";
import {
  addTone,
  getTones,
  ADVANCED_PINYIN,
  BASIC_FINAL_ROWS,
  BASIC_INITIAL_ROWS,
  BASIC_TONE_ROWS,
} from "@/lib/lessons/pinyin";

describe("addTone / getTones", () => {
  it("marks the main vowel following pinyin priority (a > o > e)", () => {
    expect(addTone("bao", 0)).toBe("bāo"); // a wins over o
    expect(addTone("mei", 3)).toBe("mèi"); // e wins over i
    expect(addTone("guo", 2)).toBe("guǒ"); // o wins over u
  });

  it("marks the second vowel of iu / ui", () => {
    expect(addTone("liu", 1)).toBe("liú"); // iu -> u
    expect(addTone("gui", 4 - 1)).toBe("guì"); // ui -> i
  });

  it("falls back to the lone i / u / ü", () => {
    expect(addTone("ni", 2)).toBe("nǐ");
    expect(addTone("lu", 3)).toBe("lù");
    expect(addTone("nü", 3)).toBe("nǜ");
  });

  it("returns the syllable unchanged when it has no toneable vowel", () => {
    expect(addTone("hmm", 0)).toBe("hmm");
  });

  it("getTones returns the four tones in order", () => {
    expect(getTones("ma")).toEqual(["mā", "má", "mǎ", "mà"]);
    expect(getTones("bao")).toEqual(["bāo", "báo", "bǎo", "bào"]);
  });
});

describe("advanced pinyin data integrity", () => {
  it("has 21 initials and 3 tables", () => {
    expect(ADVANCED_PINYIN.initials).toHaveLength(21);
    expect(ADVANCED_PINYIN.tables).toHaveLength(3);
  });

  it("every row aligns to bare-final + one column per initial", () => {
    const width = 1 + ADVANCED_PINYIN.initials.length; // 22
    for (const table of ADVANCED_PINYIN.tables) {
      for (const row of table) {
        expect(row.cells).toHaveLength(width);
      }
    }
  });

  it("contains all 401 syllables from the source chart", () => {
    const count = ADVANCED_PINYIN.tables.reduce(
      (sum, table) => sum + table.reduce((s, row) => s + row.cells.filter(Boolean).length, 0),
      0
    );
    expect(count).toBe(401);
  });

  it("covers all 36 finals", () => {
    const finals = ADVANCED_PINYIN.tables.flatMap((t) => t.map((r) => r.final));
    expect(new Set(finals).size).toBe(36);
    expect(finals).toContain("ü");
    expect(finals).toContain("üan");
  });
});

describe("basic pinyin grid shape", () => {
  it("keeps left/right halves aligned to 13 rows of four cells", () => {
    expect(BASIC_FINAL_ROWS).toHaveLength(13);
    expect(BASIC_INITIAL_ROWS).toHaveLength(6);
    expect(BASIC_TONE_ROWS).toHaveLength(6);
    for (const row of [...BASIC_FINAL_ROWS, ...BASIC_INITIAL_ROWS, ...BASIC_TONE_ROWS]) {
      expect(row).toHaveLength(4);
    }
  });
});
