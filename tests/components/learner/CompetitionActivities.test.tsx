// tests/components/learner/CompetitionActivities.test.tsx
// The competition (autoAdvance) mode added to the shared vocab activities: words lock
// and score one by one, a finished board advances itself, Skip reveals what is left,
// and the 1-5 shortcuts pick source cards. The solo defaults are covered too, since
// Learn Together must not change how /vocab-training-batch plays.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { TypingActivity } from "@/components/page/learner/vocab-training/TypingActivity";
import { MatchActivity } from "@/components/page/learner/vocab-training/MatchActivity";
import type { Activity, TrainerWord } from "@/lib/lessons/vocabTrainer";

vi.mock("@/components/i18n/I18nProvider", () => ({
  useT: () => ({ t: (key: string) => key, lang: "en" }),
}));

// The activities portal their primary button into the trainer action slot; without a
// slot element the portal is skipped, so tests that need the button provide one.
let slot: HTMLElement | null = null;
vi.mock("@/components/page/learner/trainer/TrainerShell", () => ({
  useTrainerActionSlot: () => slot,
}));

const WORDS: TrainerWord[] = [
  { word: "水", cn: "水", pinyin: "shuǐ", meaning_en: "water", meaning_vn: "nước", audio_key: "a1", level: "HSK1" },
  { word: "火", cn: "火", pinyin: "huǒ", meaning_en: "fire", meaning_vn: "lửa", audio_key: "a2", level: "HSK1" },
];

function activity(type: Activity["type"]): Activity {
  return { groupIndex: 0, type, words: WORDS };
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  slot = document.createElement("div");
  document.body.appendChild(slot);
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
  if (slot) slot.remove();
  slot = null;
  vi.clearAllMocks();
});

function typeInto(idx: number, value: string) {
  const inputs = document.querySelectorAll<HTMLInputElement>(".bt-type-input");
  fireEvent.change(inputs[idx], { target: { value } });
}

describe("TypingActivity in competition mode", () => {
  it("locks and scores each word the moment it is typed correctly", () => {
    const onRecord = vi.fn();
    render(
      <TypingActivity activity={activity("typing")} onRecord={onRecord} onAdvance={vi.fn()} autoAdvance />
    );

    typeInto(0, "水");

    expect(onRecord).toHaveBeenCalledTimes(1);
    expect(onRecord.mock.calls[0][0]).toMatchObject({ word: "水" });
    expect(onRecord.mock.calls[0][3]).toBe(true);
    expect(document.querySelectorAll<HTMLInputElement>(".bt-type-input")[0].disabled).toBe(true);
  });

  it("advances on its own once every word is solved", () => {
    const onAdvance = vi.fn();
    render(
      <TypingActivity activity={activity("typing")} onRecord={vi.fn()} onAdvance={onAdvance} autoAdvance />
    );

    typeInto(0, "水");
    expect(onAdvance).not.toHaveBeenCalled();
    typeInto(1, "火");

    act(() => void vi.advanceTimersByTime(400));
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it("skips by revealing the unsolved words as misses, then waits for Next", () => {
    const onRecord = vi.fn();
    const onAdvance = vi.fn();
    render(
      <TypingActivity activity={activity("typing")} onRecord={onRecord} onAdvance={onAdvance} autoAdvance />
    );

    typeInto(0, "水");
    onRecord.mockClear();

    fireEvent.click(screen.getByText("vocab_trainer.skip"));

    // Only the unsolved word is recorded again, as incorrect.
    expect(onRecord).toHaveBeenCalledTimes(1);
    expect(onRecord.mock.calls[0][0]).toMatchObject({ word: "火" });
    expect(onRecord.mock.calls[0][3]).toBe(false);

    // A revealed board does not auto-advance — it waits for Next.
    act(() => void vi.advanceTimersByTime(1000));
    expect(onAdvance).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("lesson.next"));
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it("keeps the solo Check flow when autoAdvance is off", () => {
    const onRecord = vi.fn();
    render(<TypingActivity activity={activity("typing")} onRecord={onRecord} onAdvance={vi.fn()} />);

    expect(screen.getByText("vocab_trainer.check")).toBeInTheDocument();
    typeInto(0, "水");
    // Solo mode scores the whole group on Check, not per word.
    expect(onRecord).not.toHaveBeenCalled();
  });
});

describe("MatchActivity in competition mode", () => {
  function solvePair(word: string) {
    const left = document.querySelectorAll(".bt-match-col")[0];
    const right = document.querySelectorAll(".bt-match-col")[1];
    const leftBtn = [...left.querySelectorAll("button")].find((b) => b.textContent?.includes(word));
    const meaning = WORDS.find((w) => w.word === word)!.meaning_en;
    const rightBtn = [...right.querySelectorAll("button")].find((b) => b.textContent === meaning);
    fireEvent.click(leftBtn!);
    fireEvent.click(rightBtn!);
  }

  it("advances itself once the board is fully matched", () => {
    const onAdvance = vi.fn();
    render(
      <MatchActivity
        activity={activity("reading")}
        onRecord={vi.fn()}
        onAdvance={onAdvance}
        autoAdvance
      />
    );

    solvePair("水");
    solvePair("火");
    act(() => void vi.advanceTimersByTime(600));
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it("shows Skip instead of Continue and records the rest as misses", () => {
    const onRecord = vi.fn();
    render(
      <MatchActivity
        activity={activity("reading")}
        onRecord={onRecord}
        onAdvance={vi.fn()}
        autoAdvance
      />
    );

    expect(screen.queryByText("lesson.continue")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("vocab_trainer.skip"));

    expect(onRecord).toHaveBeenCalledTimes(2);
    expect(onRecord.mock.calls.every((call) => call[3] === false)).toBe(true);
    expect(screen.getByText("lesson.next")).toBeInTheDocument();
  });

  it("picks a source card with its number key when shortcuts are on", () => {
    render(
      <MatchActivity
        activity={activity("reading")}
        onRecord={vi.fn()}
        onAdvance={vi.fn()}
        autoAdvance
        keyboardShortcuts
      />
    );

    // Badges label the source column 1..n.
    expect(screen.getByText("1")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "2" });

    const left = document.querySelectorAll(".bt-match-col")[0];
    const selected = left.querySelector(".bt-match-item.selected");
    expect(selected?.textContent).toContain("火");
  });

  it("has no shortcut badges and a Continue button in solo mode", () => {
    render(<MatchActivity activity={activity("reading")} onRecord={vi.fn()} onAdvance={vi.fn()} />);

    expect(document.querySelector(".bt-key-hint")).toBeNull();
    expect(screen.getByText("lesson.continue")).toBeInTheDocument();
  });
});
