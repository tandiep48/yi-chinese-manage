// lib/han/hanText.tsx
// Render-time port of Learning/web_app/static/shared/han_text.js — sizes CJK
// runs by HSK level. The legacy script walked the DOM and wrapped Han text nodes
// in <span class="hsk-sized-han">; here we do it at render time so the markup
// stays React-managed (no post-render DOM mutation to reconcile against).
//
// The legacy script also called window.HanziSettings.convertText() for the
// traditional↔simplified user setting — that global converter is intentionally
// NOT ported here (tracked separately); text renders as stored.

import { Fragment, type ReactNode } from "react";

// A run is one or more Han ideographs plus adjacent CJK punctuation / fullwidth
// chars and embedded ASCII digits/spaces (so "9点25" sizes together). Requires
// at least one ideograph, so bare Latin numbers ("1.") are left untouched.
const HAN_TEXT_RE =
  /([　-〿＀-･ 0-9]*[㐀-䶿一-鿿豈-﫿][㐀-䶿一-鿿豈-﫿　-〿＀-･ 0-9]*)/g;

export function normalizeHskLevel(level: number | string | null | undefined): number | null {
  const match = String(level ?? "").match(/(?:HSK|H)?\s*(\d+)/i);
  return match ? Number(match[1]) : null;
}

// Font size for a level, matching fontSizeForLevel() in han_text.js.
export function fontSizeForLevel(level: number | string | null | undefined): string {
  const hsk = normalizeHskLevel(level);
  if (hsk === 1 || hsk === 2) return "32px";
  if (hsk === 3 || hsk === 4) return "28px";
  if (hsk === 5 || hsk === 6) return "24px";
  return "";
}

// Split `text`, wrapping Han runs in a sized <span> when the level has a size.
export function hanNodes(
  text: string | null | undefined,
  level: number | string | null | undefined
): ReactNode {
  const value = text ?? "";
  const size = fontSizeForLevel(level);
  if (!size || !value) return value;

  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  HAN_TEXT_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = HAN_TEXT_RE.exec(value)) !== null) {
    if (m[0].length === 0) {
      HAN_TEXT_RE.lastIndex++;
      continue;
    }
    if (m.index > lastIndex) parts.push(value.slice(lastIndex, m.index));
    parts.push(
      <span key={key++} className="hsk-sized-han" style={{ fontSize: size }}>
        {m[0]}
      </span>
    );
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < value.length) parts.push(value.slice(lastIndex));
  return <>{parts.map((p, i) => (typeof p === "string" ? <Fragment key={`t${i}`}>{p}</Fragment> : p))}</>;
}

// Convenience component: <HanText text={...} level={...} />
export function HanText({
  text,
  level,
}: {
  text: string | null | undefined;
  level: number | string | null | undefined;
}) {
  return <>{hanNodes(text, level)}</>;
}
