// lib/lessons/lineTokens.ts
// The word segmentation of a lesson line, as typed in the manage editor. The
// match rule mirrors _require_matching_tokens in
// Learning/web_app/entity/passage/service.py.

// "|" or its full-width form, which a Chinese keyboard produces.
const SEPARATOR = /[|｜]/;
const UNSPOKEN = /[\p{P}\p{Z}\p{C}]/gu;

export function formatTokens(tokens: string[]): string {
  return tokens.join(" | ");
}

export function parseTokens(text: string): string[] {
  return text
    .split(SEPARATOR)
    .map((token) => token.trim())
    .filter(Boolean);
}

// Non-empty tokens must spell out the content, punctuation and spaces aside.
export function tokensMatch(content: string, tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  return tokens.join("").replace(UNSPOKEN, "") === content.replace(UNSPOKEN, "");
}
