// lib/i18n/index.ts
// Dotted-key translation lookup with English fallback and {var} interpolation.
// Mirrors the Learning app's service/i18n_service.py `t()` behaviour.

import en from "./en.json";
import vi from "./vi.json";

export type Lang = "en" | "vi";
export const SUPPORTED_LANGS: Lang[] = ["en", "vi"];
export const DEFAULT_LANG: Lang = "en";
export const LANG_LABELS: Record<Lang, string> = { en: "EN", vi: "VI" };

type Dict = Record<string, unknown>;
const DICTS: Record<Lang, Dict> = { en: en as Dict, vi: vi as Dict };

export type TVars = Record<string, string | number>;

function lookup(dict: Dict, key: string): string | undefined {
  let node: unknown = dict;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null || !(part in node)) return undefined;
    node = (node as Dict)[part];
  }
  return typeof node === "string" ? node : undefined;
}

export function translate(key: string, lang: Lang, vars?: TVars): string {
  let text = lookup(DICTS[lang], key) ?? lookup(DICTS.en, key) ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.split(`{${name}}`).join(String(value));
    }
  }
  return text;
}
