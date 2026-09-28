"use client";

// components/i18n/I18nProvider.tsx
// Client-side language context (EN / VI). Persists the choice to localStorage.
// Wire to the backend user preference later.

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

  // Load the saved preference after mount (localStorage is client-only).
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LANGS.includes(saved as Lang)) {
      setLangState(saved as Lang);
      document.documentElement.lang = saved;
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore storage errors
    }
    document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (key: string, vars?: TVars) => translate(key, lang, vars),
    [lang]
  );

  return <I18nCtx.Provider value={{ lang, setLang, t }}>{children}</I18nCtx.Provider>;
}

export function useT(): I18nContextValue {
  return useContext(I18nCtx);
}
