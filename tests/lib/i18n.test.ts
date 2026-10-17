// @vitest-environment node
// tests/lib/i18n.test.ts
// Guards the learner-facing i18n contract: Vietnamese is the default, and the VI
// dictionary covers every key the EN one does. A key present in en.json but
// missing from vi.json silently falls back to English (lib/i18n/index.ts
// `translate`), which is exactly the "the trainer ignores my language" symptom —
// so parity is enforced here rather than left to review.

import { describe, expect, it } from "vitest";
import { DEFAULT_LANG, SUPPORTED_LANGS, translate } from "@/lib/i18n";
import en from "@/lib/i18n/en.json";
import vi from "@/lib/i18n/vi.json";

type Dict = Record<string, unknown>;

// Dotted leaf keys of a nested dictionary: { a: { b: "x" } } -> ["a.b"].
function leafKeys(dict: Dict, prefix = ""): string[] {
  return Object.entries(dict).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    return v && typeof v === "object" && !Array.isArray(v)
      ? leafKeys(v as Dict, key)
      : [key];
  });
}

describe("i18n defaults", () => {
  it("defaults to Vietnamese", () => {
    expect(DEFAULT_LANG).toBe("vi");
  });

  it("supports exactly EN and VI", () => {
    expect(SUPPORTED_LANGS).toEqual(["en", "vi"]);
  });
});

describe("dictionary parity (no English fallback leaks)", () => {
  const enKeys = leafKeys(en as Dict);
  const viKeys = new Set(leafKeys(vi as Dict));

  it("vi.json defines every key en.json does", () => {
    const missing = enKeys.filter((k) => !viKeys.has(k));
    expect(missing).toEqual([]);
  });

  // The trainers were the reported offender, so assert their namespaces are not
  // just present but actually Vietnamese — a key copied verbatim from English
  // reads as "ignoring the language" even though the lookup succeeds. (Other
  // namespaces legitimately share terms like "Pinyin" / "HSK", so this is scoped
  // to the trainer surfaces rather than applied dictionary-wide.)
  it("translates the trainer namespaces (no copied-English values)", () => {
    const trainerNs = ["vocab_trainer", "lesson", "train_picker", "trainer", "competition", "milestone"];
    const inTrainer = (k: string) => trainerNs.some((n) => k === n || k.startsWith(`${n}.`));
    const identical = enKeys.filter((k) => {
      if (!inTrainer(k)) return false;
      const e = translate(k, "en");
      return typeof e === "string" && /[A-Za-z]/.test(e) && translate(k, "vi") === e;
    });
    expect(identical).toEqual([]);
  });
});

describe("translate", () => {
  it("interpolates {vars}", () => {
    expect(translate("picker.lessons_available", "vi", { count: 3 })).toContain("3");
  });

  it("returns the key when it is unknown in both dictionaries", () => {
    expect(translate("no.such.key.exists", "vi")).toBe("no.such.key.exists");
  });
});
