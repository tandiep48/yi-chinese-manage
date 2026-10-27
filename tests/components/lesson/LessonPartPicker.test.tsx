// tests/components/lesson/LessonPartPicker.test.tsx
// The part picker lists a lesson's parts plus lesson-wide Grammar / Translation
// entries. Those two used to be inert <div>s; they now link to the grammar /
// translation study pages for the lesson's first part. Hooks, navigation, i18n and
// the image helper are mocked.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Suspense } from "react";
import { render, screen, act } from "@testing-library/react";
import PartPickerPage from "@/app/learner/hsk/[level]/[lesson]/page";
import * as pickerHook from "@/hooks/lesson/useLessonPicker";
import type { PickerLessonSummary } from "@/hooks/lesson/useLessonPicker";

vi.mock("@/hooks/lesson/useLessonPicker");
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  notFound: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock("@/components/i18n/I18nProvider", () => ({
  useT: () => ({ t: (k: string) => k, lang: "en" }),
}));
vi.mock("@/lib/api/learner/recent", () => ({ saveRecentLearning: vi.fn() }));
vi.mock("@/lib/gcs", () => ({ lessonImageUrl: () => "https://img.example/x.png" }));

const LESSON: PickerLessonSummary = {
  lesson: "2",
  title: "Lesson 2",
  parts: [
    { passage_id: "H2_2_1", hsk_level: "HSK2", title: "Part one" },
    { passage_id: "H2_2_2", hsk_level: "HSK2", title: "Part two" },
  ],
  partCount: 2,
  progress: { learnedWords: 0, totalWords: 0, progressPct: 0 },
  isPinyinLesson: false,
};

async function renderPicker() {
  const params = Promise.resolve({ level: "HSK2", lesson: "2" });
  await act(async () => {
    render(
      <Suspense fallback={null}>
        <PartPickerPage params={params} />
      </Suspense>
    );
    // Let `use(params)` resolve and React retry the suspended render.
    await params;
  });
}

describe("PartPickerPage Grammar / Translation links", () => {
  beforeEach(() => {
    vi.mocked(pickerHook.useLessonPicker).mockReturnValue({
      loading: false,
      error: null,
      lessons: [LESSON],
      partsProgress: {},
    });
  });

  it("links Grammar and Translation to the lesson's first part", async () => {
    await renderPicker();

    const grammar = await screen.findByText("picker.grammar_btn");
    const translation = await screen.findByText("picker.translation_btn");

    expect(grammar.closest("a")).toHaveAttribute(
      "href",
      "/learner/grammar?passage_id=H2_2_1"
    );
    expect(translation.closest("a")).toHaveAttribute(
      "href",
      "/learner/translation?passage_id=H2_2_1"
    );
  });

  it("omits the Grammar / Translation links when the lesson has no parts", async () => {
    vi.mocked(pickerHook.useLessonPicker).mockReturnValue({
      loading: false,
      error: null,
      lessons: [{ ...LESSON, parts: [], partCount: 0 }],
      partsProgress: {},
    });
    await renderPicker();

    // Wait for the picker to render, then assert the two entries are absent.
    await screen.findByText("picker.select_part");
    expect(screen.queryByText("picker.grammar_btn")).not.toBeInTheDocument();
    expect(screen.queryByText("picker.translation_btn")).not.toBeInTheDocument();
  });
});
