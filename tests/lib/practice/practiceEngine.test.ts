import { describe, it, expect } from "vitest";
import {
  normalizeAnswer,
  answersMatch,
  isImageFilename,
  allOptionsAreImages,
  hasBlank,
  tokenizeContent,
  countBlanks,
  classifyGroupLayout,
  classifyQuestion,
  scoreGroup,
  buildAnswerRows,
  firstUncheckedAfter,
  allChecked,
  resultIcon,
} from "@/lib/practice/practiceEngine";
import type { PracticeGroup, PracticeQuestion } from "@/lib/types/practice";

function q(overrides: Partial<PracticeQuestion> = {}): PracticeQuestion {
  return {
    level: 1,
    lesson: "1",
    no: 1,
    skill: "listening",
    type: 3,
    content: null,
    question: null,
    answer: "A",
    audio_key: [],
    image: null,
    options: { A: "one", B: "two" },
    progress: "1",
    category: "practice",
    ...overrides,
  };
}

function group(questions: PracticeQuestion[]): PracticeGroup {
  return { progress: "1", lesson: "1", category: "practice", questions };
}

describe("normalizeAnswer / answersMatch", () => {
  it("trims and uppercases", () => {
    expect(normalizeAnswer("  b ")).toBe("B");
    expect(normalizeAnswer(null)).toBe("");
  });
  it("matches case- and space-insensitively", () => {
    expect(answersMatch("a", "A")).toBe(true);
    expect(answersMatch(" abc ", "ABC")).toBe(true);
    expect(answersMatch("a", "b")).toBe(false);
  });
});

describe("isImageFilename / allOptionsAreImages", () => {
  it("recognises image extensions and numeric asset ids", () => {
    expect(isImageFilename("cat.jpg")).toBe(true);
    expect(isImageFilename("3.12b")).toBe(true);
    expect(isImageFilename("hello")).toBe(false);
    expect(isImageFilename(true)).toBe(false);
  });
  it("all-images requires a non-empty options set", () => {
    expect(allOptionsAreImages({ A: "a.png", B: "b.png" })).toBe(true);
    expect(allOptionsAreImages({ A: "a.png", B: "text" })).toBe(false);
    expect(allOptionsAreImages({})).toBe(false);
  });
});

describe("hasBlank / tokenizeContent / countBlanks", () => {
  it("detects the various blank shapes", () => {
    expect(hasBlank("我（ ）你")).toBe(true);
    expect(hasBlank("（24）__________")).toBe(true);
    expect(hasBlank("()")).toBe(true);
    expect(hasBlank("no blanks here")).toBe(false);
    expect(hasBlank(null)).toBe(false);
  });
  it("tokenises into ordered text/blank segments", () => {
    const segs = tokenizeContent("我（ ）你（ ）");
    expect(segs).toEqual([
      { kind: "text", text: "我" },
      { kind: "blank", index: 0 },
      { kind: "text", text: "你" },
      { kind: "blank", index: 1 },
    ]);
  });
  it("counts blanks", () => {
    expect(countBlanks("（1）__ 和 （2）__")).toBe(2);
    expect(countBlanks("plain")).toBe(0);
  });
});

