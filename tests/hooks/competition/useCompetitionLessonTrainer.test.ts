// tests/hooks/useCompetitionLessonTrainer.test.ts
// Lesson-mode Learn Together: the room plays the task list the server generated at
// session start (already filtered to the room's types), reporting each answer under its
// passage:line key.

import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCompetitionLessonTrainer } from "@/hooks/competition/useCompetitionLessonTrainer";
import type { CompetitionSession } from "@/lib/types/competition";
import type { LessonTask } from "@/lib/types/lesson";

vi.mock("@/components/i18n/I18nProvider", () => ({
  useT: () => ({ t: (key: string) => key, lang: "en" }),
}));

const TASKS: LessonTask[] = [
  {
    type: "listening",
    passage_id: "H1_10_1",
    line_id: 4,
    content: "你好",
    correct_answer: "hello",
    options: ["hello", "goodbye"],
  },
  {
    type: "reorder",
    passage_id: "H1_10_1",
    line_id: 5,
    content: "我是学生",
    correct_answer: "我是学生",
    tokens: ["我", "是", "学生"],
    shuffled_tokens: ["学生", "我", "是"],
  },
];

function session(tasks: LessonTask[] = TASKS): CompetitionSession {
  return {
    id: 9,
    room_id: 1,
    room_code: "ABC123",
    status: "running",
    current_section: 1,
    section_started_at: null,
    section_ends_at: null,
    started_at: null,
    finished_at: null,
    category: "lesson",
    activity_type: "all",
    lesson_tasks: tasks,
    scores: [],
  };
}

describe("useCompetitionLessonTrainer", () => {
  it("plays the session's tasks in order with a task counter", () => {
    const { result } = renderHook(() =>
      useCompetitionLessonTrainer({ session: session(), onAnswer: vi.fn(), onFinish: vi.fn() })
    );

    expect(result.current.status).toBe("playing");
    expect(result.current.task?.type).toBe("listening");
    expect(result.current.counterText).toBe("trainer.task_counter");

    act(() => result.current.advance());
    expect(result.current.task?.type).toBe("reorder");
    expect(result.current.taskKey).toBe(1);
  });

  it("reports an answer under its passage:line key and task type", () => {
    const onAnswer = vi.fn();
    const { result } = renderHook(() =>
      useCompetitionLessonTrainer({ session: session(), onAnswer, onFinish: vi.fn() })
    );

    act(() => result.current.recordAnswer(TASKS[0], "hello", true, false, 900));
    expect(onAnswer).toHaveBeenCalledWith("H1_10_1:4", "listening", true, 900);
  });

  it("reports a skip as a wrong answer", () => {
    const onAnswer = vi.fn();
    const { result } = renderHook(() =>
      useCompetitionLessonTrainer({ session: session(), onAnswer, onFinish: vi.fn() })
    );

    act(() => result.current.recordAnswer(TASKS[1], "", false, true, 4200));
    expect(onAnswer).toHaveBeenCalledWith("H1_10_1:5", "reorder", false, 4200);
  });

  it("finishes after the last task instead of advancing past it", () => {
    const onFinish = vi.fn();
    const { result } = renderHook(() =>
      useCompetitionLessonTrainer({ session: session(), onAnswer: vi.fn(), onFinish })
    );

    act(() => result.current.advance());
    act(() => result.current.advance());

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(result.current.taskKey).toBe(1);
  });

  it("shows the empty state for a session with no tasks, or none at all", () => {
    const { result: noTasks } = renderHook(() =>
      useCompetitionLessonTrainer({ session: session([]), onAnswer: vi.fn(), onFinish: vi.fn() })
    );
    expect(noTasks.current.status).toBe("empty");

    // A vocab room hands this hook null, and it must stay idle.
    const { result: idle } = renderHook(() =>
      useCompetitionLessonTrainer({ session: null, onAnswer: vi.fn(), onFinish: vi.fn() })
    );
    expect(idle.current.status).toBe("empty");
    expect(idle.current.task).toBeNull();
  });
});
