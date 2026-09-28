// lib/han/hanConvert.ts
// Framework-agnostic port of Learning/web_app/static/shared/han_font.js — the
// GLOBAL traditional↔simplified converter driven by the user's `hanzi_script`
// setting, plus the `hanzi_font` stack. The Flask script walked the whole page
// and mutated Han text nodes in place; a single React component can't reach
// every page's hanzi at render time, so this stays a DOM-level transform. The
// React wrapper (components/han/HanziSettingsProvider) owns its lifecycle.
//
// Companion to lib/han/hanText.tsx (per-HSK-level *sizing*, done at render
// time). Sizing wraps runs in <span>; this converts the text nodes inside them.

export const DEFAULT_FONT = "Noto Sans";
export const DEFAULT_SCRIPT = "simplified";
export const HANZI_FONTS = [
  "SimSun",
  "Segoe UI",
  "Roboto",
  "Helvetica Neue",
  "Noto Sans",
] as const;
export const HANZI_SCRIPTS = ["simplified", "traditional"] as const;

export type HanziFont = (typeof HANZI_FONTS)[number];
export type HanziScript = (typeof HANZI_SCRIPTS)[number];

const ALLOWED_FONTS = new Set<string>(HANZI_FONTS);
const ALLOWED_SCRIPTS = new Set<string>(HANZI_SCRIPTS);

const OPENCC_CDN = "https://cdn.jsdelivr.net/npm/opencc-js@1.0.5/dist/umd/full.js";
// One or more Han ideographs (CJK unified + ext-A + compatibility).
const HAN_CHAR_RE = /[㐀-䶿一-鿿豈-﫿]/;
// Never touch text inside these — form controls (their value is data, not
// display) and anything the app explicitly opts out with [data-han-skip].
const SKIP_SELECTOR = "script,style,textarea,input,select,[data-han-skip]";

// --- font -------------------------------------------------------------------

// Roboto-first on purpose: Roboto carries no CJK glyphs, so Latin text keeps
// Roboto while only the ideographs fall through to the user's chosen face.
export function fontStack(font: string | null | undefined): string {
  const chosen = font && ALLOWED_FONTS.has(font) ? font : DEFAULT_FONT;
  return `Roboto, '${chosen}', 'Noto Sans', Helvetica, sans-serif`;
}

export function normalizeFont(font: string | null | undefined): HanziFont {
  return font && ALLOWED_FONTS.has(font) ? (font as HanziFont) : DEFAULT_FONT;
}

export function normalizeScript(script: string | null | undefined): HanziScript {
  return script && ALLOWED_SCRIPTS.has(script)
    ? (script as HanziScript)
    : DEFAULT_SCRIPT;
}

// --- OpenCC loader ----------------------------------------------------------

interface OpenCCConverter {
  (text: string): string;
}
interface OpenCCStatic {
  Converter(opts: { from: string; to: string }): OpenCCConverter;
}
declare global {
  interface Window {
    OpenCC?: OpenCCStatic;
  }
}

let openccPromise: Promise<OpenCCStatic | null> | null = null;

// Lazily inject the opencc-js UMD bundle (sets window.OpenCC). Cached so the
// script is fetched at most once; resolves null if it fails to load.
export function loadOpenCC(): Promise<OpenCCStatic | null> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.resolve(null);
  }
  if (window.OpenCC) return Promise.resolve(window.OpenCC);
  if (openccPromise) return openccPromise;

  openccPromise = new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = OPENCC_CDN;
    s.async = true;
    s.onload = () => resolve(window.OpenCC ?? null);
    s.onerror = () => {
      openccPromise = null; // allow a retry on the next toggle
      console.warn("Failed to load opencc-js");
      resolve(null);
    };
    document.head.appendChild(s);
  });
  return openccPromise;
}

// --- DOM converter ----------------------------------------------------------

interface NodeRecord {
  original: string;
  converted: string;
}

export interface HanConverter {
  /** Install (or clear, with null) the active converter and reflow the page. */
  setConverter(fn: OpenCCConverter | null): void;
  /** Begin watching the DOM for new/changed hanzi (no-op while unconverted). */
  start(): void;
  /** Stop watching. */
  stop(): void;
}

// Creates the singleton-style controller. Constructing it touches no globals;
// every method guards for a browser environment so it's safe to build in render.
export function createHanConverter(): HanConverter {
  let converter: OpenCCConverter | null = null;
  let observer: MutationObserver | null = null;
  // Per text-node memory of what we last wrote. Keyed by the live Text node, so
  // when React swaps a node's content out from under us we simply re-derive the
  // original from the new value (see convertTextNode) instead of trusting stale
  // cache — the React-safety fix over the legacy first-seen WeakMap.
  const records = new WeakMap<Text, NodeRecord>();

  const convertText = (text: string): string =>
    converter ? converter(text) : text;

  const convertTextNode = (node: Text): void => {
    const text = node.nodeValue;
    if (!text || !HAN_CHAR_RE.test(text)) return;
    const parent = node.parentElement;
    if (!parent || parent.closest(SKIP_SELECTOR)) return;

    const rec = records.get(node);
    if (rec && rec.converted === text) return; // already converted this value

    const converted = convertText(text);
    if (converted !== text) {
      records.set(node, { original: text, converted });
      node.nodeValue = converted;
    } else {
      records.delete(node);
    }
  };

  const convertAllIn = (root: Node): void => {
    if (root.nodeType === Node.TEXT_NODE) {
      convertTextNode(root as Text);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) convertTextNode(walker.currentNode as Text);
  };

  const convertAll = (): void => {
    if (typeof document !== "undefined" && document.body) {
      convertAllIn(document.body);
    }
  };

  const restoreAll = (): void => {
    if (typeof document === "undefined" || !document.body) return;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      const rec = records.get(node);
      if (rec && node.nodeValue === rec.converted) {
        node.nodeValue = rec.original;
      }
    }
  };

  return {
    setConverter(fn) {
      converter = fn;
      if (fn) convertAll();
      else restoreAll();
    },
    start() {
      if (typeof window === "undefined" || !window.MutationObserver) return;
      if (observer || !document.body) return;
      observer = new MutationObserver((mutations) => {
        if (!converter) return;
        for (const mut of mutations) {
          if (mut.type === "characterData") {
            if (mut.target.nodeType === Node.TEXT_NODE) {
              convertTextNode(mut.target as Text);
            }
          } else {
            mut.addedNodes.forEach((n) => convertAllIn(n));
          }
        }
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    },
    stop() {
      observer?.disconnect();
      observer = null;
    },
  };
}
