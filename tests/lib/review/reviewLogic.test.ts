// tests/lib/review/reviewLogic.test.ts
import { describe, it, expect } from "vitest";
import {
  answerTokens,
  isImageFilename,
  optionState,
  filterReviewQuestions,
  questionImageFile,
  sessionCardLevels,
  sessionCardLessons,
} from "@/lib/review/reviewLogic";
import type { ReviewQuestion, ReviewSessionSummary } from "@/lib/types/practice";

function q(partial: Partial<ReviewQuestion>): ReviewQuestion {
  return {
    level: 1,
    lesson: 1,
    no: 1,
    skill: "listening",
    type: 1,
    content: null,
    question: null,
    answer: "",
    audio_key: [],
    image: null,
    options: {},
    progress: "",
    category: "practice",
    user_answer: null,
    is_correct: false,
    answered_at: null,
    ...partial,
  };
}

describe("answerTokens", () => {
  it("returns an empty set for null/undefined", () => {
    expect(answerTokens(null).size).toBe(0);
    expect(answerTokens(undefined).size).toBe(0);
  });
  it("splits on comma, Chinese comma, and whitespace", () => {
    expect([...answerTokens("A, B、C  D")].sort()).toEqual(["A", "B", "C", "D"]);
  });
  it("drops empty tokens", () => {
    expect(answerTokens(" , ,A").size).toBe(1);
  });
});

describe("isImageFilename", () => {
  it("accepts real image extensions", () => {
    expect(isImageFilename("pic.JPG")).toBe(true);
    expect(isImageFilename("a.png")).toBe(true);
  });
  it("accepts the numeric-id image form", () => {
    expect(isImageFilename("12.3")).toBe(true);
    expect(isImageFilename("12.3a")).toBe(true);
  });
  it("rejects plain text and non-strings", () => {
    expect(isImageFilename("hello")).toBe(false);
    expect(isImageFilename(42)).toBe(false);
    expect(isImageFilename(null)).toBe(false);
  });
});

describe("optionState", () => {
  const correct = new Set(["A"]);
  it("marks the correct option", () => {
    expect(optionState("A", correct, new Set()).className).toBe("q-option opt-correct");
  });
  it("marks the user's wrong pick", () => {
    expect(optionState("B", correct, new Set(["B"])).className).toBe(
      "q-option opt-user-wrong"
    );
  });
  it("marks the user's correct pick", () => {
    expect(optionState("A", correct, new Set(["A"])).className).toBe(
      "q-option opt-correct opt-user-correct"
    );
  });
  it("leaves untouched options plain", () => {
    expect(optionState("C", correct, new Set(["A"])).className).toBe("q-option");
  });
});

describe("filterReviewQuestions", () => {
  const qs = [
    q({ is_correct: true, skill: "reading" }),
    q({ is_correct: false, skill: "listening" }),
    q({ is_correct: true, skill: "listening" }),
  ];
  it("keeps original 1-based numbering across filters", () => {
    const incorrect = filterReviewQuestions(qs, "incorrect", "all");
    expect(incorrect).toHaveLength(1);
    expect(incorrect[0].number).toBe(2);
  });
  it("filters by result", () => {
    expect(filterReviewQuestions(qs, "correct", "all")).toHaveLength(2);
  });
  it("filters by skill (defaulting missing skill to listening)", () => {
    const noSkill = [q({ skill: "" })];
    expect(filterReviewQuestions(noSkill, "all", "listening")).toHaveLength(1);
    expect(filterReviewQuestions(noSkill, "all", "reading")).toHaveLength(0);
    expect(filterReviewQuestions(qs, "all", "reading")).toHaveLength(1);
  });
});

describe("questionImageFile", () => {
  it("prefers the explicit image column", () => {
    expect(questionImageFile(q({ image: "x.png", question: "text" }))).toBe("x.png");
  });
  it("falls back to an image-like question field", () => {
    expect(questionImageFile(q({ question: "12.3" }))).toBe("12.3");
  });
  it("returns null when neither is an image", () => {
    expect(questionImageFile(q({ question: "读一读" }))).toBeNull();
  });
});

describe("session card helpers", () => {
  const s: ReviewSessionSummary = {
    session_id: 1,
    ended_at: null,
    total: 5,
    correct: 3,
    score_pct: 60,
    levels: [1, 3],
    lessons: ["2", "4"],
    categories: ["practice"],
  };
  it("formats levels and lessons", () => {
    expect(sessionCardLevels(s)).toBe("HSK 1, HSK 3");
    expect(sessionCardLessons(s)).toBe("2, 4");
  });
});
