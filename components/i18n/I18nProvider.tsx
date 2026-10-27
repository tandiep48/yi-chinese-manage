"use client";

// components/i18n/I18nProvider.tsx
// Client-side language context (EN / VI). For a signed-in user the account's saved
// language is the source of truth — the Flask backend reads it (get_current_lang)
// when it builds server-side content such as the lesson-trainer meaning options, so
// this provider loads it on mount and writes it back on change. localStorage holds
// the choice for guests and for an instant first paint before the account loads.

import {
  createContext,
  Fragment,
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
import { clearReadCache } from "@/lib/api/readCache";
import { clearPassagesCache } from "@/lib/api/learner/lessons";

const STORAGE_KEY = "ui_language";

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: TVars) => string;
  // Bumped after a language change has been saved to the account and the server-built
  // caches dropped; I18nRemount keys off it to refetch mounted views in the new language.
  contentKey: number;
}

const I18nCtx = createContext<I18nContextValue>({
  lang: DEFAULT_LANG,
  setLang: () => {},
  t: (key) => key,
  contentKey: 0,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);
  const [contentKey, setContentKey] = useState(0);

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

  // Changing the language flips the UI strings at once, then persists to the account
  // so the backend builds its content (lesson titles, trainer options, …) in the same
  // language. Once that save lands, the caches holding the old-language server content
  // are dropped and contentKey is bumped so mounted views refetch. A guest (or a failed
  // save) keeps the instant front-end switch and leaves server content untouched.
  const setLang = useCallback(
    (l: Lang) => {
      applyLang(l);
      void (async () => {
        try {
          await saveUiLanguage(l);
          clearReadCache();
          clearPassagesCache();
          setContentKey((k) => k + 1);
        } catch {
          // Not signed in, or the save failed: front-end-only switch, as before.
        }
      })();
    },
    [applyLang]
  );

  const t = useCallback(
    (key: string, vars?: TVars) => translate(key, lang, vars),
    [lang]
  );

  return (
    <I18nCtx.Provider value={{ lang, setLang, t, contentKey }}>{children}</I18nCtx.Provider>
  );
}

export function useT(): I18nContextValue {
  return useContext(I18nCtx);
}

// Remounts its subtree whenever the account language changes (after the switch is
// saved and the server-content caches are cleared), so views built from server data
// refetch in the new language instead of showing the stale copy until navigation.
export function I18nRemount({ children }: { children: ReactNode }) {
  const { contentKey } = useT();
  return <Fragment key={contentKey}>{children}</Fragment>;
}
