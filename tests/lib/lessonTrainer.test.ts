import { describe, it, expect } from "vitest";
import {
  normalizeAnswer,
  answersMatch,
  reorderMatches,
  filterTasksByType,
  lessonTaskAudioUrl,
} from "@/lib/lessons/lessonTrainer";
import type { LessonTask } from "@/lib/types/lesson";

function task(over: Partial<LessonTask>): LessonTask {
  return {
    type: "typing",
    passage_id: "H2_2_2",
    line_id: 1,
    content: "你好",
    correct_answer: "你好",
    ...over,
  };
}

describe("normalizeAnswer", () => {
  it("strips optional punctuation and whitespace", () => {
    expect(normalizeAnswer("你好，世界！")).toBe("你好世界");
    expect(normalizeAnswer(" 你 好 ")).toBe("你好");
    expect(normalizeAnswer("")).toBe("");
    expect(normalizeAnswer(null)).toBe("");
  });

  it("folds full-width forms onto ASCII via NFKC", () => {
    // Full-width comma / bang are stripped like their ASCII forms.
    expect(normalizeAnswer("ａ，ｂ")).toBe(normalizeAnswer("ab"));
  });
});

describe("answersMatch", () => {
  it("ignores punctuation and spacing differences", () => {
    expect(answersMatch("你好。", "你好")).toBe(true);
    expect(answersMatch("我 是 学生", "我是学生。")).toBe(true);
    expect(answersMatch("你好", "你们好")).toBe(false);
  });
});

describe("reorderMatches", () => {
  it("compares token-by-token in order", () => {
    expect(reorderMatches(["我", "是", "学生"], ["我", "是", "学生"])).toBe(true);
    expect(reorderMatches(["是", "我", "学生"], ["我", "是", "学生"])).toBe(false);
  });

  it("rejects a length mismatch and non-arrays", () => {
    expect(reorderMatches(["我", "是"], ["我", "是", "学生"])).toBe(false);
    // @ts-expect-error runtime guard for non-array input
    expect(reorderMatches(null, ["我"])).toBe(false);
  });

  it("treats punctuation-only token differences as equal", () => {
    expect(reorderMatches(["我，", "是"], ["我", "是"])).toBe(true);
  });
});

describe("filterTasksByType", () => {
  const tasks = [
    task({ type: "listening" }),
    task({ type: "meaning" }),
    task({ type: "typing" }),
    task({ type: "reorder" }),
  ];

  it("keeps only the selected skills", () => {
    const kept = filterTasksByType(tasks, ["typing", "reorder"]);
    expect(kept.map((t) => t.type)).toEqual(["typing", "reorder"]);
  });

  it("returns all tasks when the selection is empty or absent", () => {
    expect(filterTasksByType(tasks, [])).toHaveLength(4);
    expect(filterTasksByType(tasks, null)).toHaveLength(4);
  });
});

describe("lessonTaskAudioUrl", () => {
  it("uses the normalized HSK level folder", () => {
    const url = lessonTaskAudioUrl(task({ audio_key: "l2_1", hsk_level: "2" }));
    expect(url).toContain("/lesson_audio/HSK2/l2_1.mp3");
  });

  it("uses the book code folder for book lessons", () => {
    const url = lessonTaskAudioUrl(task({ audio_key: "a1", book_code: "AML", hsk_level: null }));
    expect(url).toContain("/lesson_audio/AML/a1.mp3");
  });

  it("returns null without an audio key", () => {
    expect(lessonTaskAudioUrl(task({ audio_key: null }))).toBeNull();
  });
});
