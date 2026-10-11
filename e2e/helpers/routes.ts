/**
 * Learner routes the responsive guard checks. Session-gated screens (lesson
 * study/trainer, practice/exam runners, vocab trainer, competition active
 * screens) are omitted — they only render inside a live session and are covered
 * manually during fixes (see docs/responsive-audit.md).
 */

export const PUBLIC_ROUTES = [
  "/learner/login",
  "/learner/register",
  "/learner/grammar",
  "/learner/lesson/basic-pinyin",
  "/learner/lesson/advanced-pinyin",
];

export const AUTH_ROUTES = [
  "/learner", // dashboard
  "/learner/vocab",
  "/learner/practice",
  "/learner/exam",
  "/learner/profile",
  "/learner/recommend",
  "/learner/vocab-review",
  "/learner/translation",
  "/learner/vocab-learning",
  "/learner/learn-together",
];