describe("classifyGroupLayout", () => {
  it("type 2 → type2", () => {
    expect(classifyGroupLayout(group([q({ type: 2 }), q({ type: 2 })]))).toBe("type2");
  });
  it("type 5 listening multi → t5-listening", () => {
    const g = group([q({ type: 5, skill: "listening" }), q({ type: 5, skill: "listening" })]);
    expect(classifyGroupLayout(g)).toBe("t5-listening");
  });
  it("type 5 reading multi splits on image options", () => {
    const text = group([
      q({ type: 5, skill: "reading", options: { A: "x", B: "y" } }),
      q({ type: 5, skill: "reading", options: { A: "x", B: "y" } }),
    ]);
    expect(classifyGroupLayout(text)).toBe("t5-reading-match");
    const img = group([
      q({ type: 5, skill: "reading", options: { A: "a.jpg", B: "b.jpg" } }),
      q({ type: 5, skill: "reading", options: { A: "a.jpg", B: "b.jpg" } }),
    ]);
    expect(classifyGroupLayout(img)).toBe("t5-reading-image");
  });
  it("type 6 → type6-group even when single", () => {
    expect(classifyGroupLayout(group([q({ type: 6 })]))).toBe("type6-group");
  });
  it("everything else → single", () => {
    expect(classifyGroupLayout(group([q({ type: 3 })]))).toBe("single");
    expect(classifyGroupLayout(group([q({ type: 5, skill: "listening" })]))).toBe("single");
  });
});

describe("classifyQuestion", () => {
  it("dispatches by type and option shape", () => {
    expect(classifyQuestion(q({ type: 1 }))).toBe("tf");
    expect(classifyQuestion(q({ type: 3, options: { A: "a.jpg", B: "b.jpg" } }))).toBe("images");
    expect(classifyQuestion(q({ type: 3, options: { A: "x", B: "y" } }))).toBe("mc-reading");
    expect(classifyQuestion(q({ type: 4 }))).toBe("reorder");
    expect(classifyQuestion(q({ type: 5, options: { A: "a.jpg", B: "b.jpg" } }))).toBe("images");
    expect(classifyQuestion(q({ type: 5, content: "我（ ）", options: { A: "x" } }))).toBe("blank-mc");
    expect(classifyQuestion(q({ type: 5, content: "plain", options: { A: "x" } }))).toBe("match");
    expect(classifyQuestion(q({ type: 6 }))).toBe("type6-single");
  });
});

describe("scoreGroup / buildAnswerRows", () => {
  const g = group([q({ no: 1, answer: "A" }), q({ no: 2, answer: "B" })]);
  it("scores each sub-question", () => {
    const s = scoreGroup(g, { "q-0": "a", "q-1": "c" });
    expect(s).toEqual({ correct: 1, total: 2, perQuestion: [true, false] });
  });
  it("builds submit rows with normalised answers and shared per-question time", () => {
    const rows = buildAnswerRows(g, { "q-0": " a ", "q-1": "b" }, 500, "exam");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      question_no: 1,
      user_answer: "A",
      is_correct: true,
      response_time_ms: 500,
      category: "practice", // q.category wins over the default
    });
    expect(rows[1]).toMatchObject({ question_no: 2, user_answer: "B", is_correct: true });
  });
  it("falls back to the default category when the question lacks one", () => {
    const g2 = group([q({ category: undefined as unknown as "practice" })]);
    const rows = buildAnswerRows(g2, { "q-0": "A" }, 100, "exam");
    expect(rows[0].category).toBe("exam");
  });
});

describe("navigation helpers", () => {
  it("firstUncheckedAfter finds the next unchecked group", () => {
    expect(firstUncheckedAfter([true, false, true], 0)).toBe(1);
    expect(firstUncheckedAfter([true, true, false], 0)).toBe(2);
    expect(firstUncheckedAfter([true, true, true], 0)).toBe(-1);
    // -1 start scans from index 0
    expect(firstUncheckedAfter([false, true], -1)).toBe(0);
  });
  it("allChecked is false for an empty list", () => {
    expect(allChecked([])).toBe(false);
    expect(allChecked([true, true])).toBe(true);
    expect(allChecked([true, false])).toBe(false);
  });
});

describe("resultIcon", () => {
  it("returns tiered icons", () => {
    expect(resultIcon(0.95)).toBe("fa-trophy");
    expect(resultIcon(0.8)).toBe("fa-circle-check");
    expect(resultIcon(0.6)).toBe("fa-chart-line");
    expect(resultIcon(0.2)).toBe("fa-rotate-right");
  });
});
