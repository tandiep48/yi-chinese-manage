// tests/components/learner/practice/SingleGroup.test.tsx
// Shared by exam and practice (both render through SingleGroup): a listening
// type-1 question shows its question prompt even with audio, and a listening
// type-3 question hides the reading passage. Reading keeps both, unchanged.

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { PracticeAudioProvider } from "@/components/page/learner/practice/PracticeAudio";
import { SingleGroup } from "@/components/page/learner/practice/question-types/SingleGroup";
import { freshGroupState } from "@/lib/practice/groupState";
import type { PracticeGroup, PracticeQuestion } from "@/lib/types/practice";

function makeQuestion(overrides: Partial<PracticeQuestion>): PracticeQuestion {
  return {
    level: 1,
    lesson: "1",
    no: 1,
    skill: "listening",
    type: 1,
    content: null,
    question: null,
    answer: "A",
    audio_key: [],
    image: null,
    options: {},
    progress: "1/1",
    category: "practice",
    ...overrides,
  };
}

function renderGroup(q: PracticeQuestion) {
  const group: PracticeGroup = { progress: "1/1", lesson: "1", questions: [q] };
  const noop = () => {};
  const { container } = render(
    <I18nProvider>
      <PracticeAudioProvider>
        <SingleGroup
          group={group}
          state={freshGroupState(group)}
          category="practice"
          onSelectMC={noop}
          onSelectKey={noop}
          onToggleChip={noop}
          onBlankClick={noop}
          onAssignT6={noop}
        />
      </PracticeAudioProvider>
    </I18nProvider>
  );
  return container.textContent ?? "";
}

describe("SingleGroup listening visibility", () => {
  it("type 1 listening shows the question prompt and hides the spoken paragraph", () => {
    const text = renderGroup(
      makeQuestion({
        skill: "listening",
        type: 1,
        content: "SPOKEN_PARAGRAPH",
        question: "QUESTION_PROMPT",
        audio_key: ["a.mp3"],
        options: { A: true, B: false },
      })
    );
    expect(text).toContain("QUESTION_PROMPT");
    expect(text).not.toContain("SPOKEN_PARAGRAPH");
  });

  it("type 3 listening hides the reading passage but keeps the question and options", () => {
    const text = renderGroup(
      makeQuestion({
        skill: "listening",
        type: 3,
        content: "READING_PASSAGE",
        question: "T3_QUESTION",
        audio_key: ["a.mp3"],
        options: { A: "OPT_A", B: "OPT_B" },
      })
    );
    expect(text).not.toContain("READING_PASSAGE");
    expect(text).toContain("T3_QUESTION");
    expect(text).toContain("OPT_A");
  });

  it("type 3 reading still shows the reading passage", () => {
    const text = renderGroup(
      makeQuestion({
        skill: "reading",
        type: 3,
        content: "READING_PASSAGE",
        question: "T3_QUESTION",
        audio_key: [],
        options: { A: "OPT_A", B: "OPT_B" },
      })
    );
    expect(text).toContain("READING_PASSAGE");
    expect(text).toContain("T3_QUESTION");
  });

  it("type 1 reading shows both the content and the question", () => {
    const text = renderGroup(
      makeQuestion({
        skill: "reading",
        type: 1,
        content: "READING_CONTENT",
        question: "TF_QUESTION",
        audio_key: [],
        options: { A: true, B: false },
      })
    );
    expect(text).toContain("READING_CONTENT");
    expect(text).toContain("TF_QUESTION");
  });
});
