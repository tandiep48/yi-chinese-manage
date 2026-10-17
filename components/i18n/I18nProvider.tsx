"use client";

// components/i18n/I18nProvider.tsx
// Client-side language context (EN / VI). For a signed-in user the account's saved
// language is the source of truth — the Flask backend reads it (get_current_lang)
// when it builds server-side content such as the lesson-trainer meaning options, so
// this provider loads it on mount and writes it back on change. localStorage holds
// the choice for guests and for an instant first paint before the account loads.

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  DEFAULT_LANG,
  SUPPORTED_LANGS,
  translate,
  type Lang,
  type TVars,
} from "@/lib/i18n";
import { loadUiLanguage, saveUiLanguage } from "@/lib/api/learner/userSettings";

const STORAGE_KEY = "ui_language";

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: TVars) => string;
}

const I18nCtx = createContext<I18nContextValue>({
  lang: DEFAULT_LANG,
  setLang: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  // Apply a language to React state, <html lang>, and the local cache.
  const applyLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore storage errors
    }
    if (typeof document !== "undefined") document.documentElement.lang = l;
  }, []);

  // Resolve the language on mount: show the saved choice (or the VI default) at
  // once, then reconcile with the signed-in account's saved preference — the source
  // of truth, which also drives server-built content like lesson-trainer options.
  // Guests and failures keep the local choice.
  useEffect(() => {
    let cancelled = false;

    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
    const resolved =
      saved && SUPPORTED_LANGS.includes(saved as Lang) ? (saved as Lang) : DEFAULT_LANG;
    if (resolved !== DEFAULT_LANG) setLangState(resolved);
    if (typeof document !== "undefined") document.documentElement.lang = resolved;

    // Reconcile with the account preference once it loads (async — safe to set here).
    loadUiLanguage().then((backend) => {
      if (cancelled || !backend || !SUPPORTED_LANGS.includes(backend as Lang)) return;
      applyLang(backend as Lang);
    });

    return () => {
      cancelled = true;
    };
  }, [applyLang]);

  // Changing the language persists to the account so the backend builds its content
  // (e.g. lesson-trainer options) in the same language; best-effort for guests.
  const setLang = useCallback(
    (l: Lang) => {
      applyLang(l);
      void saveUiLanguage(l).catch(() => {});
    },
    [applyLang]
  );

  const t = useCallback(
    (key: string, vars?: TVars) => translate(key, lang, vars),
    [lang]
  );

  return <I18nCtx.Provider value={{ lang, setLang, t }}>{children}</I18nCtx.Provider>;
}

export function useT(): I18nContextValue {
  return useContext(I18nCtx);
}
