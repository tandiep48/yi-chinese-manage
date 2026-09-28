// lib/lessons/tokens.ts
// Punctuation tokens are shown but not clickable in the Lesson Summary. Ported
// verbatim from PUNCT_RE in Learning/web_app/static/reading/reading.js (CJK
// punctuation blocks + fullwidth forms + ASCII punctuation + whitespace).

const PUNCT_RE =
  /^[　-〿＀-￯。，、；：？！…—～·「」『』【】《》〈〉""''()（）[\]{}<>,.!?;:'"/\\|\s]+$/;

export function isPunctToken(token: string): boolean {
  return PUNCT_RE.test(token);
}
