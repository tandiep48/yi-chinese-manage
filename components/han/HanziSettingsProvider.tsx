"use client";

// components/han/HanziSettingsProvider.tsx
// React lifecycle wrapper around lib/han/hanConvert — the global port of
// Learning/web_app/static/shared/han_font.js. Reads the signed-in user's
// hanzi_script / hanzi_font (mirrored from GET /api/auth/me via AuthProvider),
// converts all hanzi on the page traditional↔simplified, drives the
// --han-font-family CSS variable, and persists changes made from the nav
// control back to Flask. Must live inside AuthProvider.

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  createHanConverter,
  fontStack,
  loadOpenCC,
  normalizeFont,
  normalizeScript,
  DEFAULT_FONT,
  DEFAULT_SCRIPT,
  type HanConverter,
  type HanziFont,
  type HanziScript,
} from "@/lib/han/hanConvert";
import { saveHanziScript, saveHanziFont } from "@/lib/api/userSettings";

interface HanziSettingsValue {
  script: HanziScript;
  font: HanziFont;
  setScript: (s: HanziScript) => void;
  setFont: (f: HanziFont) => void;
}

const HanziCtx = createContext<HanziSettingsValue>({
  script: DEFAULT_SCRIPT,
  font: DEFAULT_FONT,
  setScript: () => {},
  setFont: () => {},
});

export function HanziSettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [script, setScriptState] = useState<HanziScript>(DEFAULT_SCRIPT);
  const [font, setFontState] = useState<HanziFont>(DEFAULT_FONT);

  // One DOM converter for the whole app. Built lazily (no globals touched at
  // construction, so it's safe during render).
  const ctrlRef = useRef<HanConverter | null>(null);
  if (ctrlRef.current === null) ctrlRef.current = createHanConverter();

  // Start watching the DOM once, mirroring han_font.js's startObserver(). It
  // no-ops until a converter is installed, so it's safe to run always-on.
  useEffect(() => {
    const ctrl = ctrlRef.current!;
    ctrl.start();
    return () => ctrl.stop();
  }, []);

  // Mirror the server-side preference whenever the auth user resolves/changes.
  // This is a sync FROM the server, so it must NOT re-POST (unlike setScript).
  useEffect(() => {
    setScriptState(normalizeScript(user?.hanzi_script));
    setFontState(normalizeFont(user?.hanzi_font));
  }, [user]);

  // Apply the active script: load OpenCC on demand for traditional, clear it
  // (and restore originals) for simplified. Cancellation guards a fast toggle
  // that flips back before the async bundle resolves.
  useEffect(() => {
    const ctrl = ctrlRef.current!;
    let cancelled = false;
    if (script === "traditional") {
      loadOpenCC().then((OpenCC) => {
        if (cancelled || !OpenCC) return;
        ctrl.setConverter(OpenCC.Converter({ from: "cn", to: "tw" }));
      });
    } else {
      ctrl.setConverter(null);
    }
    return () => {
      cancelled = true;
    };
  }, [script]);

  // Font is a CSS-variable swap; Roboto-first in the stack keeps Latin text on
  // Roboto and only reflows the ideographs (see fontStack).
  useEffect(() => {
    document.documentElement.style.setProperty("--han-font-family", fontStack(font));
  }, [font]);

  const loggedIn = !!user;

  const setScript = useCallback(
    (s: HanziScript) => {
      setScriptState(s);
      if (loggedIn) {
        saveHanziScript(s).catch((e) =>
          console.warn("Could not save Hanzi script:", e)
        );
      }
    },
    [loggedIn]
  );

  const setFont = useCallback(
    (f: HanziFont) => {
      setFontState(f);
      if (loggedIn) {
        saveHanziFont(f).catch((e) =>
          console.warn("Could not save Hanzi font:", e)
        );
      }
    },
    [loggedIn]
  );

  return (
    <HanziCtx.Provider value={{ script, font, setScript, setFont }}>
      {children}
    </HanziCtx.Provider>
  );
}

export function useHanziSettings(): HanziSettingsValue {
  return useContext(HanziCtx);
}
