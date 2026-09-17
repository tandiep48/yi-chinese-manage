// lib/lessons/passageNav.ts
// Where selecting a passage/part should take the learner. Ported from the
// onward-routing in Learning/web_app/static/learning/learning.js: the two HSK1
// pinyin placeholders open their dedicated guides, everything else opens the
// lesson view. In this app the lesson view lives at /lesson?passage_id=<id>
// (the Next equivalent of the Jinja /vocab-learning?...&flow=lesson-part).

const BASIC_PINYIN_PASSAGE = "H1_1_1";
const ADVANCED_PINYIN_PASSAGE = "H1_1_2";

// Which lesson tab to land on. HSK parts open on "vocab" (Word Summary); book
// parts opened the reading/Lesson Summary view in the legacy learning.js, so
// they pass "lesson" to land there instead.
export type LessonView = "vocab" | "lesson";

export function lessonHrefForPassage(passageId: string, view?: LessonView): string {
  if (passageId === BASIC_PINYIN_PASSAGE) return "/learner/lesson/basic-pinyin";
  if (passageId === ADVANCED_PINYIN_PASSAGE) return "/learner/lesson/advanced-pinyin";
  const base = `/learner/lesson?passage_id=${encodeURIComponent(passageId)}`;
  return view ? `${base}&view=${view}` : base;
}
